import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { getDb } from '@/lib/db';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const assignmentId = url.searchParams.get('assignmentId');
  const session = await getSessionFromRequest();
  if(!session) return NextResponse.json({}, {status:401});
  const db = getDb();
  const submissions = db.prepare(`
    SELECT s.*, u.display_name 
    FROM assignment_submissions s
    JOIN student_profiles u ON s.student_id = u.uid
    WHERE s.assignment_id = ?
  `).all(assignmentId);
  return NextResponse.json({ submissions });
}

export async function PATCH(req: Request) {
  const session = await getSessionFromRequest();
  if(!session || session.role !== 'TEACHER') return NextResponse.json({}, {status:401});
  const { submissionId, marks, feedback } = await req.json();
  const db = getDb();
  db.prepare("UPDATE assignment_submissions SET marks=?, feedback=?, status='GRADED', graded_at=datetime('now'), graded_by=? WHERE id=?")
    .run(marks, feedback, session.userId, submissionId);
  return NextResponse.json({success:true});
}
