import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireRoles, requireSchoolId } from '@/lib/authz';

export async function GET() {
  try {
    const auth = await requireRoles(['PLATFORM_ADMIN', 'SCHOOL_ADMIN']);
    if ('error' in auth) return auth.error;
    const school = requireSchoolId(auth.actor);
    if ('error' in school) return school.error;

    const db = getDb();

    const teachers = (auth.actor.role === 'SCHOOL_ADMIN'
      ? db.prepare(`
      SELECT u.id, u.email, u.created_at AS createdAt,
             tp.display_name AS displayName, tp.phone_number AS phoneNumber,
             tp.profile_picture AS profilePicture
      FROM users u
      LEFT JOIN teacher_profiles tp ON tp.uid = u.id
      WHERE u.role = 'TEACHER' AND u.school_id = ?
      ORDER BY u.created_at DESC
    `).all(school.schoolId)
      : db.prepare(`
      SELECT u.id, u.email, u.created_at AS createdAt,
             tp.display_name AS displayName, tp.phone_number AS phoneNumber,
             tp.profile_picture AS profilePicture
      FROM users u
      LEFT JOIN teacher_profiles tp ON tp.uid = u.id
      WHERE u.role = 'TEACHER'
      ORDER BY u.created_at DESC
    `).all()) as {
      id: string;
      email: string;
      createdAt: string;
      displayName: string | null;
      phoneNumber: string | null;
      profilePicture: string | null;
    }[];

    return NextResponse.json({ teachers });
  } catch (error) {
    console.error('[Admin Teachers API] Error:', error);
    return NextResponse.json({ error: 'Failed to load teachers.' }, { status: 500 });
  }
}
