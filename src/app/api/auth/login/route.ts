import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { getDb } from '@/lib/db';
import { createSession, COOKIE_NAME, SESSION_DURATION_DAYS } from '@/lib/session';

interface UserRow {
  id: string;
  email: string;
  password: string;
  role: string;
  status: string | null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, selectedRole } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const db = getDb();

    // Find user
    const user = db.prepare('SELECT id, email, password, role, status FROM users WHERE email = ?').get(
      email.toLowerCase().trim()
    ) as UserRow | undefined;

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    if (user.status && user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Account is not active.' }, { status: 403 });
    }

    const allowedRoles = ['STUDENT', 'TEACHER', 'PARENT', 'SCHOOL_ADMIN', 'PLATFORM_ADMIN'];
    if (!allowedRoles.includes(selectedRole)) {
      return NextResponse.json({ error: 'Select a valid account role.' }, { status: 400 });
    }
    if (selectedRole !== user.role) {
      return NextResponse.json({ error: `This account is registered as ${user.role.replaceAll('_', ' ')}.` }, { status: 403 });
    }

    // Create session only after credentials and selected role are verified.
    const token = await createSession(user.id, user.email, user.role);

    const res = NextResponse.json({ 
      success: true,
      user: { id: user.id, email: user.email, role: user.role },
      message: 'Signed in successfully.'
    });

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
      path: '/',
    });

    return res;
  } catch (error) {
    console.error('[Login API] Error:', error);
    return NextResponse.json({ error: 'Sign in failed. Please try again.' }, { status: 500 });
  }
}
