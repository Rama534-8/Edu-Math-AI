import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireRoles, requireSchoolId } from '@/lib/authz';

/** Every assignment in the caller's school, with submission progress. */
export async function GET() {
  try {
    const auth = await requireRoles(['SCHOOL_ADMIN', 'PLATFORM_ADMIN']);
    if ('error' in auth) return auth.error;
    const school = requireSchoolId(auth.actor);
    if ('error' in school) return school.error;

    const db = getDb();
    const assignments = db
      .prepare(
        `SELECT a.id, a.title, a.description, a.subject, a.board, a.chapter,
                a.total_marks AS totalMarks, a.due_date AS dueDate,
                a.created_at AS createdAt,
                c.name AS className, s.name AS sectionName,
                COALESCE(tp.display_name, tu.email, 'Teacher') AS teacherName,
                (SELECT COUNT(*) FROM student_enrollments se WHERE se.section_id = a.section_id) AS expected,
                (SELECT COUNT(*) FROM assignment_submissions sub WHERE sub.assignment_id = a.id) AS submitted,
                (SELECT COUNT(*) FROM assignment_submissions sub
                   WHERE sub.assignment_id = a.id AND sub.status = 'PENDING') AS pending,
                (SELECT ROUND(AVG(sub.marks), 1) FROM assignment_submissions sub
                   WHERE sub.assignment_id = a.id AND sub.marks IS NOT NULL) AS averageMarks
         FROM assignments a
         JOIN classes c ON c.id = a.class_id
         JOIN sections s ON s.id = a.section_id
         JOIN users tu ON tu.id = a.teacher_id
         LEFT JOIN teacher_profiles tp ON tp.uid = tu.id
         WHERE a.school_id = ?
         ORDER BY a.created_at DESC`
      )
      .all(school.schoolId) as Record<string, unknown>[];

    const classes = db
      .prepare(
        `SELECT c.id AS classId, c.name AS className, s.id AS sectionId, s.name AS sectionName
         FROM classes c LEFT JOIN sections s ON s.class_id = c.id
         WHERE c.school_id = ? ORDER BY c.name, s.name`
      )
      .all(school.schoolId) as Record<string, unknown>[];

    const teachers = db
      .prepare(
        `SELECT u.id, COALESCE(tp.display_name, u.email) AS displayName, u.email
         FROM users u LEFT JOIN teacher_profiles tp ON tp.uid = u.id
         WHERE u.school_id = ? AND u.role = 'TEACHER' ORDER BY displayName COLLATE NOCASE`
      )
      .all(school.schoolId) as Record<string, unknown>[];

    return NextResponse.json({ assignments, classes, teachers, schoolId: school.schoolId });
  } catch (error) {
    console.error('[School Admin Assignments API] Error:', error);
    return NextResponse.json({ error: 'Failed to load assignments.' }, { status: 500 });
  }
}