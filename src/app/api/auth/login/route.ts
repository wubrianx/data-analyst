import { NextRequest, NextResponse } from 'next/server';
import { validateCredentials, createToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();

  if (!validateCredentials(username, password)) {
    return NextResponse.json({ error: '帳號或密碼錯誤' }, { status: 401 });
  }

  const token = await createToken(username);
  const response = NextResponse.json({ ok: true });

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  return response;
}
