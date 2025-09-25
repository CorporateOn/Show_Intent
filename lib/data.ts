// FIXED: All types are now imported from the central types file
import { SavableState, FoodItem, Category } from '@/types';
import { createClient } from '@supabase/supabase-js';

// Ensure your environment variables are set
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    throw new Error("Supabase URL or Service Key is not defined in environment variables.");
}

// Create a single, reusable Supabase client for the server-side
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

const SETTINGS_ROW_ID = 1;

// This function creates the initial default data if the database is empty
async function initializeDb(): Promise<void> {
    console.log("Database tables are empty. Initializing with default values...");
    
    // 1. Insert default settings
    const { error: settingsError } = await supabase
        .from('settings')
        .insert({ id: SETTINGS_ROW_ID }); // Inserts the default values from the table definition
    
    if (settingsError) throw new Error(`Could not initialize settings: ${settingsError.message}`);

    // 2. Insert default categories
    const defaultCategories = ['Appetizers', 'Main Courses', 'Desserts', 'Drinks'];
    const { data: insertedCategories, error: categoriesError } = await supabase
        .from('categories')
        .insert(defaultCategories.map(name => ({ name })))
        .select();

    if (categoriesError) throw new Error(`Could not initialize categories: ${categoriesError.message}`);

    // 3. (Optional) Insert a sample menu item
    if (insertedCategories && insertedCategories.length > 0) {
        const { error: menuItemError } = await supabase.from('menu_items').insert({
            name: 'Sample Burger',
            description: 'A delicious sample burger to get you started.',
            price: 9.99,
            category_id: insertedCategories[0].id, // Assign to the first category
            is_available: true,
            image_url: `https://pzumvjvsvbvyhtvvyxvy.supabase.co/storage/v1/object/public/menu-images/sample-burger.png` // A default placeholder image
        });
        if (menuItemError) console.error("Could not add sample menu item:", menuItemError.message);
    }
}

// Reads data from all tables and assembles it into the SavableState object
export async function readDb(): Promise<SavableState> {
  try {
    const [settingsResult, categoriesResult, menuItemsResult] = await Promise.all([
        supabase.from('settings').select('*').eq('id', SETTINGS_ROW_ID).single(),
        supabase.from('categories').select('*'),
        supabase.from('menu_items').select('*, category:categories(name)')
    ]);

    if (settingsResult.error && settingsResult.error.code === 'PGRST116') {
        await initializeDb();
        return await readDb(); // Retry after initialization
    }
    
    if (settingsResult.error) throw settingsResult.error;
    if (categoriesResult.error) throw categoriesResult.error;
    if (menuItemsResult.error) throw menuItemsResult.error;

    const settings = settingsResult.data;
    const categories: Category[] = categoriesResult.data.map(c => c.name);
    
    const menuItems: FoodItem[] = menuItemsResult.data.map((item: any) => ({
        id: item.id.toString(),
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category?.name || 'Uncategorized',
        image: item.image_url,
        isAvailable: item.is_available
    }));

    const state: SavableState = {
        restaurantName: settings.restaurant_name,
        currency: settings.currency,
        adminPassword: settings.admin_password,
        waiterPassword: settings.waiter_password,
        backgroundImage: settings.background_image_url,
        headerBgColor: settings.header_bg_color,
        headerTextColor: settings.header_text_color,
        logoUrl: settings.logo_url,
        logoType: settings.logo_type,
        textColor: settings.text_color,
        categories,
        menuItems
    };
    
    return state;

  } catch (error) {
    console.error('Error reading from Supabase:', error);
    throw new Error('Could not read from database.');
  }
}

// !!!!!!!!!!! THE FIX IS HERE !!!!!!!!!!!
// Ensure this function has the 'export' keyword in front of it.
export async function writeDb(data: SavableState) {
  try {
    // 1. Update the single row in settings
    await supabase
        .from('settings')
        .update({
            restaurant_name: data.restaurantName,
            currency: data.currency,
            admin_password: data.adminPassword,
            waiter_password: data.waiterPassword,
            background_image_url: data.backgroundImage,
            header_bg_color: data.headerBgColor,
            header_text_color: data.headerTextColor,
            logo_url: data.logoUrl,
            logo_type: data.logoType,
            text_color: data.textColor,
        })
        .eq('id', SETTINGS_ROW_ID);

    // 2. Synchronize Categories
    const { data: dbCategories } = await supabase.from('categories').select('id, name');
    if (!dbCategories) throw new Error('Could not fetch categories for sync.');
    const appCategoryNames = new Set(data.categories);
    const dbCategoryNames = new Set(dbCategories.map(c => c.name));
    const categoriesToAdd = data.categories.filter(name => !dbCategoryNames.has(name));
    const categoriesToDelete = dbCategories.filter(c => !appCategoryNames.has(c.name));
    if (categoriesToAdd.length > 0) {
        await supabase.from('categories').insert(categoriesToAdd.map(name => ({ name })));
    }
    if (categoriesToDelete.length > 0) {
        await supabase.from('categories').delete().in('id', categoriesToDelete.map(c => c.id));
    }
    
    // 3. Synchronize Menu Items
    const { data: allCategoriesAfterSync } = await supabase.from('categories').select('id, name');
    if (!allCategoriesAfterSync) throw new Error('Could not fetch categories for item sync.');
    const categoryNameToIdMap = new Map(allCategoriesAfterSync.map(c => [c.name, c.id]));
    
    const appItemIds = new Set(data.menuItems.map(item => item.id));
    const { data: dbItems } = await supabase.from('menu_items').select('id');
    if(!dbItems) throw new Error('Could not fetch menu items for sync.');
    const itemsToDelete = dbItems.filter(item => !appItemIds.has(item.id));
    if (itemsToDelete.length > 0) {
        await supabase.from('menu_items').delete().in('id', itemsToDelete.map(item => item.id));
    }

    const menuItemsToUpsert = data.menuItems.map(item => ({
        id: item.id.startsWith('item-') ? undefined : item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        image_url: item.image,
        is_available: item.isAvailable,
        category_id: categoryNameToIdMap.get(item.category)
    }));
    
    if (menuItemsToUpsert.length > 0) {
        const { error: menuItemsError } = await supabase.from('menu_items').upsert(menuItemsToUpsert);
        if (menuItemsError) throw new Error(`Menu items sync failed: ${menuItemsError.message}`);
    }

  } catch (error) {
    console.error('Error writing to Supabase:', error);
    throw new Error('Could not write to database.');
  }
}

// This function is also exported correctly
export async function getInitialServerData() {
    console.log("Fetching initial data from Supabase on the server...");
    const data = await readDb();
    console.log("Initial data fetched successfully.");
    return data;
}