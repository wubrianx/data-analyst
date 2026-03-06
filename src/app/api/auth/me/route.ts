import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME } from '@/lib/auth';
import { jwtVerify } from 'jose';
import { isDemoMode } from '@/lib/config';
import { hasGa4Credentials, hasMetaCredentials, hasAnthropicKey } from '@/lib/config';

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'default-secret-change-me-in-production'
);

export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, SECRET);
    return NextResponse.json({
      username: payload.username,
      isAdmin: payload.username === 'ming-hsiu.wu',
      status: {
        demoMode: isDemoMode(),
        ga4: hasGa4Credentials(),
        meta: hasMetaCredentials(),
        ai: hasAnthropicKey(),
      },
    });
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
}
