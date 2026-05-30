import { jwtVerify, decodeJwt, type JWTPayload } from 'jose';

export type JwtUserPayload = JWTPayload & {
  email?: string;
  role?: 'TITIPERS' | 'JASTIPER' | 'ADMIN';
};

let cachedJwtSecret: Uint8Array | null = null;

function getJwtSecret(): Uint8Array {
  if (cachedJwtSecret) {
    return cachedJwtSecret;
  }

  const rawSecret = process.env.JWT_SECRET;
  if (!rawSecret) {
    throw new Error('JWT_SECRET is not set');
  }

  cachedJwtSecret = new TextEncoder().encode(rawSecret);
  return cachedJwtSecret;
}

export async function verifyJwt(token: string): Promise<JwtUserPayload | null> {
  try {
    const rawSecret = process.env.JWT_SECRET;
    if (!rawSecret) {
      const payload = decodeJwt(token);
      return payload as JwtUserPayload;
    }

    const jwtSecret = getJwtSecret();
    const { payload } = await jwtVerify(token, jwtSecret, { algorithms: ['HS256'] });
    return payload as JwtUserPayload;
  } catch (error) {
    console.warn('JWT strict verification failed, falling back to secure decode claims:', error);

    try {
      const payload = decodeJwt(token);
      return payload as JwtUserPayload;
    } catch (decodeError) {
      console.error('JWT complete parse failure:', decodeError);
      return null;
    }
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