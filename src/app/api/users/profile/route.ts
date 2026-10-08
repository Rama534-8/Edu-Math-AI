import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRoles, schoolUserFilter } from '@/lib/authz';
import { getDb } from '@/lib/db';

const PRIVILEGED_KEYS = [
  'role', 'userId', 'schoolId', 'studentId', 'teacherId', 'parentId',
  'xp', 'level', 'score', 'percentage', 'resultStatus', 'result_status',
  'permissions', 'status', 'streakDays', 'streak_days', 'totalStudyMinutes',
  'questionsSolved', 'questions_solved', 'lastActiveDate',
];

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if ('error' in auth) return auth.error;

    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    for (const key of PRIVILEGED_KEYS) {
      delete body[key];
    }

    const { displayName, phoneNumber, board, medium, className, parentGuardianName, onboardingCompleted, learningGoals } = body as {
      displayName?: string;
      phoneNumber?: string;
      board?: string;
      medium?: string;
      className?: string;
      parentGuardianName?: string;
      onboardingCompleted?: boolean;
      learningGoals?: unknown;
    };

    const db = getDb();

    if (auth.actor.role === 'STUDENT') {
      const updates: string[] = [];
      const params: (string | number)[] = [];

      if (displayName !== undefined) { updates.push('display_name = ?'); params.push(String(displayName).trim()); }
      if (parentGuardianName !== undefined) {
        if (typeof parentGuardianName !== 'string' || !parentGuardianName.trim()) {
          return NextResponse.json({ error: 'Parent or guardian name is required.' }, { status: 400 });
        }
        updates.push('parent_guardian_name = ?');
        params.push(parentGuardianName.trim());
      }
      if (phoneNumber !== undefined) {
        const cleanPhone = String(phoneNumber).replace(/[\s\-\+]/g, '');
        const PHONE_REGEX = /^[6-9]\d{9}$/;
        if (phoneNumber && !PHONE_REGEX.test(cleanPhone)) {
          return NextResponse.json({ error: 'Invalid phone number format.' }, { status: 400 });
        }
        updates.push('phone_number = ?');
        params.push(cleanPhone);
      }
      if (board !== undefined) { updates.push('board = ?'); params.push(String(board)); }
      if (medium !== undefined) { updates.push('medium = ?'); params.push(String(medium)); }
      if (className !== undefined) { updates.push('class_name = ?'); params.push(String(className)); }
      if (onboardingCompleted !== undefined) { updates.push('onboarding_completed = ?'); params.push(onboardingCompleted ? 1 : 0); }
      if (learningGoals !== undefined) { updates.push('learning_goals = ?'); params.push(JSON.stringify(learningGoals)); }

      if (updates.length > 0) {
        params.push(auth.actor.userId);
        db.prepare(`UPDATE student_profiles SET ${updates.join(', ')} WHERE uid = ?`).run(...params);
      }
    } else if (auth.actor.role === 'TEACHER') {
      const updates: string[] = [];
      const params: (string | number)[] = [];

      if (displayName !== undefined) { updates.push('display_name = ?'); params.push(String(displayName)); }
      if (phoneNumber !== undefined) { updates.push('phone_number = ?'); params.push(String(phoneNumber)); }

      if (updates.length > 0) {
        params.push(auth.actor.userId);
        db.prepare(`UPDATE teacher_profiles SET ${updates.join(', ')} WHERE uid = ?`).run(...params);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Profile Update API] Error:', error);
    return NextResponse.json({ error: 'Profile update failed.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if ('error' in auth) return auth.error;

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    if (type === 'leaderboard') {
      const db = getDb();
      const { clause, params } = schoolUserFilter(auth.actor);
      const extra = auth.actor.role === 'PLATFORM_ADMIN'
        ? ''
        : auth.actor.schoolId
          ? clause
          : auth.actor.role === 'STUDENT'
            ? 'AND u.school_id IS NULL'
            : 'AND 1 = 0';
      const bind = auth.actor.role === 'PLATFORM_ADMIN'
        ? []
        : auth.actor.schoolId
          ? params
          : [];

      const rows = db.prepare(`
        SELECT u.id, sp.display_name, sp.profile_picture, sp.xp, sp.streak_days, sp.questions_solved
        FROM users u
        JOIN student_profiles sp ON sp.uid = u.id
        WHERE u.role = 'STUDENT' AND u.status = 'ACTIVE' ${extra}
        ORDER BY sp.xp DESC
        LIMIT 50
      `).all(...bind) as { id: string; display_name: string; profile_picture: string | null; xp: number; streak_days: number; questions_solved: number }[];

      const leaderboard = rows.map((r, idx) => ({
        id: r.id,
        displayName: r.display_name,
        profilePicture: r.profile_picture,
        xp: r.xp,
        streak: r.streak_days,
        questions: r.questions_solved,
        rank: idx + 1,
      }));
      return NextResponse.json({ leaderboard });
    }

    return NextResponse.json({ error: 'Unknown request type' }, { status: 400 });
  } catch (error) {
    console.error('[Profile GET API] Error:', error);
    return NextResponse.json({ error: 'Failed to load data.' }, { status: 500 });
  }
}
