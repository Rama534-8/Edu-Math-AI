import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireRoles, requireSchoolId } from '@/lib/authz';

export async function GET() {
  try {
    const auth = await requireRoles(['PLATFORM_ADMIN', 'SCHOOL_ADMIN']);
    if ('error' in auth) return auth.error;
    const school = requireSchoolId(auth.actor);
    if ('error' in school) return school.error;

    const db = getDb();

    const students = (auth.actor.role === 'SCHOOL_ADMIN'
      ? db.prepare(`
      SELECT sp.uid AS id, sp.display_name AS displayName,
             sp.class_name AS className, sp.board, sp.medium,
             sp.school_name AS schoolName,
             sp.xp, sp.level, sp.streak_days AS streakDays,
             sp.questions_solved AS questionsSolved,
             sp.baseline_completed AS baselineCompleted,
             sp.baseline_score AS baselineScore,
             sp.profile_picture AS profilePicture,
             u.email, u.created_at AS createdAt
      FROM student_profiles sp
      JOIN users u ON u.id = sp.uid AND u.role = 'STUDENT'
      WHERE u.school_id = ?
      ORDER BY sp.class_name, sp.board, sp.display_name COLLATE NOCASE
    `).all(school.schoolId)
      : db.prepare(`
      SELECT sp.uid AS id, sp.display_name AS displayName,
             sp.class_name AS className, sp.board, sp.medium,
             sp.school_name AS schoolName,
             sp.xp, sp.level, sp.streak_days AS streakDays,
             sp.questions_solved AS questionsSolved,
             sp.baseline_completed AS baselineCompleted,
             sp.baseline_score AS baselineScore,
             sp.profile_picture AS profilePicture,
             u.email, u.created_at AS createdAt
      FROM student_profiles sp
      JOIN users u ON u.id = sp.uid AND u.role = 'STUDENT'
      ORDER BY sp.class_name, sp.board, sp.display_name COLLATE NOCASE
    `).all()) as {
      id: string;
      displayName: string;
      className: string;
      board: string;
      medium: string;
      schoolName: string | null;
      xp: number;
      level: number;
      streakDays: number;
      questionsSolved: number;
      baselineCompleted: number;
      baselineScore: number | null;
      profilePicture: string | null;
      email: string;
      createdAt: string;
    }[];

    // Group by class + board
    const groups: Record<string, typeof students> = {};
    for (const student of students) {
      const key = `${student.className} · ${student.board}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(student);
    }

    const classes = Object.entries(groups).map(([label, members]) => ({
      label,
      studentCount: members.length,
      students: members,
      avgXP: members.length > 0 ? Math.round(members.reduce((s, m) => s + m.xp, 0) / members.length) : 0,
      avgQuestions: members.length > 0 ? Math.round(members.reduce((s, m) => s + m.questionsSolved, 0) / members.length) : 0,
      baselineCompletion: members.length > 0
        ? Math.round((members.filter((m) => m.baselineCompleted === 1).length / members.length) * 100)
        : 0,
    }));

    return NextResponse.json({ classes });
  } catch (error) {
    console.error('[Admin Classes API] Error:', error);
    return NextResponse.json({ error: 'Failed to load classes.' }, { status: 500 });
  }
}
