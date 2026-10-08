import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';

/** GET /api/mock-exam/history
 * Returns the student's mock exam attempts (newest first).
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest();
    if (!session) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

    const db = getDb();

    const attempts = db.prepare(`
      SELECT id, board, exam_type, chapter_title, status, started_at, submitted_at,
             total_questions, total_marks, obtained_marks, percentage, result_status,
             duration_minutes
      FROM mock_exam_attempts
      WHERE student_id = ?
      ORDER BY started_at DESC
      LIMIT 50
    `).all(session.userId) as any[];

    // For in-progress attempts, add remaining seconds
    const now = new Date();
    const enriched = attempts.map((a) => {
      if (a.status === 'IN_PROGRESS') {
        const expiresAt = new Date(new Date(a.started_at).getTime() + a.duration_minutes * 60000);
        const remaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
        return { ...a, remainingSeconds: remaining, canResume: remaining > 0 };
      }
      return { ...a, remainingSeconds: 0, canResume: false };
    });

    return NextResponse.json({ attempts: enriched });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch history.' }, { status: 500 });
  }
}
