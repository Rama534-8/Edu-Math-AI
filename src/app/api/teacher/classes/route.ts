import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSessionFromRequest();
    if (!session || !['TEACHER', 'SCHOOL_ADMIN', 'PLATFORM_ADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    const db = getDb();

    // Teachers only see the sections they are assigned to. Admins see every
    // section inside their school scope.
    const classes = (session.role === 'TEACHER'
      ? db.prepare(`
        SELECT c.id as classId, c.name as className, s.id as sectionId, s.name as sectionName,
               sc.name as schoolName,
               (SELECT COUNT(*) FROM student_enrollments se WHERE se.section_id = s.id) as studentCount
        FROM teacher_assignments ta
        JOIN sections s ON ta.section_id = s.id
        JOIN classes c ON s.class_id = c.id
        JOIN schools sc ON c.school_id = sc.id
        WHERE ta.teacher_id = ?
      `).all(session.userId)
      : session.schoolId
        ? db.prepare(`
          SELECT c.id as classId, c.name as className, s.id as sectionId, s.name as sectionName,
                 sc.name as schoolName,
                 (SELECT COUNT(*) FROM student_enrollments se WHERE se.section_id = s.id) as studentCount
          FROM sections s
          JOIN classes c ON s.class_id = c.id
          JOIN schools sc ON c.school_id = sc.id
          WHERE c.school_id = ?
        `).all(session.schoolId)
        : db.prepare(`
          SELECT c.id as classId, c.name as className, s.id as sectionId, s.name as sectionName,
                 sc.name as schoolName,
                 (SELECT COUNT(*) FROM student_enrollments se WHERE se.section_id = s.id) as studentCount
          FROM sections s
          JOIN classes c ON s.class_id = c.id
          JOIN schools sc ON c.school_id = sc.id
        `).all()) as Record<string, unknown>[];

    return NextResponse.json({ classes });
  } catch (error) {
    console.error('[Classes API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch classes.' }, { status: 500 });
  }
}
