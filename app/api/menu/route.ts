import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/data';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

let menuCache: any = null;

async function getMenuData() {
    if (menuCache) {
        return menuCache;
    }
    const db = await readDb();
    const data = {
        restaurantName: db.restaurantName,
        currency: db.currency,
        adminPassword: db.adminPassword,
        waiterPassword: db.waiterPassword,
        backgroundImage: db.backgroundImage,
        headerBgColor: db.headerBgColor,
        headerTextColor: db.headerTextColor,
        categories: db.categories,
        menuItems: db.menuItems,
    };
    menuCache = data;
    return data;
}
function invalidateMenuCache() {
    menuCache = null;
}

async function verifyAdmin(request: Request) {
    const tokenCookie = (await cookies()).get('auth_token');
    const token = tokenCookie?.value;
    if (!token) return false;
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload.role === 'admin';
    } catch (e) {
        return false;
    }
}

export async function GET() {
  try {
    const data = await getMenuData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch menu data:', error);
    return NextResponse.json({ error: 'Failed to fetch menu data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  try {
    const updatedData = await request.json();
    await writeDb(updatedData);
    invalidateMenuCache();
    return NextResponse.json({ success: true, message: 'Settings saved successfully' });
  } catch (error) {
    console.error('Failed to save settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}