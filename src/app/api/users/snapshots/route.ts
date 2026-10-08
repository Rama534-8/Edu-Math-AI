import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { getDb } from '@/lib/db';

// GET - fetch all snapshots for the current student
export async function GET() {
  try {
    const session = await getSessionFromRequest();
    if (!session || session.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const db = getDb();
    const rows = db.prepare(
      'SELECT * FROM assessment_snapshots WHERE student_id = ? ORDER BY created_at ASC'
    ).all(session.userId) as { id: string; snapshot_json: string }[];

    const snapshots = rows.map(r => JSON.parse(r.snapshot_json));
    return NextResponse.json({ snapshots });
  } catch (error) {
    console.error('[Snapshots GET] Error:', error);
    return NextResponse.json({ error: 'Failed to load snapshots.' }, { status: 500 });
  }
}

// POST - save a new snapshot and update XP
export async function POST() {
  return NextResponse.json(
    { error: 'Assessment results can only be saved by the evaluation API.' },
    { status: 405, headers: { Allow: 'GET' } }
  );
}
