import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireRoles, requireSchoolId } from '@/lib/authz';

/**
 * Aggregated school reports: student performance, class performance, teacher
 * activity, quiz performance, assignment performance and attendance. Every series
 * is derived from the existing tables inside the caller's school scope.
 */
export async function GET(req: Request) {
  try {
    const auth = await requireRoles(['SCHOOL_ADMIN', 'PLATFORM_ADMIN']);
    if ('error' in auth) return auth.error;
    const school = requireSchoolId(auth.actor);
    if ('error' in school) return school.error;

    const db = getDb();
    const schoolId = school.schoolId;
    const url = new URL(req.url);
    const limit = Math.min(Number(url.searchParams.get('limit') ?? 10) || 10, 50);

    const studentPerformance = db
      .prepare(
        `SELECT sp.uid AS studentId,
                COALESCE(sp.display_name, u.email) AS studentName,
                sp.class_name AS className, sp.board,
                sp.xp, sp.level, sp.questions_solved AS questionsSolved,
                (SELECT COUNT(*) FROM assessment_snapshots a WHERE a.student_id = sp.uid) AS attempts,
                (SELECT ROUND(AVG(a.percentage), 1) FROM assessment_snapshots a WHERE a.student_id = sp.uid) AS averageScore,
                (SELECT MAX(a.percentage) FROM assessment_snapshots a WHERE a.student_id = sp.uid) AS bestScore,
                (SELECT COUNT(*) FROM assessment_snapshots a
                   WHERE a.student_id = sp.uid AND a.result_status = 'PASS') AS passed,
                (SELECT COUNT(*) FROM assignment_submissions sub WHERE sub.student_id = sp.uid) AS submissions
         FROM student_profiles sp
         JOIN users u ON u.id = sp.uid
         WHERE u.school_id = ? AND u.role = 'STUDENT'
         ORDER BY (averageScore IS NULL), averageScore DESC, sp.xp DESC
         LIMIT ?`
      )
      .all(schoolId, limit) as Record<string, unknown>[];

    const classPerformance = db
      .prepare(
        `SELECT c.id AS classId, c.name AS className,
                (SELECT COUNT(*) FROM student_enrollments se
                   JOIN users su ON su.id = se.student_id
                  WHERE se.section_id IN (SELECT id FROM sections WHERE class_id = c.id)
                    AND su.school_id = ?) AS studentCount,
                (SELECT COUNT(*) FROM sections s WHERE s.class_id = c.id) AS sectionCount,
                (SELECT ROUND(AVG(a.percentage), 1) FROM assessment_snapshots a
                   JOIN student_enrollments se ON se.student_id = a.student_id
                  WHERE se.section_id IN (SELECT id FROM sections WHERE class_id = c.id)) AS averageScore,
                (SELECT COUNT(DISTINCT se.student_id) FROM student_enrollments se
                  WHERE se.section_id IN (SELECT id FROM sections WHERE class_id = c.id)) AS activeStudents
         FROM classes c
         WHERE c.school_id = ?
         ORDER BY c.name`
      )
      .all(schoolId, schoolId) as Record<string, unknown>[];
const teacherActivity = db
      .prepare(
        `SELECT u.id AS teacherId,
                COALESCE(tp.display_name, u.email) AS teacherName,
                u.status,
                (SELECT COUNT(*) FROM teacher_assignments ta WHERE ta.teacher_id = u.id) AS sections,
                (SELECT COUNT(*) FROM assignments a WHERE a.teacher_id = u.id) AS assignments,
                (SELECT COUNT(*) FROM quizzes q WHERE q.teacher_id = u.id) AS quizzes,
                (SELECT COUNT(*) FROM assignment_submissions sub
                   JOIN assignments a2 ON a2.id = sub.assignment_id
                  WHERE a2.teacher_id = u.id) AS gradedSubmissions
         FROM users u
         LEFT JOIN teacher_profiles tp ON tp.uid = u.id
         WHERE u.school_id = ? AND u.role = 'TEACHER'
         ORDER BY assignments DESC, teacherName COLLATE NOCASE`
      )
      .all(schoolId) as Record<string, unknown>[];

    const quizPerformance = db
      .prepare(
        `SELECT a.quiz_title AS quizTitle, a.type, COUNT(*) AS attempts,
                COUNT(DISTINCT a.student_id) AS participants,
                ROUND(AVG(a.percentage), 1) AS averageScore,
                SUM(CASE WHEN a.result_status = 'PASS' THEN 1 ELSE 0 END) AS passed,
                SUM(CASE WHEN a.result_status = 'FAIL' THEN 1 ELSE 0 END) AS failed
         FROM assessment_snapshots a
         JOIN users u ON u.id = a.student_id
         WHERE u.school_id = ?
         GROUP BY a.quiz_title, a.type
         ORDER BY attempts DESC
         LIMIT ?`
      )
      .all(schoolId, limit) as Record<string, unknown>[];

    const assignmentPerformance = db
      .prepare(
        `SELECT a.id, a.title, a.subject, c.name AS className,
                a.total_marks AS totalMarks, a.due_date AS dueDate,
                (SELECT COUNT(*) FROM student_enrollments se WHERE se.section_id = a.section_id) AS expected,
                (SELECT COUNT(*) FROM assignment_submissions sub WHERE sub.assignment_id = a.id) AS submitted,
                (SELECT ROUND(AVG(sub.marks), 1) FROM assignment_submissions sub
                   WHERE sub.assignment_id = a.id AND sub.marks IS NOT NULL) AS averageMarks,
                (SELECT COUNT(*) FROM assignment_submissions sub
                   WHERE sub.assignment_id = a.id AND sub.status = 'PENDING') AS pending
         FROM assignments a
         JOIN classes c ON c.id = a.class_id
         WHERE a.school_id = ?
         ORDER BY a.created_at DESC
         LIMIT ?`
      )
      .all(schoolId, limit) as Record<string, unknown>[];

    const attendanceSummary = db
      .prepare(
        `SELECT
           SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) AS present,
           SUM(CASE WHEN a.status = 'ABSENT'  THEN 1 ELSE 0 END) AS absent,
           SUM(CASE WHEN a.status = 'LATE'    THEN 1 ELSE 0 END) AS late,
           SUM(CASE WHEN a.status = 'EXCUSED' THEN 1 ELSE 0 END) AS excused,
           COUNT(*) AS total
         FROM attendance a
         JOIN sections s ON s.id = a.section_id
         JOIN classes c ON c.id = s.class_id
         WHERE c.school_id = ?`
      )
      .get(schoolId) as Record<string, number | null>;

    const headline = db
      .prepare(
        `SELECT
           (SELECT COUNT(*) FROM users WHERE school_id = ? AND role = 'STUDENT') AS students,
           (SELECT COUNT(*) FROM users WHERE school_id = ? AND role = 'TEACHER') AS teachers,
           (SELECT COUNT(*) FROM users WHERE school_id = ? AND role = 'PARENT') AS parents,
           (SELECT COUNT(*) FROM classes WHERE school_id = ?) AS classes,
           (SELECT COUNT(*) FROM sections s JOIN classes c ON c.id = s.class_id WHERE c.school_id = ?) AS sections,
           (SELECT COUNT(*) FROM assignments WHERE school_id = ?) AS assignments,
           (SELECT COUNT(*) FROM quizzes q
              JOIN sections s ON s.id = q.section_id
              JOIN classes c ON c.id = s.class_id WHERE c.school_id = ?) AS quizzes,
           (SELECT ROUND(AVG(a.percentage), 1) FROM assessment_snapshots a
              JOIN users u ON u.id = a.student_id WHERE u.school_id = ?) AS averageScore,
           (SELECT COUNT(*) FROM assessment_snapshots a
              JOIN users u ON u.id = a.student_id WHERE u.school_id = ?) AS attempts`
      )
      // One `?` per scoped sub-select above: students, teachers, parents, classes,
      // sections, assignments, quizzes, averageScore, attempts.
      .get(
        schoolId, schoolId, schoolId, schoolId, schoolId,
        schoolId, schoolId, schoolId, schoolId
      ) as Record<string, number | null>;

    return NextResponse.json({
      schoolId,
      headline,
      studentPerformance,
      classPerformance,
      teacherActivity,
      quizPerformance,
      assignmentPerformance,
      attendanceSummary,
    });
  } catch (error) {
    console.error('[School Admin Reports API] Error:', error);
    return NextResponse.json({ error: 'Failed to build reports.' }, { status: 500 });
  }
}