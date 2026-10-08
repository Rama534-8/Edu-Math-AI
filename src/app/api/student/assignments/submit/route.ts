import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { getDb } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(req: Request) {
  try {
    const session = await getSessionFromRequest();
    if (!session || session.role !== 'STUDENT') return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    
    const { assignmentId, answerText } = await req.json();
    if (!assignmentId || !answerText) return NextResponse.json({ error: 'Missing fields.' }, { status: 400 });
    
    const db = getDb();
    
    // Check if assignment exists and student is enrolled in the section
    const assignment = db.prepare(`
      SELECT a.id FROM assignments a
      JOIN student_enrollments se ON a.section_id = se.section_id
      WHERE a.id = ? AND se.student_id = ?
    `).get(assignmentId, session.userId);
    
    if (!assignment) return NextResponse.json({ error: 'Assignment not found or unauthorized.' }, { status: 403 });
    
    // Prevent duplicates
    const existing = db.prepare('SELECT id FROM assignment_submissions WHERE assignment_id = ? AND student_id = ?').get(assignmentId, session.userId);
    if (existing) return NextResponse.json({ error: 'Already submitted.' }, { status: 400 });

    const id = randomUUID();
    db.prepare('INSERT INTO assignment_submissions (id, assignment_id, student_id, answer_text, status) VALUES (?, ?, ?, ?, ?)')
      .run(id, assignmentId, session.userId, answerText, 'PENDING');
      
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
