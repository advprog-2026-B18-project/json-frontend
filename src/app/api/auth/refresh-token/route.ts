import { NextRequest, NextResponse } from 'next/server';

type BackendRefreshSuccessResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

function getAuthBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_API_AUTH;
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_API_AUTH is not set');
  }
  return baseUrl;
}

async function readJsonSafe(res: Response): Promise<unknown | null> {
  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get('refresh_token')?.value;
  if (!refreshToken) {
    return NextResponse.json({ message: 'Invalid or expired refresh token' }, { status: 401 });
  }

  const baseUrl = getAuthBaseUrl();
  const res = await fetch(`${baseUrl}/auth/refresh-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  const data = (await readJsonSafe(res)) as BackendRefreshSuccessResponse | { message?: string } | null;

  if (!res.ok) {
    return NextResponse.json(data ?? { message: 'Invalid or expired refresh token' }, { status: res.status });
  }

  const typed = data as BackendRefreshSuccessResponse;
  const response = NextResponse.json(
    {
      access_token: typed.access_token,
      expires_in: typed.expires_in,
    },
    { status: 200 }
  );

  response.cookies.set({
    name: 'refresh_token',
    value: typed.refresh_token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  return response;
}
