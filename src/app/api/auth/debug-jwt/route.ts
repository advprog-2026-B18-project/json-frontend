import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/auth';
import * as auth from '@/lib/auth';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('refresh_token')?.value;

  if (!token) {
    console.log('[debug-jwt] No refresh_token cookie found');
    return NextResponse.json({ error: 'Not logged in — no refresh_token cookie' }, { status: 401 });
  }

  console.log('[debug-jwt] Token found, calling verifyJwt...');

  const payload = await verifyJwt(token);

  console.log('[debug-jwt] verifyJwt result:', payload);

  return NextResponse.json({
    hasToken: true,
    tokenPreview: token.substring(0, 20) + '...',
    tokenLength: token.length,
    verified: payload !== null,
    payload,
  });
}
