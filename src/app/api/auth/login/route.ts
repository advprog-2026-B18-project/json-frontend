import { NextResponse } from 'next/server';

type BackendLoginSuccessResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: 'Bearer';
  user: {
    user_id: string | number;
    email: string;
    role: string;
    username: string;
    status: string;
  };
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

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: 'Body tidak valid.' }, { status: 400 });
  }

  const baseUrl = getAuthBaseUrl();
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = (await readJsonSafe(res)) as BackendLoginSuccessResponse | { message?: string } | null;

  if (!res.ok) {
    return NextResponse.json(data ?? { message: 'Login gagal.' }, { status: res.status });
  }

  const typed = data as BackendLoginSuccessResponse;

  const response = NextResponse.json(
    {
      access_token: typed.access_token,
      expires_in: typed.expires_in,
      token_type: typed.token_type,
      user: typed.user,
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
