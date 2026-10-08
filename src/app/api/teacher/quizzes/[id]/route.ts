import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSessionFromRequest();
    if (!session || !['TEACHER', 'SCHOOL_ADMIN', 'PLATFORM_ADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    
    const db = getDb();
    
    // Add explanation column if missing
    try {
      const qCols = new Set(
        (db.prepare('PRAGMA table_info(quiz_questions)').all() as { name: string }[])
          .map((col) => col.name)
      );
      if (!qCols.has('explanation')) {
        db.exec('ALTER TABLE quiz_questions ADD COLUMN explanation TEXT');
      }
    } catch (e) {
      console.warn('Failed to migrate quiz_questions table', e);
    }

    const quiz = db.prepare(`
      SELECT q.*, s.name as sectionName, c.name as className
      FROM quizzes q
      JOIN sections s ON q.section_id = s.id
      JOIN classes c ON s.class_id = c.id
      WHERE q.id = ?
    `).get(id) as any;

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found.' }, { status: 404 });
    }

    if (session.role === 'TEACHER' && quiz.teacher_id !== session.userId) {
       return NextResponse.json({ error: 'Unauthorized. You do not own this quiz.' }, { status: 403 });
    }

    const questions = db.prepare('SELECT * FROM quiz_questions WHERE quiz_id = ?').all(id) as any[];

    // parse JSON fields for options
    for (const q of questions) {
       try {
         if (typeof q.options === 'string') q.options = JSON.parse(q.options);
       } catch (e) {}
    }

    return NextResponse.json({ quiz, questions });
  } catch (error) {
    console.error('[Quiz Detail API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch quiz details.' }, { status: 500 });
  }
}
