import { SignJWT, jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'default-secret-change-me-in-production'
);
const COOKIE_NAME = 'da_session';
const EXPIRES_IN = '7d';

/**
 * AUTH_USERS format: "user1:pass1,user2:pass2"
 */
export function validateCredentials(username: string, password: string): boolean {
  const usersEnv = process.env.AUTH_USERS || '';
  if (!usersEnv) return false;

  const pairs = usersEnv.split(',');
  for (const pair of pairs) {
    const [u, p] = pair.split(':');
    if (u === username && p === password) return true;
  }
  return false;
}

export async function createToken(username: string): Promise<string> {
  return new SignJWT({ username })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(EXPIRES_IN)
    .setIssuedAt()
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, SECRET);
    return true;
  } catch {
    return false;
  }
}

export { COOKIE_NAME };
