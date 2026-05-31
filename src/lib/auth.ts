import { jwtVerify, type JWTPayload } from 'jose';

export type JwtUserPayload = JWTPayload & {
  // sub is already in JWTPayload (string | undefined)
  email?: string;
  role?: 'TITIPERS' | 'JASTIPER' | 'ADMIN';
};

function getJwtSecret(): Uint8Array {

  const rawSecret = process.env.JWT_SECRET;
  if (!rawSecret) {
    throw new Error('JWT_SECRET is not set');
  }

  console.log("raw secret berhasil diambil")
  console.log('JWT_SECRET len=', rawSecret.length);

  const jwtSecret = new TextEncoder().encode(rawSecret);
  return jwtSecret;
}

export async function verifyJwt(token: string): Promise<JwtUserPayload | null> {
  try {
    const jwtSecret = getJwtSecret();
    console.log("Secret di Vercel terbaca:", jwtSecret);
    const { payload } = await jwtVerify(token, jwtSecret, { algorithms: ['HS256'] });
    return payload as JwtUserPayload;
  } catch (error) {
    console.error('JWT verification failed', error);
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
