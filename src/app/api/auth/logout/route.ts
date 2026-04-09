import { NextRequest, NextResponse } from 'next/server';

type BackendLogoutSuccessResponse = {
  message: string;
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
  const authorization = request.headers.get('authorization');
  if (!authorization) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const refreshToken = request.cookies.get('refresh_token')?.value;
  if (!refreshToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const baseUrl = getAuthBaseUrl();
  const res = await fetch(`${baseUrl}/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authorization,
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  const data = (await readJsonSafe(res)) as BackendLogoutSuccessResponse | { message?: string } | null;

  if (!res.ok) {
    return NextResponse.json(data ?? { message: 'Unauthorized' }, { status: res.status });
  }

  const typed = data as BackendLogoutSuccessResponse;

  const response = NextResponse.json({ message: typed.message }, { status: 200 });
  response.cookies.set({
    name: 'refresh_token',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
