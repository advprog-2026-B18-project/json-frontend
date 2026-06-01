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

async function refreshTokenOnBackend(token: string): Promise<string | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL;
    if (!baseUrl) return null;

    const res = await fetch(`${baseUrl}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: token }),
    });
    if (!res.ok) return null;

    const body = await res.json().catch(() => null) as {
      success?: boolean;
      data?: { refresh_token?: string };
    } | null;

    return body?.data?.refresh_token ?? null;
  } catch {
    return null;
  }
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

    let payload = await verifyJwt(token);
    let newToken: string | undefined;

    if (!isLoggedIn(payload)) {
      const refreshed = await refreshTokenOnBackend(token);
      if (refreshed) {
        payload = await verifyJwt(refreshed);
        if (isLoggedIn(payload)) newToken = refreshed;
      }
    }

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

    const response = NextResponse.next({ request: { headers: requestHeaders } });
    if (newToken) {
      response.cookies.set({
        name: REFRESH_TOKEN_COOKIE,
        value: newToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
    }
    return response;
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