import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireRoles, requireSchoolId } from '@/lib/authz';
import {
  insertAnnouncement,
  notifyAnnouncementAudience,
  queryAnnouncementsForActor,
  validateAnnouncement,
} from '@/lib/announcements';

/**
 * School admin announcements.
 *
 * Thin, school-scoped wrapper over the shared announcement library so a school
 * admin manages exactly the notices belonging to their own school.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireRoles(['SCHOOL_ADMIN', 'PLATFORM_ADMIN']);
    if ('error' in auth) return auth.error;
    const school = requireSchoolId(auth.actor);
    if ('error' in school) return school.error;

    const url = new URL(req.url);
    const limit = Math.min(Number(url.searchParams.get('limit') ?? 50) || 50, 200);
    const includeInactive = url.searchParams.get('includeInactive') !== 'false';

    const announcements = queryAnnouncementsForActor(getDb(), auth.actor, {
      onlyActiveWindow: !includeInactive,
      limit,
    });

    return NextResponse.json({ announcements, schoolId: school.schoolId });
  } catch (error) {
    console.error('[School Admin Announcements API] Error:', error);
    return NextResponse.json({ error: 'Failed to load announcements.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRoles(['SCHOOL_ADMIN', 'PLATFORM_ADMIN']);
    if ('error' in auth) return auth.error;
    const school = requireSchoolId(auth.actor);
    if ('error' in school) return school.error;

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const validated = validateAnnouncement(getDb(), body, school.schoolId);
    if (!validated.ok || !validated.value) {
      return NextResponse.json({ error: validated.error ?? 'Invalid announcement.' }, { status: 400 });
    }

    const db = getDb();
    const id = insertAnnouncement(db, auth.actor.userId, school.schoolId, validated.value);
    const notified = notifyAnnouncementAudience(db, {
      id,
      title: validated.value.title,
      type: validated.value.type,
      audience: validated.value.audience,
      targetClassId: validated.value.targetClassId,
      targetSectionId: validated.value.targetSectionId,
      schoolId: school.schoolId,
    });

    return NextResponse.json({ success: true, id, notified }, { status: 201 });
  } catch (error) {
    console.error('[School Admin Announcements API] Error:', error);
    return NextResponse.json({ error: 'Failed to publish announcement.' }, { status: 500 });
  }
}

/** Deactivates by default so the record and its notifications are preserved. */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireRoles(['SCHOOL_ADMIN', 'PLATFORM_ADMIN']);
    if ('error' in auth) return auth.error;
    const school = requireSchoolId(auth.actor);
    if ('error' in school) return school.error;

    const url = new URL(req.url);
    const id = url.searchParams.get('id') ?? '';
    if (!id) return NextResponse.json({ error: 'id is required.' }, { status: 400 });

    const db = getDb();
    const result = db
      .prepare('UPDATE announcements SET is_active = 0, updated_at = datetime(\'now\') WHERE id = ? AND school_id = ?')
      .run(id, school.schoolId);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Announcement not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('[School Admin Announcements API] Error:', error);
    return NextResponse.json({ error: 'Failed to deactivate announcement.' }, { status: 500 });
  }
}