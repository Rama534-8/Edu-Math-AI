import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';

/** GET /api/mock-exam/[attemptId]/result
 * Returns full result data after submission, including answers with correct info.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const session = await getSessionFromRequest();
    if (!session) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

    const { attemptId } = await params;
    const db = getDb();

    // Verify ownership
    const attempt = db.prepare(
      'SELECT * FROM mock_exam_attempts WHERE id = ? AND student_id = ?'
    ).get(attemptId, session.userId) as any;

    if (!attempt) return NextResponse.json({ error: 'Exam attempt not found.' }, { status: 404 });

    if (attempt.status !== 'SUBMITTED') {
      return NextResponse.json({ error: 'Result is not available until submission.' }, { status: 400 });
    }

    const answers = db.prepare(
      'SELECT * FROM mock_exam_answers WHERE attempt_id = ?'
    ).all(attemptId) as any[];

    return NextResponse.json({
      attempt: {
        id: attempt.id,
        board: attempt.board,
        exam_type: attempt.exam_type,
        chapter_title: attempt.chapter_title,
        started_at: attempt.started_at,
        submitted_at: attempt.submitted_at,
        total_marks: attempt.total_marks,
        obtained_marks: attempt.obtained_marks,
        percentage: attempt.percentage,
        result_status: attempt.result_status,
        duration_minutes: attempt.duration_minutes,
      },
      answers,
    });
  } catch (error: any) {
    console.error('[MockExamResult]', error);
    return NextResponse.json({ error: 'Failed to load result.' }, { status: 500 });
  }
}
