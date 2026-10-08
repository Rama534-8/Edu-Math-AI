import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { getDb } from '@/lib/db';
import { randomUUID } from 'crypto';

const ADMIN_ROLES = ['PLATFORM_ADMIN', 'SCHOOL_ADMIN'] as const;

function isAdmin(role: string): boolean {
  return (ADMIN_ROLES as readonly string[]).includes(role);
}

/** GET — list all teacher→section assignments + dropdown data */
export async function GET() {
  try {
    const session = await getSessionFromRequest();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    const db = getDb();

    // All teacher→section assignments with full context
    const assignments = db.prepare(`
      SELECT ta.id, ta.subject, ta.created_at,
             u.id as teacherId, u.email as teacherEmail,
             tp.display_name as teacherName,
             sc.id as schoolId, sc.name as schoolName,
             c.id as classId, c.name as className,
             s.id as sectionId, s.name as sectionName
      FROM teacher_assignments ta
      JOIN users u ON ta.teacher_id = u.id
      LEFT JOIN teacher_profiles tp ON tp.uid = u.id
      JOIN sections s ON ta.section_id = s.id
      JOIN classes c ON s.class_id = c.id
      JOIN schools sc ON c.school_id = sc.id
      ORDER BY ta.created_at DESC
    `).all() as {
      id: string;
      subject: string | null;
      created_at: string;
      teacherId: string;
      teacherEmail: string;
      teacherName: string | null;
      schoolId: string;
      schoolName: string;
      classId: string;
      className: string;
      sectionId: string;
      sectionName: string;
    }[];

    // All teachers (for the form dropdown)
    const teachers = db.prepare(`
      SELECT u.id, u.email, tp.display_name as displayName
      FROM users u
      LEFT JOIN teacher_profiles tp ON tp.uid = u.id
      WHERE u.role = 'TEACHER'
      ORDER BY u.email
    `).all() as { id: string; email: string; displayName: string | null }[];

    // Schools + classes + sections (for cascading selects)
    const schools = db.prepare('SELECT id, name FROM schools ORDER BY name').all() as { id: string; name: string }[];
    const classes = db.prepare('SELECT id, school_id as schoolId, name FROM classes ORDER BY name').all() as { id: string; schoolId: string; name: string }[];
    const sections = db.prepare('SELECT id, class_id as classId, name FROM sections ORDER BY name').all() as { id: string; classId: string; name: string }[];

    return NextResponse.json({ assignments, teachers, schools, classes, sections });
  } catch (err) {
    console.error('[Admin TeacherAssignments GET]', err);
    return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
  }
}

/** POST — create a new mapping */
export async function POST(req: Request) {
  try {
    const session = await getSessionFromRequest();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    const { teacherId, sectionId, subject } = await req.json();

    if (!teacherId || !sectionId) {
      return NextResponse.json({ error: 'teacherId and sectionId are required.' }, { status: 400 });
    }

    const db = getDb();

    // Verify teacher exists and is actually a TEACHER
    const teacher = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'TEACHER'").get(teacherId) as { id: string } | undefined;
    if (!teacher) return NextResponse.json({ error: 'Teacher not found.' }, { status: 404 });

    // Verify section exists
    const section = db.prepare('SELECT id FROM sections WHERE id = ?').get(sectionId) as { id: string } | undefined;
    if (!section) return NextResponse.json({ error: 'Section not found.' }, { status: 404 });

    const id = randomUUID();
    db.prepare('INSERT INTO teacher_assignments (id, teacher_id, section_id, subject) VALUES (?, ?, ?, ?)')
      .run(id, teacherId, sectionId, subject?.trim() || 'Mathematics');

    return NextResponse.json({ success: true, id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ error: 'This teacher is already assigned to that section for this subject.' }, { status: 409 });
    }
    console.error('[Admin TeacherAssignments POST]', err);
    return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
  }
}

/** DELETE — remove a mapping by id */
export async function DELETE(req: Request) {
  try {
    const session = await getSessionFromRequest();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'id is required.' }, { status: 400 });

    const db = getDb();
    const result = db.prepare('DELETE FROM teacher_assignments WHERE id = ?').run(id);
    if (result.changes === 0) {
      return NextResponse.json({ error: 'Assignment not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Admin TeacherAssignments DELETE]', err);
    return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
  }
}
