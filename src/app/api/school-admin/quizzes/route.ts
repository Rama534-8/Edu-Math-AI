import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireRoles, requireSchoolId } from '@/lib/authz';

/**
 * Quizzes in the caller's school with their attempts, reusing the existing
 * `quizzes` / `assessment_snapshots` tables rather than a second quiz system.
 */
export async function GET(req: Request) {
  try {
    const auth = await requireRoles(['SCHOOL_ADMIN', 'PLATFORM_ADMIN']);
    if ('error' in auth) return auth.error;
    const school = requireSchoolId(auth.actor);
    if ('error' in school) return school.error;

    const db = getDb();
    const url = new URL(req.url);
    const search = (url.searchParams.get('search') ?? '').trim();
    const params: unknown[] = [school.schoolId];
    let where = '';
    if (search) {
      where = 'AND q.title LIKE ?';
      params.push(`%${search}%`);
    }

    const quizzes = db
      .prepare(
        `SELECT q.id, q.title, q.subject, q.total_marks AS totalMarks, q.created_at AS createdAt,
                c.name AS className, s.name AS sectionName,
                COALESCE(tp.display_name, tu.email, 'Teacher') AS teacherName,
                (SELECT COUNT(*) FROM quiz_questions qq WHERE qq.quiz_id = q.id) AS questionCount,
                (SELECT COUNT(*) FROM assessment_snapshots a WHERE a.quiz_id = q.id) AS attempts,
                (SELECT ROUND(AVG(a.percentage), 1) FROM assessment_snapshots a WHERE a.quiz_id = q.id) AS averageScore,
                (SELECT MAX(a.percentage) FROM assessment_snapshots a WHERE a.quiz_id = q.id) AS bestScore
         FROM quizzes q
         JOIN sections s ON s.id = q.section_id
         JOIN classes c ON c.id = s.class_id
         JOIN users tu ON tu.id = q.teacher_id
         LEFT JOIN teacher_profiles tp ON tp.uid = tu.id
         WHERE c.school_id = ? ${where}
         ORDER BY q.created_at DESC`
      )
      .all(...params) as Record<string, unknown>[];

    const attempts = db
      .prepare(
        `SELECT a.id, a.quiz_id AS quizId, a.quiz_title AS quizTitle,
                COALESCE(sp.display_name, u.email) AS studentName,
                a.percentage, a.result_status AS resultStatus,
                a.correct_count AS correct, a.total_questions AS total,
                a.created_at AS createdAt
         FROM assessment_snapshots a
         JOIN users u ON u.id = a.student_id
         LEFT JOIN student_profiles sp ON sp.uid = u.id
         WHERE u.school_id = ?
         ORDER BY a.created_at DESC
         LIMIT 30`
      )
      .all(school.schoolId) as Record<string, unknown>[];

    return NextResponse.json({ quizzes, attempts, schoolId: school.schoolId });
  } catch (error) {
    console.error('[School Admin Quizzes API] Error:', error);
    return NextResponse.json({ error: 'Failed to load quizzes.' }, { status: 500 });
  }
}