import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireRoles, requireSchoolId } from '@/lib/authz';

/**
 * Attendance for the caller's school. Read-only at this level: marking is a
 * teacher action and lives in /api/teacher/attendance.
 *
 * Query: ?sectionId=&from=YYYY-MM-DD&to=YYYY-MM-DD
 */
export async function GET(req: Request) {
  try {
    const auth = await requireRoles(['SCHOOL_ADMIN', 'PLATFORM_ADMIN']);
    if ('error' in auth) return auth.error;
    const school = requireSchoolId(auth.actor);
    if ('error' in school) return school.error;

    const db = getDb();
    const url = new URL(req.url);
    const sectionId = url.searchParams.get('sectionId') ?? '';
    const from = url.searchParams.get('from') ?? '';
    const to = url.searchParams.get('to') ?? '';

    const params: unknown[] = [school.schoolId];
    const dateClauses: string[] = [];
    if (sectionId) {
      dateClauses.push('s.id = ?');
      params.push(sectionId);
    }
    if (from) {
      dateClauses.push('a.attendance_date >= ?');
      params.push(from);
    }
    if (to) {
      dateClauses.push('a.attendance_date <= ?');
      params.push(to);
    }
    const where = dateClauses.length ? `AND ${dateClauses.join(' AND ')}` : '';

    const records = db
      .prepare(
        `SELECT a.id, a.student_id AS studentId,
                COALESCE(sp.display_name, a.student_id) AS studentName,
                a.section_id AS sectionId, s.name AS sectionName,
                c.name AS className,
                a.attendance_date AS attendanceDate,
                a.status, a.remarks, a.marked_by AS markedBy,
                a.updated_at AS updatedAt
         FROM attendance a
         JOIN sections s ON s.id = a.section_id
         JOIN classes c ON c.id = s.class_id
         LEFT JOIN student_profiles sp ON sp.uid = a.student_id
         WHERE c.school_id = ? ${where}
         ORDER BY a.attendance_date DESC, studentName COLLATE NOCASE
         LIMIT 500`
      )
      .all(...params) as Record<string, unknown>[];

    const totals = db
      .prepare(
        `SELECT
           SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) AS present,
           SUM(CASE WHEN a.status = 'ABSENT'  THEN 1 ELSE 0 END) AS absent,
           SUM(CASE WHEN a.status = 'LATE'    THEN 1 ELSE 0 END) AS late,
           SUM(CASE WHEN a.status = 'EXCUSED' THEN 1 ELSE 0 END) AS excused,
           COUNT(*) AS total,
           COUNT(DISTINCT a.attendance_date) AS days
         FROM attendance a
         JOIN sections s ON s.id = a.section_id
         JOIN classes c ON c.id = s.class_id
         WHERE c.school_id = ? ${where}`
      )
      .get(...params) as Record<string, number | null>;

    const sections = db
      .prepare(
        `SELECT s.id AS sectionId, s.name AS sectionName, c.name AS className
         FROM sections s JOIN classes c ON c.id = s.class_id
         WHERE c.school_id = ? ORDER BY c.name, s.name`
      )
      .all(school.schoolId) as Record<string, unknown>[];

    return NextResponse.json({ records, totals, sections, schoolId: school.schoolId });
  } catch (error) {
    console.error('[School Admin Attendance API] Error:', error);
    return NextResponse.json({ error: 'Failed to load attendance.' }, { status: 500 });
  }
}