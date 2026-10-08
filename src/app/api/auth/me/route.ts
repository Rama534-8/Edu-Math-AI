import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authz';
import { getDb } from '@/lib/db';

interface UserRow {
  id: string;
  email: string;
  role: string;
  school_id: string | null;
}

interface StudentRow {
  uid: string;
  display_name: string;
  phone_number: string | null;
  parent_guardian_name: string | null;
  student_code: string;
  class_name: string;
  board: string;
  medium: string;
  profile_picture: string | null;
  xp: number;
  level: number;
  streak_days: number;
  last_active_date: string | null;
  questions_solved: number;
  total_study_minutes: number;
  onboarding_completed: number;
  baseline_completed: number;
  baseline_score: number | null;
  learning_goals: string;
}

interface TeacherRow {
  uid: string;
  display_name: string;
  phone_number: string | null;
  profile_picture: string | null;
}

export async function GET() {
  try {
    const auth = await requireAuth();
    if ('error' in auth) return auth.error;

    const db = getDb();
    const user = db.prepare('SELECT id, email, role, school_id FROM users WHERE id = ?').get(auth.actor.userId) as UserRow | undefined;

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    let profile = null;
    const now = new Date().toISOString();

    if (user.role === 'STUDENT') {
      const sp = db.prepare('SELECT * FROM student_profiles WHERE uid = ?').get(user.id) as StudentRow | undefined;
      if (sp) {
        const linkedParents = db.prepare(
          'SELECT COUNT(*) AS count FROM parent_student_links WHERE student_user_id = ?'
        ).get(user.id) as { count: number };
        profile = {
          id: user.id,
          uid: user.id,
          email: user.email,
          displayName: sp.display_name,
          role: user.role,
          phoneNumber: sp.phone_number,
          parentGuardianName: sp.parent_guardian_name,
          studentCode: sp.student_code,
          linkedParentCount: linkedParents.count,
          photoURL: sp.profile_picture,
          grade: 9,
          class: sp.class_name,
          board: sp.board,
          medium: sp.medium,
          profilePicture: sp.profile_picture,
          schoolId: user.school_id,
          xp: sp.xp,
          level: sp.level,
          streakDays: sp.streak_days,
          lastActiveDate: sp.last_active_date,
          questionsSolved: sp.questions_solved,
          totalStudyMinutes: sp.total_study_minutes,
          onboardingCompleted: sp.onboarding_completed === 1,
          baselineCompleted: sp.baseline_completed === 1,
          baselineScore: sp.baseline_score,
          learningGoals: JSON.parse(sp.learning_goals || '[]'),
          createdAt: now,
          updatedAt: now,
        };
      }
    } else if (user.role === 'TEACHER') {
      const tp = db.prepare('SELECT * FROM teacher_profiles WHERE uid = ?').get(user.id) as TeacherRow | undefined;
      profile = {
        id: user.id,
        uid: user.id,
        email: user.email,
        displayName: tp?.display_name || user.email,
        role: user.role,
        schoolId: user.school_id,
        photoURL: tp?.profile_picture || null,
        createdAt: now,
        updatedAt: now,
      };
    } else {
      profile = {
        id: user.id,
        uid: user.id,
        email: user.email,
        displayName: user.email,
        role: user.role,
        schoolId: user.school_id,
        createdAt: now,
        updatedAt: now,
      };
    }

    return NextResponse.json({ user: profile }, { status: 200 });
  } catch (error) {
    console.error('[Me API] Error:', error);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
