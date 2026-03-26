import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function GET(request: Request) {
  try {
    const cookieStore = await import('next/headers');
    const cookies = await cookieStore.cookies();
    const token = cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false });
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      return NextResponse.json({
        authenticated: true,
        role: payload.role,
        branchId: payload.branchId,
      });
    } catch (e) {
      return NextResponse.json({ authenticated: false });
    }
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}