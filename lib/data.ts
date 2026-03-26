import { SavableState, FoodItem, Category } from '@/types';
import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    throw new Error("Supabase URL or Service Key is not defined in environment variables.");
}
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);
const SETTINGS_ROW_ID = 1;

let initializationPromise: Promise<SavableState> | null = null;

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
        aboutDescription: '',
        aboutLocation: '',
        aboutPhone: '',
        aboutEmail: '',
        aboutOwnerName: '',
        aboutOwnerTitle: '',
        aboutOwnerQuote: '',
        aboutOwnerStory: '',
        aboutOwnerImage: '',
        aboutMotivationQuotes: [],
        aboutMapEmbed: '',
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
        if (error.code === '23505') {
            console.warn("Race condition detected. Fetching existing data...");
            return readDb();
        }
        throw new Error(`Could not initialize database: ${error.message}`);
    } finally {
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

    if (settingsResult.error && settingsResult.error.code === 'PGRST116') {
        if (!initializationPromise) {
            initializationPromise = _initializeDbAndGetData();
        }
        return initializationPromise;
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
        takeawayPrice: item.takeaway_price ?? 0,
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
        menuItems,
        aboutDescription: settings.about_description || '',
        aboutLocation: settings.about_location || '',
        aboutPhone: settings.about_phone || '',
        aboutEmail: settings.about_email || '',
        aboutOwnerName: settings.about_owner_name || '',
        aboutOwnerTitle: settings.about_owner_title || '',
        aboutOwnerQuote: settings.about_owner_quote || '',
        aboutOwnerStory: settings.about_owner_story || '',
        aboutOwnerImage: settings.about_owner_image_url || '',
        aboutMotivationQuotes: settings.about_motivation_quotes || [],
        aboutMapEmbed: settings.about_map_embed || '',
    };
    
  } catch (error) {
    console.error('Error reading from Supabase:', error);
    throw new Error('Could not read from database.');
  }
}

export async function writeDb(data: SavableState) {
  try {
    // 1. Update settings
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
            about_description: data.aboutDescription,
            about_location: data.aboutLocation,
            about_phone: data.aboutPhone,
            about_email: data.aboutEmail,
            about_owner_name: data.aboutOwnerName,
            about_owner_title: data.aboutOwnerTitle,
            about_owner_quote: data.aboutOwnerQuote,
            about_owner_story: data.aboutOwnerStory,
            about_owner_image_url: data.aboutOwnerImage,
            about_motivation_quotes: data.aboutMotivationQuotes,
            about_map_embed: data.aboutMapEmbed,
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
    
    // Delete items that are no longer in the app
    const appItemIds = new Set(data.menuItems.map(item => item.id));
    const { data: dbItems } = await supabase.from('menu_items').select('id');
    if(!dbItems) throw new Error('Could not fetch menu items for sync.');
    const itemsToDelete = dbItems.filter(item => !appItemIds.has(item.id));
    if (itemsToDelete.length > 0) {
        await supabase.from('menu_items').delete().in('id', itemsToDelete.map(item => item.id));
    }

    const itemsToInsert = [];
    const itemsToUpdate = [];

    for (const item of data.menuItems) {
        const dbItemPayload = {
            name: item.name,
            description: item.description,
            price: item.price,
            takeaway_price: item.takeawayPrice,
            image_url: item.image,
            is_available: item.isAvailable,
            category_id: categoryNameToIdMap.get(item.category)
        };

        if (item.id.startsWith('item-')) {
            itemsToInsert.push(dbItemPayload);
        } else {
            itemsToUpdate.push({ id: item.id, ...dbItemPayload });
        }
    }

    if (itemsToInsert.length > 0) {
        const { error: insertError } = await supabase.from('menu_items').insert(itemsToInsert);
        if (insertError) throw new Error(`Menu items insert failed: ${insertError.message}`);
    }

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