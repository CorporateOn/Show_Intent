
import { kv } from '@vercel/kv';
import { SavableState } from '@/context/AppContext';

const DB_KEY = 'restaurant_data';

// This function creates the initial default data if the database is empty
async function initializeDb(): Promise<SavableState> {
    console.log("Database is empty. Initializing with default values...");
    const defaultData: SavableState = {
        restaurantName: 'My Awesome Restaurant',
        currency: '$',
        adminPassword: 'password',
        waiterPassword: 'password',
        backgroundImage: '',
        headerBgColor: 'rgba(255, 255, 255, 0.8)',
        headerTextColor: '#1e293b',
        categories: ['Appetizers', 'Main Courses', 'Desserts', 'Drinks'],
        menuItems: [],
        logoUrl: '',
        logoType: 'text',
        textColor: '#1e293b',
    };
    await kv.set(DB_KEY, defaultData);
    return defaultData;
}

export async function readDb(): Promise<SavableState> {
  try {
    let data: SavableState | null = await kv.get(DB_KEY);
    if (!data) {
        data = await initializeDb();
    }
    return data;
  } catch (error) {
    console.error('Error reading from Vercel KV:', error);
    throw new Error('Could not read from database.');
  }
}

export async function writeDb(data: SavableState) {
  try {
    await kv.set(DB_KEY, data);
  } catch (error) {
    console.error('Error writing to Vercel KV:', error);
    throw new Error('Could not write to database.');
  }
}

export async function getInitialServerData() {
    console.log("Fetching initial data from Vercel KV on the server...");
    const data = await readDb();
    console.log("Initial data fetched successfully.");
    return data;
}