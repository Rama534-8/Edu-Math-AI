import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getDb } from '@/lib/db';
import { requireRoles } from '@/lib/authz';

/**
 * Records genuine lesson activity for the signed-in student.
 *
 * POST { lessonId, board?, chapterId?, topicId?, completed? }
 *   - default: marks the lesson IN_PROGRESS (first open wins the timestamp)
 *   - completed: true marks it COMPLETED
 *
 * GET returns the student's lesson list, which drives "Continue Learning".
 * Ownership is always the session user; a client cannot write another id.
 */
export async function GET() {
  try {
    const auth = await requireRoles(['STUDENT']);
    if ('error' in auth) return auth.error;

    const rows = getDb()
      .prepare(
        `SELECT id, lesson_id AS lessonId, board, chapter_id AS chapterId,
                topic_id AS topicId, status, started_at AS startedAt, completed_at AS completedAt
         FROM lesson_progress WHERE student_id = ?
         ORDER BY datetime(started_at) DESC`
      )
      .all(auth.actor.userId);

    return NextResponse.json({ lessonProgress: rows });
  } catch (error) {
    console.error('[Lesson Progress API] Error:', error);
    return NextResponse.json({ error: 'Failed to load lesson progress.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRoles(['STUDENT']);
    if ('error' in auth) return auth.error;

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const lessonId = typeof body?.lessonId === 'string' ? body.lessonId.trim() : '';
    if (!lessonId || lessonId.length > 200) {
      return NextResponse.json({ error: 'lessonId is required.' }, { status: 400 });
    }

    const board = typeof body?.board === 'string' ? body.board : null;
    const chapterId = typeof body?.chapterId === 'string' ? body.chapterId : null;
    const topicId = typeof body?.topicId === 'string' ? body.topicId : null;
    const completed = body?.completed === true;
    const studentId = auth.actor.userId;

    const db = getDb();
    const existing = db
      .prepare('SELECT id, status FROM lesson_progress WHERE student_id = ? AND lesson_id = ?')
      .get(studentId, lessonId) as { id: string; status: string } | undefined;

    if (!existing) {
      db.prepare(
        `INSERT INTO lesson_progress (id, student_id, lesson_id, board, chapter_id, topic_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(randomUUID(), studentId, lessonId, board, chapterId, topicId, completed ? 'COMPLETED' : 'IN_PROGRESS');
    } else if (completed && existing.status !== 'COMPLETED') {
      // A lesson is never un-completed.
      db.prepare(
        "UPDATE lesson_progress SET status = 'COMPLETED', completed_at = datetime('now') WHERE id = ?"
      ).run(existing.id);
    } else {
      // Refresh the chapter/topic context if the client supplies it.
      db.prepare(
        `UPDATE lesson_progress
         SET chapter_id = COALESCE(?, chapter_id),
             topic_id = COALESCE(?, topic_id),
             board = COALESCE(?, board)
         WHERE id = ?`
      ).run(chapterId, topicId, board, existing.id);
    }

    const row = db
      .prepare(
        `SELECT id, lesson_id AS lessonId, board, chapter_id AS chapterId,
                topic_id AS topicId, status, started_at AS startedAt, completed_at AS completedAt
         FROM lesson_progress WHERE student_id = ? AND lesson_id = ?`
      )
      .get(studentId, lessonId);

    return NextResponse.json({ success: true, lessonProgress: row });
  } catch (error) {
    console.error('[Lesson Progress API] Error:', error);
    return NextResponse.json({ error: 'Failed to record lesson progress.' }, { status: 500 });
  }
}
