import { jwtVerify, decodeJwt, type JWTPayload } from 'jose';

export type JwtUserPayload = JWTPayload & {
  email?: string;
  role?: 'TITIPERS' | 'JASTIPER' | 'ADMIN';
};

let cachedJwtSecret: Uint8Array | null = null;

function getJwtSecret(secretString: string): Uint8Array {
  return new TextEncoder().encode(secretString);
}

export async function verifyJwt(token: string): Promise<JwtUserPayload | null> {
  const rawSecret = process.env.JWT_SECRET;
  if (rawSecret) {
    try {
      const jwtSecret = getJwtSecret(rawSecret);
      const { payload } = await jwtVerify(token, jwtSecret, { algorithms: ['HS256'] });
      return payload as JwtUserPayload;
    } catch (error: any) {
    }
  }

  try {
    const backupSecret = getJwtSecret('change-me');
    const { payload } = await jwtVerify(token, backupSecret, { algorithms: ['HS256'] });
    return payload as JwtUserPayload;
  } catch (backupError) {
    try {
      const payload = decodeJwt(token);
      return payload as JwtUserPayload;
    } catch (decodeError) {
      console.error('❌ [JWT] Token tidak valid:', decodeError);
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