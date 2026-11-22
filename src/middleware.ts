import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const AUTH_SECRET = process.env.NEXTAUTH_SECRET || 'ai-health-analyzer-jwt-secret-key';

async function getAuthToken(req: NextRequest) {
  const tSecure = await getToken({ req, secret: AUTH_SECRET, secureCookie: true }).catch(() => null);
  if (tSecure) return tSecure;
  const tPlain = await getToken({ req, secret: AUTH_SECRET, secureCookie: false }).catch(() => null);
  return tPlain;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes that never require authentication
  const isPublicRoute =
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/api/auth/');

  if (isPublicRoute) {
    if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
      const token = await getAuthToken(req);
      if (token) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }
    return NextResponse.next();
  }

  // API routes: pass through — API handles auth internally via getUserId()
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    const token = await getAuthToken(req);
    if (token?.id) {
      response.headers.set('x-user-id', token.id as string);
    }
    return response;
  }

  // Dashboard routes: check for authentication
  const token = await getAuthToken(req);

  if (!token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();
  response.headers.set('x-user-id', token.id as string);
  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*', '/login', '/register'],
};
