import { SavableState, FoodItem, Category } from '@/types';
import { createClient } from '@supabase/supabase-js';

// Standard Supabase client setup
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    throw new Error("Supabase URL or Service Key is not defined in environment variables.");
}
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);
const SETTINGS_ROW_ID = 1;

// ========= RACE CONDITION PREVENTION =========
// This variable will hold the promise of the initialization task.
// This ensures that even if _initializeDb is called 100 times simultaneously,
// the actual database operations will only run ONCE.
let initializationPromise: Promise<SavableState> | null = null;
// ===========================================

async function _initializeDbAndGetData(): Promise<SavableState> {
    console.log("Database is empty. Starting initialization...");
    
    const defaultCategories = ['Appetizers', 'Main Courses', 'Desserts', 'Drinks'];
    const defaultData: SavableState = {
        restaurantName: 'My Awesome Restaurant',
        currency: '$',
        adminPassword: 'password',
        waiterPassword: 'password',
        backgroundImage: '',
        headerBgColor: 'rgba(255, 255, 255, 0.8)',
        headerTextColor: '#1e293b',
        logoUrl: '',
        logoType: 'text',
        textColor: '#1e293b',
        categories: defaultCategories,
        menuItems: [],
    };

    try {
        await supabase.from('settings').insert({ 
            id: SETTINGS_ROW_ID,
            restaurant_name: defaultData.restaurantName,
            currency: defaultData.currency,
            admin_password: defaultData.adminPassword,
            waiter_password: defaultData.waiterPassword,
        });
        await supabase.from('categories').insert(defaultCategories.map(name => ({ name })));
        
        console.log("Database initialized successfully.");
        return defaultData;

    } catch (error: any) {
        if (error.code === '23505') { // 'unique_violation'
            console.warn("Race condition detected. Another process finished initialization first. Fetching existing data...");
            // If we lost the race, the data now exists, so we can just read it.
            return readDb(); 
        }
        throw new Error(`Could not initialize database: ${error.message}`);
    } finally {
        // Clear the promise so it can be re-run in the future if the DB is cleared again.
        initializationPromise = null;
    }
}

export async function readDb(): Promise<SavableState> {
  try {
    const [settingsResult, categoriesResult, menuItemsResult] = await Promise.all([
        supabase.from('settings').select('*').eq('id', SETTINGS_ROW_ID).single(),
        supabase.from('categories').select('*'),
        supabase.from('menu_items').select('*, category:categories(name)')
    ]);

    // Check specifically for the "Row not found" error
    if (settingsResult.error && settingsResult.error.code === 'PGRST116') {
        if (!initializationPromise) {
            initializationPromise = _initializeDbAndGetData();
        }
        // All concurrent callers will wait for the SAME promise to resolve.
        return initializationPromise;
    }
    
    if (settingsResult.error) throw settingsResult.error;
    if (categoriesResult.error) throw categoriesResult.error;
    if (menuItemsResult.error) throw menuItemsResult.error;

    // --- If data exists, assemble and return it ---
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

    return {
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
    
  } catch (error) {
    console.error('Error reading from Supabase:', error);
    throw new Error('Could not read from database.');
  }
}

export async function writeDb(data: SavableState) {
  try {
    // 1. Update settings (this part is correct)
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

    // 2. Synchronize Categories (this part is correct)
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
    
    // =================================================================
    // 3. Synchronize Menu Items (COMPLETELY REWRITTEN FOR ROBUSTNESS)
    // =================================================================
    const { data: allCategoriesAfterSync } = await supabase.from('categories').select('id, name');
    if (!allCategoriesAfterSync) throw new Error('Could not fetch categories for item sync.');
    const categoryNameToIdMap = new Map(allCategoriesAfterSync.map(c => [c.name, c.id]));
    
    // First, handle deletions
    const appItemIds = new Set(data.menuItems.map(item => item.id));
    const { data: dbItems } = await supabase.from('menu_items').select('id');
    if(!dbItems) throw new Error('Could not fetch menu items for sync.');
    const itemsToDelete = dbItems.filter(item => !appItemIds.has(item.id));
    if (itemsToDelete.length > 0) {
        await supabase.from('menu_items').delete().in('id', itemsToDelete.map(item => item.id));
    }

    // Next, separate new items from existing items
    const itemsToInsert = [];
    const itemsToUpdate = [];

    for (const item of data.menuItems) {
        // Create a common data structure for the item
        const dbItemPayload = {
            name: item.name,
            description: item.description,
            price: item.price,
            image_url: item.image,
            is_available: item.isAvailable,
            category_id: categoryNameToIdMap.get(item.category)
        };

        if (item.id.startsWith('item-')) {
            // This is a NEW item. Push it to the insert array WITHOUT an ID.
            itemsToInsert.push(dbItemPayload);
        } else {
            // This is an EXISTING item. Push it to the update array WITH its ID.
            itemsToUpdate.push({ id: item.id, ...dbItemPayload });
        }
    }

    // Perform the INSERT operation for new items
    if (itemsToInsert.length > 0) {
        const { error: insertError } = await supabase.from('menu_items').insert(itemsToInsert);
        if (insertError) throw new Error(`Menu items insert failed: ${insertError.message}`);
    }

    // Perform the UPSERT operation for existing items (this will update them)
    if (itemsToUpdate.length > 0) {
        const { error: updateError } = await supabase.from('menu_items').upsert(itemsToUpdate);
        if (updateError) throw new Error(`Menu items update failed: ${updateError.message}`);
    }

  } catch (error) {
    console.error('Error writing to Supabase:', error);
    throw new Error('Could not write to database.');
  }
}

export async function getInitialServerData() {
    console.log("Fetching initial data from Supabase on the server...");
    const data = await readDb();
    console.log("Initial data fetched successfully.");
    return data;
}