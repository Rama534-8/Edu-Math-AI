import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireRoles } from '@/lib/authz';
import { applyStudentActivity, type ActivityEventType } from '@/lib/progress';

const ALLOWED: ActivityEventType[] = ['PRACTICE', 'QUIZ', 'LESSON', 'REVISION', 'STUDY_TICK'];

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRoles(['STUDENT']);
    if ('error' in auth) return auth.error;

    const body = await req.json().catch(() => ({})) as { eventType?: unknown };
    const eventType = body.eventType;
    if (typeof eventType !== 'string' || !ALLOWED.includes(eventType as ActivityEventType)) {
      return NextResponse.json({ error: 'Invalid activity event.' }, { status: 400 });
    }

    const result = applyStudentActivity(getDb(), auth.actor.userId, eventType as ActivityEventType);
    return NextResponse.json({
      success: true,
      xp: result.xp,
      level: result.level,
      streakDays: result.streakDays,
      totalStudyMinutes: result.totalStudyMinutes,
      xpAwarded: result.xpAwarded,
    });
  } catch (error) {
    console.error('[Student Progress] Error:', error);
    return NextResponse.json({ error: 'Failed to record progress.' }, { status: 500 });
  }
}
