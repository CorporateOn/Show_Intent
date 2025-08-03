import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (e) {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;

  // Protect /admin route
  if (pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login?role=admin', request.url));
    }
    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/login?role=admin', request.url));
    }
  }

  // Protect /waiter route
  if (pathname.startsWith('/waiter')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login?role=waiter', request.url));
    }
    const payload = await verifyToken(token);
    if (!payload || (payload.role !== 'waiter' && payload.role !== 'admin')) {
      return NextResponse.redirect(new URL('/login?role=waiter', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/waiter/:path*'],
};
