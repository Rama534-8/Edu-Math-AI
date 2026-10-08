import { NextResponse } from 'next/server';
import { requireRoles } from '@/lib/authz';
import { getDb } from '@/lib/db';
import { CLASS_9_CHAPTERS, SAMPLE_QUESTIONS_BANK } from '@/lib/curriculum-data';

export async function GET(req: Request, { params }: { params: Promise<{ chapterId: string }> }) {
  try {
    // Shared session auth: reads the `edumathai_session` cookie minted at
    // login (signed with SESSION_SECRET) via requireRoles -> requireAuth ->
    // lookupSession. The previous implementation read an `auth_token` cookie
    // that no code ever set and verified it with JWT_SECRET, so every
    // authenticated student still received 401 Unauthorized here.
    const auth = await requireRoles(['STUDENT']);
    if ('error' in auth) return auth.error;
    const userId = auth.actor.userId;

    const { chapterId } = await params;
    const db = getDb();
    const profile = db.prepare('SELECT * FROM student_profiles WHERE uid = ?').get(userId) as any;
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    const curriculum = CLASS_9_CHAPTERS.filter((c) => c.board === profile.board);

    const chapter = curriculum.find((c) => c.id === chapterId);
    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found in your curriculum' }, { status: 403 });
    }

    // Get or create Revision Session
    let revision = db.prepare('SELECT * FROM revision_sessions WHERE student_id = ? AND chapter_id = ?').get(userId, chapterId) as any;
    if (!revision) {
      const insert = db.prepare('INSERT INTO revision_sessions (id, student_id, chapter_id, board) VALUES (?, ?, ?, ?)');
      const newId = `REV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      insert.run(newId, userId, chapterId, profile.board);
      revision = db.prepare('SELECT * FROM revision_sessions WHERE id = ?').get(newId);
    }

    // Practice Questions from Sample Bank filtered to this chapter
    const allQuestions = SAMPLE_QUESTIONS_BANK.filter(
      (q) => q.chapterId === chapterId || q.topicId.startsWith(chapterId)
    );

    const notes = {
      topics: chapter.topics.map((t) => t.title),
      content: null as string | null,
    };

    return NextResponse.json({
      chapter,
      revision,
      notes,
      questions: allQuestions,
    });
  } catch (error: unknown) {
    console.error('Revision Chapter API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST endpoint to update revision progress
export async function POST(req: Request, { params }: { params: Promise<{ chapterId: string }> }) {
  try {
    const auth = await requireRoles(['STUDENT']);
    if ('error' in auth) return auth.error;
    const userId = auth.actor.userId;

    const { chapterId } = await params;
    const body = await req.json();
    const { action, score, isCorrect } = body;

    const db = getDb();

    if (action === 'PRACTICE_ANSWER') {
      db.prepare(`
        UPDATE revision_sessions 
        SET practice_attempted = practice_attempted + 1,
            practice_correct = practice_correct + ?,
            last_revised_at = datetime('now')
        WHERE student_id = ? AND chapter_id = ?
      `).run(isCorrect ? 1 : 0, userId, chapterId);
    } else if (action === 'QUIZ_SUBMIT') {
      db.prepare(`
        UPDATE revision_sessions 
        SET sessions_completed = sessions_completed + 1,
            best_quiz_score = MAX(best_quiz_score, ?),
            last_revised_at = datetime('now')
        WHERE student_id = ? AND chapter_id = ?
      `).run(score, userId, chapterId);

      // Award badges
      const current = db.prepare(
        'SELECT SUM(sessions_completed) as total FROM revision_sessions WHERE student_id = ?'
      ).get(userId) as any;
      const totalSessions = current?.total || 0;

      const award = (code: string) => {
        try {
          db.prepare('INSERT INTO student_achievements (id, student_id, badge_code) VALUES (?, ?, ?)')
            .run(`BA-${Date.now()}-${code}`, userId, code);
          db.prepare('INSERT INTO notifications (id, user_id, type, title, message) VALUES (?, ?, ?, ?, ?)')
            .run(`NOTIF-${Date.now()}-${code}`, userId, 'ACHIEVEMENT', 'New Badge Unlocked!', `You earned the ${code} badge in Smart Revision!`);
        } catch (_e) { /* ignore duplicate */ }
      };

      if (totalSessions === 1) award('REVISION_FIRST');
      if (totalSessions >= 5) award('REVISION_5');
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Revision Chapter POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
