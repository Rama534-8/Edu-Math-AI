import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireRoles, requireSchoolId } from '@/lib/authz';

/** Read / update the school record the caller administers. */
export async function GET() {
  try {
    const auth = await requireRoles(['SCHOOL_ADMIN', 'PLATFORM_ADMIN']);
    if ('error' in auth) return auth.error;
    const school = requireSchoolId(auth.actor);
    if ('error' in school) return school.error;

    const db = getDb();
    const profile = db.prepare('SELECT id, name, address, created_at AS createdAt FROM schools WHERE id = ?')
      .get(school.schoolId) as Record<string, unknown> | undefined;

    if (!profile) {
      return NextResponse.json({ error: 'School record not found.' }, { status: 404 });
    }

    const stats = db
      .prepare(
        `SELECT
           (SELECT COUNT(*) FROM users WHERE school_id = ? AND role = 'STUDENT') AS students,
           (SELECT COUNT(*) FROM users WHERE school_id = ? AND role = 'TEACHER') AS teachers,
           (SELECT COUNT(*) FROM users WHERE school_id = ? AND role = 'PARENT') AS parents,
           (SELECT COUNT(*) FROM users WHERE school_id = ? AND role = 'SCHOOL_ADMIN') AS admins,
           (SELECT COUNT(*) FROM classes WHERE school_id = ?) AS classes,
           (SELECT COUNT(*) FROM sections s JOIN classes c ON c.id = s.class_id WHERE c.school_id = ?) AS sections`
      )
      .get(school.schoolId, school.schoolId, school.schoolId, school.schoolId, school.schoolId, school.schoolId) as Record<string, number>;

    return NextResponse.json({ school: profile, stats });
  } catch (error) {
    console.error('[School Admin School API] Error:', error);
    return NextResponse.json({ error: 'Failed to load school profile.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireRoles(['SCHOOL_ADMIN', 'PLATFORM_ADMIN']);
    if ('error' in auth) return auth.error;
    const school = requireSchoolId(auth.actor);
    if ('error' in school) return school.error;

    const body = (await req.json()) as { name?: string; address?: string };
    const name = body.name?.trim();
    const address = body.address?.trim();

    if (!name) {
      return NextResponse.json({ error: 'School name is required.' }, { status: 400 });
    }
    if (name.length > 160) {
      return NextResponse.json({ error: 'School name is too long.' }, { status: 400 });
    }

    const clash = getDb()
      .prepare('SELECT id FROM schools WHERE name = ? COLLATE NOCASE AND id <> ?')
      .get(name, school.schoolId);
    if (clash) {
      return NextResponse.json({ error: 'Another school already uses this name.' }, { status: 409 });
    }

    getDb()
      .prepare('UPDATE schools SET name = ?, address = ? WHERE id = ?')
      .run(name, address || null, school.schoolId);

    // Keep denormalised profile copies consistent for staff views.
    getDb().prepare('UPDATE student_profiles SET school_name = ? WHERE uid IN (SELECT id FROM users WHERE school_id = ?)')
      .run(name, school.schoolId);
    getDb().prepare('UPDATE teacher_profiles SET school_name = ? WHERE uid IN (SELECT id FROM users WHERE school_id = ?)')
      .run(name, school.schoolId);

    return NextResponse.json({ success: true, school: { id: school.schoolId, name, address: address || null } });
  } catch (error) {
    console.error('[School Admin School API] Error:', error);
    return NextResponse.json({ error: 'Failed to update school profile.' }, { status: 500 });
  }
}