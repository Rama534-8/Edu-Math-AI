import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { getDb } from '@/lib/db';
import { deadlineInfo } from '@/lib/deadlines';

export async function GET() {
  const session = await getSessionFromRequest();
  if (!session || session.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Unauth' }, { status: 401 });
  }

  const db = getDb();
  const rows = db
    .prepare(
      `SELECT a.id, a.title, a.description, a.subject, a.chapter, a.board,
              a.total_marks AS totalMarks, a.due_date AS dueDate,
              c.name AS className, s.name AS sectionName,
              COALESCE(tp.display_name, au.email) AS teacherName,
              sub.status AS submissionStatus, sub.marks, sub.feedback,
              sub.submitted_at AS submittedAt
       FROM assignments a
       JOIN student_enrollments se ON a.section_id = se.section_id
       JOIN sections s ON s.id = a.section_id
       JOIN classes c ON c.id = s.class_id
       LEFT JOIN users au ON au.id = a.teacher_id
       LEFT JOIN teacher_profiles tp ON tp.uid = a.teacher_id
       LEFT JOIN assignment_submissions sub
              ON sub.assignment_id = a.id AND sub.student_id = ?
       WHERE se.student_id = ?`
    )
    .all(session.userId, session.userId) as Record<string, unknown>[];

  // Phase 5: derive overdue / due-soon / upcoming purely from the stored
  // due_date. No deadline is ever fabricated.
  const assignments = rows.map((row) => {
    const info = deadlineInfo(row.dueDate, {
      status: (row.submissionStatus as string | null) ?? null,
    });
    return {
      ...row,
      deadline: info,
    };
  });

  const summary = {
    total: assignments.length,
    pending: assignments.filter((a) => a.deadline.status !== 'SUBMITTED').length,
    overdue: assignments.filter((a) => a.deadline.status === 'OVERDUE').length,
    dueSoon: assignments.filter((a) => a.deadline.status === 'DUE_SOON').length,
    upcoming: assignments.filter((a) => a.deadline.status === 'UPCOMING').length,
    submitted: assignments.filter((a) => a.deadline.status === 'SUBMITTED').length,
  };

  return NextResponse.json({ assignments, summary });
}
