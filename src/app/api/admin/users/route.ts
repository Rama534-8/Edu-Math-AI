import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireRoles } from '@/lib/authz';

export async function GET() {
  try {
    const auth = await requireRoles(['PLATFORM_ADMIN']);
    if ('error' in auth) return auth.error;

    const db = getDb();
    const users = db.prepare(`
      SELECT id, email, role, status, school_id AS schoolId, created_at AS createdAt
      FROM users
      ORDER BY created_at DESC
    `).all() as {
      id: string;
      email: string;
      role: string;
      status: string;
      schoolId: string | null;
      createdAt: string;
    }[];

    return NextResponse.json({ users });
  } catch (error) {
    console.error('[Admin Users API] Error:', error);
    return NextResponse.json({ error: 'Failed to load users.' }, { status: 500 });
  }
}
