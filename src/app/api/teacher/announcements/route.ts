import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireRoles, teacherCanAccessSection } from '@/lib/authz';
import {
  insertAnnouncement,
  notifyAnnouncementAudience,
  queryAnnouncementsForActor,
  validateAnnouncement,
  type AnnouncementAudience,
} from '@/lib/announcements';

/**
 * Teacher announcements.
 *
 * GET  - announcements addressed to this teacher (school-wide, teachers-only,
 *        and any class/section they are assigned to).
 * POST - create an announcement for a class/section the teacher is genuinely
 *        assigned to. Authorisation relies on the existing teacher_assignments
 *        rows, so no new relationship is created and none is duplicated.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireRoles(['TEACHER', 'SCHOOL_ADMIN', 'PLATFORM_ADMIN']);
    if ('error' in auth) return auth.error;

    const url = new URL(req.url);
    const limit = Math.min(Number(url.searchParams.get('limit') ?? 50) || 50, 200);

    const announcements = queryAnnouncementsForActor(getDb(), auth.actor, {
      onlyActiveWindow: true,
      limit,
    });

    return NextResponse.json({ announcements, schoolId: auth.actor.schoolId });
  } catch (error) {
    console.error('[Teacher Announcements API] Error:', error);
    return NextResponse.json({ error: 'Failed to load announcements.' }, { status: 500 });
  }
}

/**
 * Publish an announcement to a class or section the teacher is assigned to.
 * Only the students actually enrolled in that section (and the teachers
 * assigned to it) are notified.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireRoles(['TEACHER']);
    if ('error' in auth) return auth.error;

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const requestedSection =
      typeof body.targetSectionId === 'string' && body.targetSectionId.trim() ? body.targetSectionId.trim() : null;
    const requestedClass =
      typeof body.targetClassId === 'string' && body.targetClassId.trim() ? body.targetClassId.trim() : null;

    if (!requestedSection && !requestedClass) {
      return NextResponse.json({ error: 'Select a class or section to announce to.' }, { status: 400 });
    }

    if (requestedSection && !teacherCanAccessSection(auth.actor.userId, requestedSection)) {
      return NextResponse.json({ error: 'You are not assigned to that section.' }, { status: 403 });
    }

    if (requestedClass && !requestedSection) {
      const taught = getDb()
        .prepare(
          `SELECT c.id FROM classes c
           JOIN sections s ON s.class_id = c.id
           JOIN teacher_assignments ta ON ta.section_id = s.id
           WHERE c.id = ? AND ta.teacher_id = ? LIMIT 1`
        )
        .get(requestedClass, auth.actor.userId);
      if (!taught) {
        return NextResponse.json({ error: 'You are not assigned to that class.' }, { status: 403 });
      }
    }

    const audience = (body.audience ??
      (requestedSection ? 'SECTION' : 'CLASS')) as AnnouncementAudience;

    const validated = validateAnnouncement(
      getDb(),
      { ...body, audience, targetClassId: requestedClass, targetSectionId: requestedSection },
      auth.actor.schoolId ?? null
    );
    if (!validated.ok || !validated.value) {
      return NextResponse.json({ error: validated.error ?? 'Invalid announcement.' }, { status: 400 });
    }

    const db = getDb();
    const id = insertAnnouncement(db, auth.actor.userId, auth.actor.schoolId ?? null, validated.value);
    const notified = notifyAnnouncementAudience(db, {
      id,
      title: validated.value.title,
      type: validated.value.type,
      audience: validated.value.audience,
      targetClassId: validated.value.targetClassId,
      targetSectionId: validated.value.targetSectionId,
      schoolId: auth.actor.schoolId ?? null,
    });

    return NextResponse.json({ success: true, id, notified }, { status: 201 });
  } catch (error) {
    console.error('[Teacher Announcements API] Error:', error);
    return NextResponse.json({ error: 'Failed to publish announcement.' }, { status: 500 });
  }
}
