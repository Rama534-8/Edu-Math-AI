import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getDb } from '@/lib/db';
import { requireRoles } from '@/lib/authz';

const ITEM_TYPES = ['LESSON', 'FORMULA', 'QUESTION'] as const;
type ItemType = (typeof ITEM_TYPES)[number];

/**
 * Phase 7 - student bookmarks.
 *
 * Bookmarks are owned by the signed-in student; every read/write is scoped to
 * `actor.userId`, so one student can never see or remove another's saves.
 */
export async function GET() {
  try {
    const auth = await requireRoles(['STUDENT']);
    if ('error' in auth) return auth.error;

    const bookmarks = getDb()
      .prepare(
        `SELECT id, item_type AS itemType, item_id AS itemId, board,
                chapter_id AS chapterId, topic_id AS topicId, title, created_at AS createdAt
         FROM bookmarks WHERE student_id = ?
         ORDER BY datetime(created_at) DESC`
      )
      .all(auth.actor.userId);

    return NextResponse.json({ bookmarks });
  } catch (error) {
    console.error('[Bookmarks API] Error:', error);
    return NextResponse.json({ error: 'Failed to load bookmarks.' }, { status: 500 });
  }
}

/** Saves (or toggles) a bookmark. Saving twice is idempotent. */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireRoles(['STUDENT']);
    if ('error' in auth) return auth.error;

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const itemType = body?.itemType;
    const itemId = typeof body?.itemId === 'string' ? body.itemId.trim() : '';

    if (typeof itemType !== 'string' || !(ITEM_TYPES as readonly string[]).includes(itemType)) {
      return NextResponse.json({ error: 'Invalid bookmark type.' }, { status: 400 });
    }
    if (!itemId || itemId.length > 200) {
      return NextResponse.json({ error: 'A valid itemId is required.' }, { status: 400 });
    }

    const db = getDb();
    // `save: false` removes; otherwise it is an upsert.
    if (body?.save === false) {
      db.prepare(
        'DELETE FROM bookmarks WHERE student_id = ? AND item_type = ? AND item_id = ?'
      ).run(auth.actor.userId, itemType, itemId);
      return NextResponse.json({ success: true, saved: false, itemType, itemId });
    }

    const title = typeof body?.title === 'string' ? body.title.slice(0, 300) : null;
    const chapterId = typeof body?.chapterId === 'string' ? body.chapterId : null;
    const topicId = typeof body?.topicId === 'string' ? body.topicId : null;
    const board = typeof body?.board === 'string' ? body.board : null;

    db.prepare(
      `INSERT INTO bookmarks (id, student_id, item_type, item_id, board, chapter_id, topic_id, title)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(student_id, item_type, item_id)
       DO UPDATE SET title = COALESCE(excluded.title, bookmarks.title),
                     chapter_id = COALESCE(excluded.chapter_id, bookmarks.chapter_id),
                     topic_id = COALESCE(excluded.topic_id, bookmarks.topic_id),
                     board = COALESCE(excluded.board, bookmarks.board)`
    ).run(randomUUID(), auth.actor.userId, itemType, itemId, board, chapterId, topicId, title);

    return NextResponse.json({ success: true, saved: true, itemType, itemId }, { status: 201 });
  } catch (error) {
    console.error('[Bookmarks API] Error:', error);
    return NextResponse.json({ error: 'Failed to save bookmark.' }, { status: 500 });
  }
}

/** Removes one bookmark by itemType + itemId. */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireRoles(['STUDENT']);
    if ('error' in auth) return auth.error;

    const url = new URL(req.url);
    const itemType = url.searchParams.get('itemType') ?? '';
    const itemId = url.searchParams.get('itemId') ?? '';

    if (!(ITEM_TYPES as readonly string[]).includes(itemType) || !itemId) {
      return NextResponse.json({ error: 'itemType and itemId are required.' }, { status: 400 });
    }

    const result = getDb()
      .prepare('DELETE FROM bookmarks WHERE student_id = ? AND item_type = ? AND item_id = ?')
      .run(auth.actor.userId, itemType, itemId);

    return NextResponse.json({ success: true, removed: result.changes > 0 });
  } catch (error) {
    console.error('[Bookmarks API] Error:', error);
    return NextResponse.json({ error: 'Failed to remove bookmark.' }, { status: 500 });
  }
}