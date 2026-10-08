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

    let assignments: Record<string, unknown>[] = [];
    if (session.role === 'TEACHER') {
      assignments = db.prepare(`
        SELECT a.*, c.name as className, s.name as sectionName
        FROM assignments a
        JOIN classes c ON a.class_id = c.id
        JOIN sections s ON a.section_id = s.id
        WHERE a.teacher_id = ?
        ORDER BY a.created_at DESC
      `).all(session.userId) as Record<string, unknown>[];
    }
    return NextResponse.json({ assignments });
  } catch (error) {
    console.error('[Assignments API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch assignments.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest();
    if (!session || session.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await req.json();
    const { classId, sectionId, title, description, subject, board, chapter, totalMarks, dueDate } = body;

    if (!title?.trim() || !classId || !sectionId) {
      return NextResponse.json({ error: 'title, classId and sectionId are required.' }, { status: 400 });
    }

    const db = getDb();

    // Verify teacher is actually assigned to this section
    const authorized = db.prepare(`
      SELECT ta.id FROM teacher_assignments ta
      WHERE ta.teacher_id = ? AND ta.section_id = ?
    `).get(session.userId, sectionId);

    if (!authorized) {
      return NextResponse.json({ error: 'You are not assigned to this section.' }, { status: 403 });
    }

    // Resolve schoolId from class
    const classRow = db.prepare('SELECT school_id FROM classes WHERE id = ?').get(classId) as { school_id: string } | undefined;
    if (!classRow) return NextResponse.json({ error: 'Class not found.' }, { status: 404 });

    const id = randomUUID();
    db.prepare(`
      INSERT INTO assignments (id, teacher_id, school_id, class_id, section_id, title, description, subject, board, chapter, total_marks, due_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, session.userId, classRow.school_id, classId, sectionId, title, description || null, subject || null, board || null, chapter || null, totalMarks || 100, dueDate || null);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('[Assignments API] Error:', error);
    return NextResponse.json({ error: 'Failed to create assignment.' }, { status: 500 });
  }
}
