import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireRoles } from '@/lib/authz';

/**
 * Real class analytics for the signed-in teacher.
 *
 * Joins the full existing relationship chain:
 *   assessment_snapshots
 *     -> student_enrollments -> sections -> classes
 *
 * Teacher scoping is done with EXISTS against teacher_assignments rather than a
 * JOIN. A JOIN here would fan every assessment row out once per teacher assigned
 * to the section, which inflated attempts/averages (measurably so for platform
 * admins, who are not filtered by teacher at all). EXISTS keeps one row per
 * real assessment while still restricting teachers to their own sections.
 *
 * Teachers only ever see classes they are assigned to. Platform admins may see a
 * specific class. Nothing is faked: every number below comes from
 * assessment_snapshots.
 */
export async function GET(req: Request) {
  try {
    const auth = await requireRoles(['TEACHER', 'PLATFORM_ADMIN']);
    if ('error' in auth) return auth.error;

    const db = getDb();
    const url = new URL(req.url);
    const classId = url.searchParams.get('classId') ?? '';

    const params: unknown[] = [];
    const scope: string[] = [];
    if (auth.actor.role === 'PLATFORM_ADMIN') {
      // Admins are not scoped by teacher; constrain to their school instead.
      if (auth.actor.schoolId) {
        params.push(auth.actor.schoolId);
        scope.push('c.school_id = ?');
      }
    } else {
      params.push(auth.actor.userId);
      scope.push(
        'EXISTS (SELECT 1 FROM teacher_assignments ta WHERE ta.teacher_id = ? AND ta.section_id = s.id)'
      );
    }
    if (classId) {
      scope.push('c.id = ?');
      params.push(classId);
    }
    const where = scope.length ? `WHERE ${scope.join(' AND ')}` : '';

    const fromJoin = `
      FROM assessment_snapshots a
      JOIN student_enrollments se ON se.student_id = a.student_id
      JOIN sections s ON s.id = se.section_id
      JOIN classes c ON c.id = s.class_id`;

    const classSummary = db
      .prepare(
        `SELECT c.id AS classId, c.name AS className,
                COUNT(DISTINCT a.student_id) AS students,
                COUNT(*) AS attempts,
                ROUND(AVG(a.percentage), 1) AS averageScore,
                SUM(CASE WHEN a.result_status = 'PASS' THEN 1 ELSE 0 END) AS passed,
                SUM(CASE WHEN a.result_status = 'FAIL' THEN 1 ELSE 0 END) AS failed,
                MAX(a.created_at) AS lastActivity
         ${fromJoin}
         ${where}
         GROUP BY c.id
         ORDER BY attempts DESC, c.name`
      )
      .all(...params) as Record<string, unknown>[];

    const studentRows = db
      .prepare(
        `SELECT sp.uid AS studentId,
                COALESCE(sp.display_name, u.email) AS studentName,
                c.name AS className, s.name AS sectionName,
                COUNT(*) AS attempts,
                ROUND(AVG(a.percentage), 1) AS averageScore,
                MAX(a.percentage) AS bestScore,
                SUM(CASE WHEN a.result_status = 'PASS' THEN 1 ELSE 0 END) AS passed
         ${fromJoin}
         JOIN users u ON u.id = a.student_id
         JOIN student_profiles sp ON sp.uid = a.student_id
         ${where}
         GROUP BY sp.uid
         ORDER BY averageScore DESC, attempts DESC`
      )
      .all(...params) as Record<string, unknown>[];

    const typeBreakdown = db
      .prepare(
        `SELECT a.type, COUNT(*) AS attempts,
                ROUND(AVG(a.percentage), 1) AS averageScore,
                SUM(CASE WHEN a.result_status = 'PASS' THEN 1 ELSE 0 END) AS passed
         ${fromJoin}
         ${where}
         GROUP BY a.type
         ORDER BY attempts DESC`
      )
      .all(...params) as Record<string, unknown>[];

    const recent = db
      .prepare(
        `SELECT a.id, COALESCE(sp.display_name, u.email) AS studentName,
                a.type, a.quiz_title AS quizTitle, a.percentage,
                a.result_status AS resultStatus, a.created_at AS createdAt
         ${fromJoin}
         JOIN users u ON u.id = a.student_id
         LEFT JOIN student_profiles sp ON sp.uid = a.student_id
         ${where}
         ORDER BY a.created_at DESC
         LIMIT 10`
      )
      .all(...params) as Record<string, unknown>[];

    return NextResponse.json({
      scope: auth.actor.role === 'TEACHER' ? 'TEACHER' : 'SCHOOL',
      hasData: classSummary.length > 0,
      classes: classSummary,
      students: studentRows,
      types: typeBreakdown,
      recent,
    });
  } catch (error) {
    console.error('[Teacher Analytics API] Error:', error);
    return NextResponse.json({ error: 'Failed to load class analytics.' }, { status: 500 });
  }
}