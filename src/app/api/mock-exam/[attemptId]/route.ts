import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';

/** GET /api/mock-exam/[attemptId]
 * Returns attempt state WITHOUT correct answers.
 * Used to restore exam state after page refresh.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const session = await getSessionFromRequest();
    if (!session) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

    const { attemptId } = await params;
    if (!attemptId) return NextResponse.json({ error: 'Missing attempt ID.' }, { status: 400 });

    const db = getDb();

    // Security: student can only access own attempts
    const attempt = db.prepare(
      'SELECT * FROM mock_exam_attempts WHERE id = ? AND student_id = ?'
    ).get(attemptId, session.userId) as any;

    if (!attempt) {
      return NextResponse.json({ error: 'Exam attempt not found.' }, { status: 404 });
    }

    // Check if exam has expired on server
    const startedAt = new Date(attempt.started_at);
    const expiresAt = new Date(startedAt.getTime() + attempt.duration_minutes * 60 * 1000);
    const now = new Date();
    const remainingSeconds = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));

    if (attempt.status === 'IN_PROGRESS' && remainingSeconds === 0) {
      // Auto-expire but don't submit here (submit endpoint handles that)
      db.prepare("UPDATE mock_exam_attempts SET status = 'EXPIRED' WHERE id = ?").run(attemptId);
      attempt.status = 'EXPIRED';
    }

    // Get saved (partial) answers for this attempt
    const savedAnswers = db.prepare(
      'SELECT question_id, selected_answer, marked_for_review FROM mock_exam_answers WHERE attempt_id = ?'
    ).all(attemptId) as { question_id: string; selected_answer: string; marked_for_review: number }[];

    const answersMap: Record<string, { selectedAnswer: string; markedForReview: boolean }> = {};
    for (const a of savedAnswers) {
      answersMap[a.question_id] = {
        selectedAnswer: a.selected_answer || '',
        markedForReview: a.marked_for_review === 1,
      };
    }

    return NextResponse.json({
      attemptId: attempt.id,
      board: attempt.board,
      examType: attempt.exam_type,
      chapterTitle: attempt.chapter_title,
      status: attempt.status,
      startedAt: attempt.started_at,
      durationMinutes: attempt.duration_minutes,
      remainingSeconds,
      totalMarks: attempt.total_marks,
      questions: JSON.parse(attempt.questions_json || '[]'),
      savedAnswers: answersMap,
    });
  } catch (error: any) {
    console.error('[MockExam/GET]', error);
    return NextResponse.json({ error: 'Failed to load exam.' }, { status: 500 });
  }
}

/** PATCH /api/mock-exam/[attemptId]
 * Save a single answer (without submitting the exam).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const session = await getSessionFromRequest();
    if (!session) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

    const { attemptId } = await params;
    const body = await req.json().catch(() => ({}));
    const { questionId, selectedAnswer, markedForReview } = body;

    if (!questionId || typeof questionId !== 'string') {
      return NextResponse.json({ error: 'Missing questionId.' }, { status: 400 });
    }

    const db = getDb();
    const attempt = db.prepare(
      "SELECT id, status FROM mock_exam_attempts WHERE id = ? AND student_id = ?"
    ).get(attemptId, session.userId) as any;

    if (!attempt) return NextResponse.json({ error: 'Attempt not found.' }, { status: 404 });
    if (attempt.status !== 'IN_PROGRESS') {
      return NextResponse.json({ error: 'Exam is not in progress.' }, { status: 400 });
    }

    db.prepare(`
      UPDATE mock_exam_answers
      SET selected_answer = ?, marked_for_review = ?
      WHERE attempt_id = ? AND question_id = ? AND student_id = ?
    `).run(
      typeof selectedAnswer === 'string' ? selectedAnswer : '',
      markedForReview ? 1 : 0,
      attemptId, questionId, session.userId
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to save answer.' }, { status: 500 });
  }
}
