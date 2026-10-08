import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { getDb } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function GET() {
  try {
    const session = await getSessionFromRequest();
    if (!session || !['TEACHER', 'SCHOOL_ADMIN', 'PLATFORM_ADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    const db = getDb();
    
    let quizzes: any[] = [];
    if (session.role === 'TEACHER') {
      quizzes = db.prepare(`
        SELECT q.*, s.name as sectionName, c.name as className
        FROM quizzes q
        JOIN sections s ON q.section_id = s.id
        JOIN classes c ON s.class_id = c.id
        WHERE q.teacher_id = ?
        ORDER BY q.created_at DESC
      `).all(session.userId) as Record<string, unknown>[];
    }
    return NextResponse.json({ quizzes });
  } catch (error) {
    console.error('[Quizzes API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch quizzes.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest();
    if (!session || session.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    
    const body = await req.json();
    const { sectionId, title, subject, totalMarks } = body;
    
    const db = getDb();
    const id = randomUUID();
    
    db.prepare(`
      INSERT INTO quizzes (id, teacher_id, section_id, title, subject, total_marks)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, session.userId, sectionId, title, subject, totalMarks);
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('[Quizzes API] Error:', error);
    return NextResponse.json({ error: 'Failed to create quiz.' }, { status: 500 });
  }
}
