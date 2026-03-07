import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      'AUTH_SECRET environment variable is required. ' +
      'Generate one with: openssl rand -base64 32'
    );
  }
  return new TextEncoder().encode(secret);
}

const COOKIE_NAME = 'da_session';
const EXPIRES_IN = '7d';

/**
 * AUTH_USERS format: "user1:pass1,user2:pass2"
 * Uses constant-time comparison to prevent timing attacks.
 */
export function validateCredentials(username: string, password: string): boolean {
  const usersEnv = process.env.AUTH_USERS || '';
  if (!usersEnv) return false;

  const pairs = usersEnv.split(',');
  let found = false;
  for (const pair of pairs) {
    const colonIndex = pair.indexOf(':');
    if (colonIndex === -1) continue;
    const u = pair.slice(0, colonIndex);
    const p = pair.slice(colonIndex + 1);

    // Use constant-time comparison for both username and password
    const usernameMatch = constantTimeEqual(u, username);
    const passwordMatch = constantTimeEqual(p, password);
    if (usernameMatch && passwordMatch) {
      found = true;
    }
  }
  return found;
}

/**
 * Constant-time string comparison to prevent timing-based side-channel attacks.
 * Works in both Node.js and Edge Runtime (no dependency on Node crypto module).
 */
function constantTimeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const aBuf = encoder.encode(a);
  const bBuf = encoder.encode(b);

  if (aBuf.length !== bBuf.length) {
    // Compare a against itself to maintain constant timing,
    // then return false
    let result = 1; // nonzero = not equal
    for (let i = 0; i < aBuf.length; i++) {
      result |= aBuf[i] ^ aBuf[i];
    }
    return result === 0; // always false since we set result = 1
  }

  let result = 0;
  for (let i = 0; i < aBuf.length; i++) {
    result |= aBuf[i] ^ bBuf[i];
  }
  return result === 0;
}

export async function createToken(username: string): Promise<string> {
  return new SignJWT({ username })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(EXPIRES_IN)
    .setIssuedAt()
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

/**
 * Verify a JWT token and return its payload.
 * Returns null if the token is invalid.
 */
export async function verifyTokenPayload(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload;
  } catch {
    return null;
  }
}

export { COOKIE_NAME };
