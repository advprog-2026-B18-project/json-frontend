import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAdmin, isJastiper, isLoggedIn, verifyJwt } from './src/lib/auth';

const REFRESH_TOKEN_COOKIE = 'refresh_token';
const LOGIN_PATH = '/login';

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL(LOGIN_PATH, request.url);
  loginUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  const isAdminRoute = pathname.startsWith('/admin');
  const isJastiperProtectedRoute =
      pathname.startsWith('/jastiper/orders') ||
      pathname.startsWith('/jastiper/catalog') ||
      pathname.startsWith('/jastiper/dashboard') ||
      pathname.startsWith('/jastiper/wallet');
  const isGeneralProtectedRoute =
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/profile') ||
      pathname.startsWith('/orders') ||
      pathname.startsWith('/wallet');

  if (isAdminRoute || isJastiperProtectedRoute || isGeneralProtectedRoute) {
    if (!token) return redirectToLogin(request);

    const payload = await verifyJwt(token);
    if (!isLoggedIn(payload)) return redirectToLogin(request);

    if (isAdminRoute && !isAdmin(payload)) {
      return redirectToLogin(request);
    }

    if (isJastiperProtectedRoute && !isJastiper(payload)) {
      return redirectToLogin(request);
    }

    const requestHeaders = new Headers(request.headers);
    if (payload?.sub) requestHeaders.set('x-user-id', payload.sub);
    if (payload?.role) requestHeaders.set('x-role', payload.role);

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/jastiper/orders/:path*',
    '/jastiper/catalog/:path*',
    '/jastiper/dashboard/:path*',
    '/jastiper/wallet/:path*',
    '/dashboard/:path*',
    '/profile/:path*',
    '/orders/:path*',
    '/wallet/:path*',
  ],
};