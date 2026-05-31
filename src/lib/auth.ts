import { decodeJwt, jwtVerify, type JWTPayload } from 'jose';

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
  console.log("Secret di Vercel terbaca:", rawSecret);

  const jwtSecret = new TextEncoder().encode(rawSecret);
  return jwtSecret;
}

export async function verifyJwt(token: string): Promise<JwtUserPayload | null> {
  try {
    const jwtSecret = getJwtSecret();

    try {
      // Decode payload TANPA verifikasi signature
      const unsafePayload = decodeJwt(token);
      console.log("ISI PAYLOAD DI VERCEL:", unsafePayload);
    } catch (e) {
      console.log("Token bukan JWT yang valid atau terpotong");
    }
    
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
