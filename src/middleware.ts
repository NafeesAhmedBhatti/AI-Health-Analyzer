import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes that never require authentication
  const isPublicRoute =
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/api/auth/');

  if (isPublicRoute) {
    // If already logged in and trying to access login/register, redirect to dashboard
    if ((pathname.startsWith('/login') || pathname.startsWith('/register'))) {
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
      if (token) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }
    return NextResponse.next();
  }

  // API routes: pass through — API handles auth internally via getUserId()
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (token?.id) {
      response.headers.set('x-user-id', token.id as string);
    }
    return response;
  }

  // Dashboard routes: check for authentication
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    // Redirect to login page
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Add user ID header for downstream use
  const response = NextResponse.next();
  response.headers.set('x-user-id', token.id as string);
  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*', '/login', '/register'],
};