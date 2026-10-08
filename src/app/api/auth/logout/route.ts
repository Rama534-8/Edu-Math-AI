import { NextResponse } from 'next/server';
import { getSessionFromRequest, deleteSession, COOKIE_NAME } from '@/lib/session';

export async function POST() {
  try {
    const session = await getSessionFromRequest();
    if (session) {
      await deleteSession(session.sessionId);
    }
    const res = NextResponse.json({ success: true, message: 'Logged out.' });
    res.cookies.set(COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    return res;
  } catch (error) {
    console.error('[Logout API] Error:', error);
    return NextResponse.json({ error: 'Logout failed.' }, { status: 500 });
  }
}
