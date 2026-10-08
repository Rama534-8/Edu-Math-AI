import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';

/**
 * GET /api/notifications
 * Returns the current user's notifications (latest 30, unread first).
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const db = getDb();
    const notifications = db
      .prepare(
        `SELECT id, type, title, message, is_read, link, created_at
         FROM notifications
         WHERE user_id = ?
         ORDER BY is_read ASC, datetime(created_at) DESC
         LIMIT 50`
      )
      .all(session.userId) as any[];

    // Count unread across ALL rows, not just the returned page, so the badge
    // stays correct when a user has more than the page size.
    const unread = db
      .prepare('SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0')
      .get(session.userId) as { count: number };

    return NextResponse.json({
      notifications,
      unreadCount: unread.count,
      unreadInView: notifications.filter((n) => !n.is_read).length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * PATCH /api/notifications
 * Mark notifications as read.
 * Body: { ids: string[] } or { all: true }
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionFromRequest();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const body = await req.json();
    const db = getDb();

    if (body.all) {
      db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(session.userId);
    } else if (Array.isArray(body.ids) && body.ids.length > 0) {
      const placeholders = body.ids.map(() => '?').join(',');
      db.prepare(
        `UPDATE notifications SET is_read = 1 WHERE user_id = ? AND id IN (${placeholders})`
      ).run(session.userId, ...body.ids);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
