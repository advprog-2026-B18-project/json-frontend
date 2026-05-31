import { decodeJwt, jwtVerify, type JWTPayload } from 'jose';

export type JwtUserPayload = JWTPayload & {
  email?: string;
  role?: 'TITIPERS' | 'JASTIPER' | 'ADMIN';
};

function getJwtSecret(): Uint8Array {
  const rawSecret = process.env.JWT_SECRET;
  if (!rawSecret) {
    throw new Error('JWT_SECRET is not set');
  }

  const sanitized = rawSecret.replace(/\s/g, '');

  if (rawSecret !== sanitized) {
    console.warn(
      `[auth] JWT_SECRET contained hidden whitespace (length: ${rawSecret.length} → ${sanitized.length}). Stripped to avoid verification failure.`
    );
  }

  return new TextEncoder().encode(sanitized);
}

export async function verifyJwt(token: string): Promise<JwtUserPayload | null> {
  try {
    const jwtSecret = getJwtSecret();

    try {
      const unsafePayload = decodeJwt(token);
      console.log('[auth] Decoded payload:', unsafePayload);
    } catch {
      console.log('[auth] Token is not a valid JWT');
    }

    const { payload } = await jwtVerify(token, jwtSecret, { algorithms: ['HS256'] });
    return payload as JwtUserPayload;
  } catch (error) {
    console.error('[auth] JWT verification failed:', error);
    return null;
  }
}

export const isLoggedIn = (payload: JwtUserPayload | null): payload is JwtUserPayload => {
  return Boolean(payload?.sub && payload?.role);
};

function hasRole(payload: JwtUserPayload | null, role: string): boolean {
  return payload?.role === role;
}

export const isAdmin = (payload: JwtUserPayload | null): boolean => hasRole(payload, 'ADMIN');
export const isTitipers = (payload: JwtUserPayload | null): boolean => hasRole(payload, 'TITIPERS');
export const isJastiper = (payload: JwtUserPayload | null): boolean => hasRole(payload, 'JASTIPER');
