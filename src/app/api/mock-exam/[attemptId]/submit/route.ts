import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';
import { ALL_BADGES } from '@/lib/badges';
import { randomUUID } from 'crypto';

const PASS_THRESHOLD = 40;

/** POST /api/mock-exam/[attemptId]/submit
 * Server-side scoring. Idempotent — duplicate submissions return the stored result.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const session = await getSessionFromRequest();
    if (!session) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

    const { attemptId } = await params;
    const db = getDb();

    // Security: only the owner can submit
    const attempt = db.prepare(
      'SELECT * FROM mock_exam_attempts WHERE id = ? AND student_id = ?'
    ).get(attemptId, session.userId) as any;

    if (!attempt) return NextResponse.json({ error: 'Exam attempt not found.' }, { status: 404 });

    // Idempotency: already submitted → return stored result immediately
    if (attempt.status === 'SUBMITTED') {
      const answers = db.prepare(
        'SELECT * FROM mock_exam_answers WHERE attempt_id = ?'
      ).all(attemptId) as any[];
      return NextResponse.json({
        success: true,
        alreadySubmitted: true,
        attemptId,
        obtainedMarks: attempt.obtained_marks,
        totalMarks: attempt.total_marks,
        percentage: attempt.percentage,
        resultStatus: attempt.result_status,
        answers,
      });
    }

    // Allow submission if IN_PROGRESS or EXPIRED (timer ran out)
    if (!['IN_PROGRESS', 'EXPIRED'].includes(attempt.status)) {
      return NextResponse.json({ error: 'Exam cannot be submitted in its current state.' }, { status: 400 });
    }

    // Parse student's final answers from request body
    const body = await req.json().catch(() => ({}));
    const { answers: clientAnswers = {} } = body as { answers: Record<string, string> };

    // Load correct answers from DB (never from client)
    const storedAnswers = db.prepare(
      'SELECT * FROM mock_exam_answers WHERE attempt_id = ?'
    ).all(attemptId) as any[];

    if (storedAnswers.length === 0) {
      return NextResponse.json({ error: 'No questions found for this attempt.' }, { status: 400 });
    }

    // Server-side scoring — all from DB
    let obtainedMarks = 0;
    const chapterPerf: Record<string, { correct: number; total: number; title: string }> = {};

    const updateAnswer = db.prepare(`
      UPDATE mock_exam_answers
      SET selected_answer = ?, is_correct = ?, marks_awarded = ?
      WHERE attempt_id = ? AND question_id = ?
    `);

    const scoreAll = db.transaction(() => {
      for (const sa of storedAnswers) {
        const studentAnswer = typeof clientAnswers[sa.question_id] === 'string'
          ? clientAnswers[sa.question_id]
          : (sa.selected_answer || '');

        const isCorrect = studentAnswer.trim().toLowerCase() === sa.correct_answer.trim().toLowerCase() && studentAnswer.trim() !== '';
        const marksAwarded = isCorrect ? sa.max_marks : 0;
        obtainedMarks += marksAwarded;

        updateAnswer.run(studentAnswer, isCorrect ? 1 : 0, marksAwarded, attemptId, sa.question_id);

        // Per-chapter tracking
        const chapId = sa.chapter_id || 'unknown';
        if (!chapterPerf[chapId]) chapterPerf[chapId] = { correct: 0, total: 0, title: chapId };
        chapterPerf[chapId].total++;
        if (isCorrect) chapterPerf[chapId].correct++;
      }
    });
    scoreAll();

    const totalMarks = attempt.total_marks || storedAnswers.reduce((s: number, a: any) => s + a.max_marks, 0);
    const percentage = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 100 * 10) / 10 : 0;
    const resultStatus = percentage >= PASS_THRESHOLD ? 'PASS' : 'FAIL';

    const submittedAt = new Date().toISOString();
    const startedAt = new Date(attempt.started_at);
    const durationSeconds = Math.floor((new Date(submittedAt).getTime() - startedAt.getTime()) / 1000);

    // Persist final result
    db.prepare(`
      UPDATE mock_exam_attempts
      SET status = 'SUBMITTED', submitted_at = ?, obtained_marks = ?, percentage = ?,
          result_status = ?, total_marks = ?
      WHERE id = ?
    `).run(submittedAt, obtainedMarks, percentage, resultStatus, totalMarks, attemptId);

    // XP reward
    const xpGained = Math.round(obtainedMarks * 10) + (resultStatus === 'PASS' ? 50 : 10);
    db.prepare(`
      UPDATE student_profiles
      SET xp = xp + ?, level = MAX(level, ?), questions_solved = questions_solved + ?
      WHERE uid = ?
    `).run(xpGained, Math.floor(((db.prepare('SELECT xp FROM student_profiles WHERE uid = ?').get(session.userId) as any)?.xp + xpGained) / 1000) + 1, storedAnswers.length, session.userId);

    // Notification: result ready (only if not already notified for this attempt)
    const notifExists = db.prepare(
      "SELECT id FROM notifications WHERE user_id = ? AND message LIKE ?"
    ).get(session.userId, `%${attemptId}%`) as any;

    if (!notifExists) {
      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, message, link)
        VALUES (?, ?, 'EXAM_RESULT', ?, ?, ?)
      `).run(
        randomUUID(),
        session.userId,
        `📋 Mock Exam Result: ${resultStatus}`,
        `You scored ${percentage}% (${obtainedMarks}/${totalMarks} marks). Ref: ${attemptId.slice(0, 8)}`,
        `/student/mock-exams/${attemptId}/result`
      );
    }

    // Badge evaluation
    await awardMockExamBadges(session.userId, db, resultStatus);

    // Load full answers for result page
    const finalAnswers = db.prepare('SELECT * FROM mock_exam_answers WHERE attempt_id = ?').all(attemptId) as any[];

    return NextResponse.json({
      success: true,
      attemptId,
      obtainedMarks,
      totalMarks,
      percentage,
      resultStatus,
      passThreshold: PASS_THRESHOLD,
      durationSeconds,
      xpGained,
      chapterPerformance: Object.values(chapterPerf),
      answers: finalAnswers,
    });
  } catch (error: any) {
    console.error('[MockExam/submit]', error);
    return NextResponse.json({ error: 'Failed to submit exam. Please try again.' }, { status: 500 });
  }
}

async function awardMockExamBadges(studentId: string, db: any, lastResultStatus: string) {
  const alreadyEarned = new Set(
    (db.prepare('SELECT badge_code FROM student_achievements WHERE student_id = ?')
      .all(studentId) as { badge_code: string }[]).map((r) => r.badge_code)
  );

  const completedExams = (db.prepare(
    "SELECT id, result_status FROM mock_exam_attempts WHERE student_id = ? AND status = 'SUBMITTED'"
  ).all(studentId) as any[]);

  const toAward: string[] = [];
  if (!alreadyEarned.has('MOCK_EXAM_FIRST') && completedExams.length >= 1) toAward.push('MOCK_EXAM_FIRST');
  if (!alreadyEarned.has('MOCK_EXAM_PASS') && (lastResultStatus === 'PASS' || completedExams.some((e) => e.result_status === 'PASS'))) toAward.push('MOCK_EXAM_PASS');
  if (!alreadyEarned.has('MOCK_EXAM_5') && completedExams.length >= 5) toAward.push('MOCK_EXAM_5');

  for (const code of toAward) {
    const badge = ALL_BADGES.find((b) => b.code === code);
    if (!badge) continue;
    db.prepare('INSERT OR IGNORE INTO student_achievements (id, student_id, badge_code) VALUES (?, ?, ?)').run(randomUUID(), studentId, code);
    const notifExists = db.prepare(
      "SELECT id FROM notifications WHERE user_id = ? AND title LIKE ?"
    ).get(studentId, `%${badge.title}%`) as any;
    if (!notifExists) {
      db.prepare(`INSERT INTO notifications (id, user_id, type, title, message, link) VALUES (?, ?, 'BADGE', ?, ?, ?)`).run(
        randomUUID(), studentId,
        `🏅 Badge Unlocked: ${badge.title}`,
        badge.description,
        '/student/achievements'
      );
    }
  }
}
