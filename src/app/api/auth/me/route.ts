import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, verifyTokenPayload } from '@/lib/auth';
import { isDemoMode, hasGa4Credentials, hasMetaCredentials, hasAnthropicKey } from '@/lib/config';

export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const payload = await verifyTokenPayload(token);
  if (!payload) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const adminUsers = (process.env.ADMIN_USERS ?? '').split(',').filter(Boolean);
  const isAdmin = adminUsers.includes(payload.username as string);

  return NextResponse.json({
    username: payload.username,
    isAdmin,
    status: {
      demoMode: isDemoMode(),
      ga4: hasGa4Credentials(),
      meta: hasMetaCredentials(),
      ai: hasAnthropicKey(),
    },
  });
}
