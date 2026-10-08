import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireRoles } from '@/lib/authz';
import {
  insertAnnouncement,
  notifyAnnouncementAudience,
  queryAnnouncementsForActor,
  validateAnnouncement,
} from '@/lib/announcements';

/**
 * Admin -> Announcements management.
 *
 * PLATFORM_ADMIN manages platform notices (may leave the school blank).
 * SCHOOL_ADMIN manages notices for their own school only.
 */
const ADMIN_ROLES = ['PLATFORM_ADMIN', 'SCHOOL_ADMIN'];

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRoles(ADMIN_ROLES);
    if ('error' in auth) return auth.error;

    const url = new URL(req.url);
    // Admins need the full list (including inactive) to manage it.
    const includeInactive = url.searchParams.get('includeInactive') !== 'false';
    const limit = Math.min(Number(url.searchParams.get('limit') ?? 100) || 100, 200);

    const announcements = queryAnnouncementsForActor(getDb(), auth.actor, {
      onlyActiveWindow: !includeInactive,
      limit,
    });

    return NextResponse.json({ announcements, scope: auth.actor.role });
  } catch (error) {
    console.error('[Admin Announcements API] Error:', error);
    return NextResponse.json({ error: 'Failed to load announcements.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRoles(ADMIN_ROLES);
    if ('error' in auth) return auth.error;

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const schoolId = auth.actor.schoolId ?? null;
    const validated = validateAnnouncement(getDb(), body, schoolId);
    if (!validated.ok || !validated.value) {
      return NextResponse.json({ error: validated.error ?? 'Invalid announcement.' }, { status: 400 });
    }

    const db = getDb();
    const id = insertAnnouncement(db, auth.actor.userId, schoolId, validated.value);
    const notified = notifyAnnouncementAudience(db, {
      id,
      title: validated.value.title,
      type: validated.value.type,
      audience: validated.value.audience,
      targetClassId: validated.value.targetClassId,
      targetSectionId: validated.value.targetSectionId,
      schoolId,
    });

    return NextResponse.json({ success: true, id, notified }, { status: 201 });
  } catch (error) {
    console.error('[Admin Announcements API] Error:', error);
    return NextResponse.json({ error: 'Failed to create announcement.' }, { status: 500 });
  }
}

/**
 * PATCH supports partial updates: title, message, type, audience, targets,
 * pin state and active state. A pin toggle is the common case and needs no
 * extra payload. Re-notification only happens when an inactive announcement is
 * switched back on.
 */
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireRoles(ADMIN_ROLES);
    if ('error' in auth) return auth.error;

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const id = typeof body?.id === 'string' ? body.id : '';
    if (!id) return NextResponse.json({ error: 'id is required.' }, { status: 400 });

    const db = getDb();
    const existing = db
      .prepare(
        `SELECT id, school_id AS schoolId, title, message, type, audience,
                target_class_id AS targetClassId, target_section_id AS targetSectionId,
                is_pinned AS isPinned, is_active AS isActive,
                publish_at AS publishAt, expires_at AS expiresAt
         FROM announcements WHERE id = ?`
      )
      .get(id) as
      | {
          id: string; schoolId: string | null; title: string; message: string;
          type: string; audience: string; targetClassId: string | null;
          targetSectionId: string | null; isPinned: number | boolean; isActive: number | boolean;
          publishAt: string | null; expiresAt: string | null;
        }
      | undefined;
    if (!existing) return NextResponse.json({ error: 'Announcement not found.' }, { status: 404 });

    // A school admin may only edit announcements inside their own school.
    if (auth.actor.role === 'SCHOOL_ADMIN' && existing.schoolId !== auth.actor.schoolId) {
      return NextResponse.json({ error: 'Announcement is outside your school.' }, { status: 403 });
    }

    const pick = <T,>(key: string, fallback: T): T =>
      key in (body ?? {}) ? (body?.[key] as T) : fallback;

    const merged: Record<string, unknown> = {
      title: pick('title', existing.title),
      message: pick('message', existing.message),
      type: pick('type', existing.type),
      audience: pick('audience', existing.audience),
      targetClassId: pick('targetClassId', existing.targetClassId),
      targetSectionId: pick('targetSectionId', existing.targetSectionId),
      isPinned: pick('isPinned', Boolean(existing.isPinned)),
      isActive: pick('isActive', Boolean(existing.isActive)),
      publishAt: pick('publishAt', existing.publishAt),
      expiresAt: pick('expiresAt', existing.expiresAt),
    };

    const validated = validateAnnouncement(db, merged, auth.actor.schoolId ?? null);
    if (!validated.ok || !validated.value) {
      return NextResponse.json({ error: validated.error ?? 'Invalid announcement.' }, { status: 400 });
    }
    const value = validated.value;

    db.prepare(
      `UPDATE announcements SET
         title = ?, message = ?, type = ?, audience = ?,
         target_class_id = ?, target_section_id = ?,
         is_pinned = ?, is_active = ?, publish_at = ?, expires_at = ?,
         updated_at = datetime('now')
       WHERE id = ?`
    ).run(
      value.title, value.message, value.type, value.audience,
      value.targetClassId, value.targetSectionId,
      value.isPinned ? 1 : 0, value.isActive ? 1 : 0,
      value.publishAt, value.expiresAt, id
    );

    let notified = 0;
    const wasInactive = existing.isActive === 0 || existing.isActive === false;
    if (wasInactive && value.isActive) {
      notified = notifyAnnouncementAudience(db, {
        id,
        title: value.title,
        type: value.type,
        audience: value.audience,
        targetClassId: value.targetClassId,
        targetSectionId: value.targetSectionId,
        schoolId: existing.schoolId,
      });
    }

    return NextResponse.json({ success: true, id, notified });
  } catch (error) {
    console.error('[Admin Announcements API] Error:', error);
    return NextResponse.json({ error: 'Failed to update announcement.' }, { status: 500 });
  }
}

/**
 * DELETE deactivates by default, preserving the record and any notifications
 * that already point at it. `?hard=true` removes the row outright.
 */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireRoles(ADMIN_ROLES);
    if ('error' in auth) return auth.error;

    const url = new URL(req.url);
    const id = url.searchParams.get('id') ?? '';
    if (!id) return NextResponse.json({ error: 'id is required.' }, { status: 400 });

    const db = getDb();
    const existing = db
      .prepare('SELECT school_id AS schoolId FROM announcements WHERE id = ?')
      .get(id) as { schoolId: string | null } | undefined;
    if (!existing) return NextResponse.json({ error: 'Announcement not found.' }, { status: 404 });

    if (auth.actor.role === 'SCHOOL_ADMIN' && existing.schoolId !== auth.actor.schoolId) {
      return NextResponse.json({ error: 'Announcement is outside your school.' }, { status: 403 });
    }

    if (url.searchParams.get('hard') === 'true') {
      db.prepare('DELETE FROM notifications WHERE link = ?').run(`/announcements#${id}`);
      db.prepare('DELETE FROM announcements WHERE id = ?').run(id);
    } else {
      db.prepare(
        "UPDATE announcements SET is_active = 0, updated_at = datetime('now') WHERE id = ?"
      ).run(id);
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('[Admin Announcements API] Error:', error);
    return NextResponse.json({ error: 'Failed to deactivate announcement.' }, { status: 500 });
  }
}
