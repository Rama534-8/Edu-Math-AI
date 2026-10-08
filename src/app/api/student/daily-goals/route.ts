import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { getDb } from '@/lib/db';
import { randomUUID } from 'crypto';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export async function GET() {
  try {
    const session = await getSessionFromRequest();
    if (!session || session.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    const db = getDb();
    const today = todayISO();
    const goal = db.prepare(
      'SELECT * FROM daily_goals WHERE student_id = ? AND goal_date = ?'
    ).get(session.userId, today);
    return NextResponse.json({ goal: goal || null });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionFromRequest();
    if (!session || session.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    const { targetMinutes } = await req.json();
    if (!targetMinutes || targetMinutes < 1) {
      return NextResponse.json({ error: 'Target minutes must be >= 1.' }, { status: 400 });
    }
    const db = getDb();
    const today = todayISO();
    const existing = db.prepare(
      'SELECT id FROM daily_goals WHERE student_id = ? AND goal_date = ?'
    ).get(session.userId, today) as { id: string } | undefined;
    if (existing) {
      db.prepare('UPDATE daily_goals SET target_minutes = ? WHERE id = ?')
        .run(targetMinutes, existing.id);
    } else {
      db.prepare('INSERT INTO daily_goals (id, student_id, target_minutes, completed_minutes, goal_date) VALUES (?, ?, ?, 0, ?)')
        .run(randomUUID(), session.userId, targetMinutes, today);
    }
    const goal = db.prepare('SELECT * FROM daily_goals WHERE student_id = ? AND goal_date = ?').get(session.userId, today);
    return NextResponse.json({ goal });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSessionFromRequest();
    if (!session || session.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    const { completedMinutes } = await req.json();
    if (completedMinutes === undefined || completedMinutes < 0) {
      return NextResponse.json({ error: 'completedMinutes must be >= 0.' }, { status: 400 });
    }
    const db = getDb();
    const today = todayISO();
    const existing = db.prepare(
      'SELECT id FROM daily_goals WHERE student_id = ? AND goal_date = ?'
    ).get(session.userId, today) as { id: string } | undefined;
    if (!existing) {
      return NextResponse.json({ error: 'No goal set for today.' }, { status: 404 });
    }
    db.prepare('UPDATE daily_goals SET completed_minutes = ? WHERE id = ?')
      .run(completedMinutes, existing.id);
    const goal = db.prepare('SELECT * FROM daily_goals WHERE student_id = ? AND goal_date = ?').get(session.userId, today);
    return NextResponse.json({ goal });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
  }
}
