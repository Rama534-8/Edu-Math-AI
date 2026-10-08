import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireRoles, teacherCanAccessStudent, userBelongsToSchool } from '@/lib/authz';

/**
 * Full teacher view of one student: profile, chapter progress, quiz history,
 * assignment submissions and attendance. A teacher may only open a student who
 * is enrolled in one of their sections.
 */
export async function GET(_req: Request, context: { params: Promise<{ studentId: string }> }) {
  try {
    const auth = await requireRoles(['TEACHER', 'SCHOOL_ADMIN', 'PLATFORM_ADMIN']);
    if ('error' in auth) return auth.error;

    const { studentId } = await context.params;
    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required.' }, { status: 400 });
    }

    const db = getDb();

    const student = db
      .prepare(
        `SELECT u.id, u.email, u.status, u.created_at AS createdAt,
                sp.display_name AS displayName, sp.student_code AS studentCode,
                sp.class_name AS className, sp.board, sp.medium, sp.school_name AS schoolName,
                sp.xp, sp.level, sp.streak_days AS streakDays,
                sp.questions_solved AS questionsSolved,
                sp.total_study_minutes AS totalStudyMinutes,
                sp.baseline_completed AS baselineCompleted, sp.baseline_score AS baselineScore,
                u.school_id AS schoolId
         FROM users u
         LEFT JOIN student_profiles sp ON sp.uid = u.id
         WHERE u.id = ? AND u.role = 'STUDENT'`
      )
      .get(studentId) as Record<string, unknown> | undefined;

    if (!student) {
      return NextResponse.json({ error: 'Student not found.' }, { status: 404 });
    }

    // Authorization: teachers are limited to their own sections; admins to their school.
    if (auth.actor.role === 'TEACHER') {
      if (!teacherCanAccessStudent(auth.actor.userId, studentId)) {
        return NextResponse.json({ error: 'Student is not in your assigned sections.' }, { status: 403 });
      }
    } else if (
      auth.actor.role === 'SCHOOL_ADMIN' &&
      student.schoolId &&
      !userBelongsToSchool(studentId, auth.actor.schoolId ?? '')
    ) {
      return NextResponse.json({ error: 'Student belongs to another school.' }, { status: 403 });
    }

    const chapters = db
      .prepare(
        `SELECT chapter_id AS chapterId, COUNT(*) AS sessions,
                SUM(sessions_completed) AS sessionsCompleted,
                MAX(best_quiz_score) AS bestQuizScore,
                SUM(practice_attempted) AS practiceAttempted,
                SUM(practice_correct) AS practiceCorrect,
                MAX(last_revised_at) AS lastRevisedAt
         FROM revision_sessions WHERE student_id = ?
         GROUP BY chapter_id ORDER BY lastRevisedAt DESC`
      )
      .all(studentId) as Record<string, unknown>[];

    const quizzes = db
      .prepare(
        `SELECT id, quiz_title AS quizTitle, type, chapter_id AS chapterId,
                percentage, score, max_score AS maxScore,
                correct_count AS correct, total_questions AS total,
                result_status AS resultStatus, created_at AS createdAt
         FROM assessment_snapshots WHERE student_id = ?
         ORDER BY created_at DESC LIMIT 25`
      )
      .all(studentId) as Record<string, unknown>[];

    const submissions = db
      .prepare(
        `SELECT sub.id, a.title, a.subject, a.total_marks AS totalMarks,
                sub.status, sub.marks, sub.feedback, sub.answer_text AS answerText,
                sub.submitted_at AS submittedAt, sub.graded_at AS gradedAt
         FROM assignment_submissions sub
         JOIN assignments a ON a.id = sub.assignment_id
         WHERE sub.student_id = ?
         ORDER BY sub.submitted_at DESC LIMIT 25`
      )
      .all(studentId) as Record<string, unknown>[];

    const attendance = db
      .prepare(
        `SELECT a.attendance_date AS attendanceDate, a.status, a.remarks,
                s.name AS sectionName, c.name AS className
         FROM attendance a
         JOIN sections s ON s.id = a.section_id
         JOIN classes c ON c.id = s.class_id
         WHERE a.student_id = ?
         ORDER BY a.attendance_date DESC LIMIT 60`
      )
      .all(studentId) as Record<string, unknown>[];

    const attendanceTotals = db
      .prepare(
        `SELECT
           SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) AS present,
           SUM(CASE WHEN status = 'ABSENT'  THEN 1 ELSE 0 END) AS absent,
           SUM(CASE WHEN status = 'LATE'    THEN 1 ELSE 0 END) AS late,
           SUM(CASE WHEN status = 'EXCUSED' THEN 1 ELSE 0 END) AS excused,
           COUNT(*) AS total
         FROM attendance WHERE student_id = ?`
      )
      .get(studentId) as Record<string, number | null>;

    const activity = db
      .prepare(
        `SELECT id, activity_type AS activityType, created_at AS createdAt
         FROM activity_log WHERE student_id = ?
         ORDER BY created_at DESC LIMIT 25`
      )
      .all(studentId) as Record<string, unknown>[];

    const mistakes = db
      .prepare(
        `SELECT id, chapter_id AS chapterId, concept_to_revise AS conceptToRevise,
                what_went_wrong AS whatWentWrong, resolved, created_at AS createdAt
         FROM mistakes WHERE student_id = ?
         ORDER BY created_at DESC LIMIT 15`
      )
      .all(studentId) as Record<string, unknown>[];

    return NextResponse.json({
      student,
      chapters,
      quizzes,
      submissions,
      attendance,
      attendanceTotals,
      activity,
      mistakes,
    });
  } catch (error) {
    console.error('[Teacher Student Detail API] Error:', error);
    return NextResponse.json({ error: 'Failed to load student.' }, { status: 500 });
  }
}