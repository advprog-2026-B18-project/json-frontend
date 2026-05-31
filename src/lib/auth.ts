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

  console.log(`[auth] raw JWT_SECRET length: ${rawSecret.length}`);
  console.log(`[auth] raw charCodes (first 10): [${Array.from(rawSecret).slice(0, 10).map(c => c.charCodeAt(0)).join(',')}]`);
  console.log(`[auth] raw charCodes (last 5):  [${Array.from(rawSecret).slice(-5).map(c => c.charCodeAt(0)).join(',')}]`);

  const sanitized = rawSecret.replace(/\s/g, '');

  if (rawSecret !== sanitized) {
    console.warn(
      `[auth] WHITESPACE STRIPPED: length ${rawSecret.length} → ${sanitized.length}`
    );
  }

  // jjwt internally does TextCodec.BASE64.decode(secretString) — standard Base64
  // Match that: Base64-decode the string to get the raw HMAC key bytes
  const padded = sanitized.padEnd(Math.ceil(sanitized.length / 4) * 4, '=');

  let decoded: Uint8Array;
  try {
    const binaryStr = atob(padded);
    decoded = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      decoded[i] = binaryStr.charCodeAt(i);
    }
  } catch {
    throw new Error(
      `JWT_SECRET is not a valid Base64 string. jjwt expects a Base64-encoded secret.`
    );
  }

  console.log(`[auth] base64-decoded key: ${decoded.length} bytes`);
  console.log(`[auth] decoded first 10 bytes: [${decoded.slice(0, 10).join(',')}]`);
  console.log(`[auth] decoded last 5 bytes:  [${decoded.slice(-5).join(',')}]`);

  return decoded;
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
