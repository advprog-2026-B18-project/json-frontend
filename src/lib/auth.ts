import { importSPKI, jwtVerify, type JWTPayload, type KeyLike } from 'jose';

export type JwtUserPayload = JWTPayload & {
  user_id?: string | number;
  username?: string;
  roles?: string | string[];
};

let cachedPublicKey: KeyLike | null = null;

async function getPublicKey(): Promise<KeyLike> {
  if (cachedPublicKey) {
    return cachedPublicKey;
  }

  const rawKey = process.env.PUBLIC_KEY;
  if (!rawKey) {
    throw new Error('PUBLIC_KEY is not set');
  }

  const normalizedKey = rawKey.replace(/\\n/g, '\n');
  cachedPublicKey = await importSPKI(normalizedKey, 'RS256');
  return cachedPublicKey;
}

export async function verifyJwt(token: string): Promise<JwtUserPayload | null> {
  try {
    const publicKey = await getPublicKey();
    const { payload } = await jwtVerify(token, publicKey, { algorithms: ['RS256'] });
    return payload as JwtUserPayload;
  } catch (error) {
    console.error('JWT verification failed', error);
    return null;
  }
}

export const isLoggedIn = (payload: JwtUserPayload | null): payload is JwtUserPayload => {
  return Boolean(payload?.user_id && payload?.username && payload?.roles);
};

function hasRole(payload: JwtUserPayload | null, role: string): boolean {
  if (!payload?.roles) return false;
  if (Array.isArray(payload.roles)) return payload.roles.includes(role);
  return payload.roles === role;
}

export const isAdmin = (payload: JwtUserPayload | null): boolean => hasRole(payload, 'ADMIN');
export const isTitipers = (payload: JwtUserPayload | null): boolean => hasRole(payload, 'TITIPERS');
export const isJastiper = (payload: JwtUserPayload | null): boolean => hasRole(payload, 'JASTIPER');
