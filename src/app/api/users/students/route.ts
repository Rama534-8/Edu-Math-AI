import { NextResponse } from 'next/server';
import { requireRoles, schoolUserFilter } from '@/lib/authz';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const auth = await requireRoles(['TEACHER', 'SCHOOL_ADMIN', 'PLATFORM_ADMIN']);
    if ('error' in auth) return auth.error;
    const db = getDb();

    let query = `
      SELECT u.id, u.email, sp.display_name, sp.class_name, sp.board, sp.medium,
             sp.xp, sp.level, sp.questions_solved, sp.baseline_completed, sp.baseline_score
      FROM users u
      JOIN student_profiles sp ON sp.uid = u.id
      WHERE u.role = 'STUDENT'
    `;
    const params: string[] = [];

    if (auth.actor.role === 'TEACHER') {
      query = `
        SELECT DISTINCT u.id, u.email, sp.display_name, sp.class_name, sp.board, sp.medium,
               sp.xp, sp.level, sp.questions_solved, sp.baseline_completed, sp.baseline_score
        FROM users u
        JOIN student_profiles sp ON sp.uid = u.id
        JOIN student_enrollments se ON se.student_id = u.id
        JOIN teacher_assignments ta ON ta.section_id = se.section_id
        WHERE u.role = 'STUDENT' AND ta.teacher_id = ?
      `;
      params.push(auth.actor.userId);
    } else if (auth.actor.role === 'SCHOOL_ADMIN') {
      const filter = schoolUserFilter(auth.actor);
      query += ` ${filter.clause}`;
      params.push(...filter.params);
    }

    query += ` ORDER BY sp.xp DESC`;

    const rows = db.prepare(query).all(...params) as {
      id: string; email: string; display_name: string; class_name: string;
      board: string; medium: string; xp: number; level: number;
      questions_solved: number; baseline_completed: number; baseline_score: number | null;
    }[];

    const students = rows.map((r) => ({
      uid: r.id,
      email: r.email,
      displayName: r.display_name,
      class: r.class_name,
      board: r.board,
      medium: r.medium,
      xp: r.xp,
      level: r.level,
      questionsSolved: r.questions_solved,
      baselineCompleted: r.baseline_completed === 1,
      baselineScore: r.baseline_score,
    }));

    return NextResponse.json({ students });
  } catch (error) {
    console.error('[Students API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch students.' }, { status: 500 });
  }
}
