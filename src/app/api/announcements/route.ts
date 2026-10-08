import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/authz';
import { queryAnnouncementsForActor } from '@/lib/announcements';

/**
 * GET /api/announcements
 *
 * The single read surface every role uses. Visibility is decided entirely by
 * `visibilityClause`, so a student can never see a teachers-only notice, a
 * parent only sees notices for their own child, and out-of-scope class/section
 * notices never leak.
 *
 * Only live announcements are returned by default (active, published, not
 * expired), pinned first and newest first.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if ('error' in auth) return auth.error;

    const url = new URL(req.url);
    const limit = Math.min(Number(url.searchParams.get('limit') ?? 50) || 50, 200);

    const announcements = queryAnnouncementsForActor(getDb(), auth.actor, {
      onlyActiveWindow: true,
      limit,
    });

    return NextResponse.json({ announcements, role: auth.actor.role });
  } catch (error) {
    console.error('[Announcements API] Error:', error);
    return NextResponse.json({ error: 'Failed to load announcements.' }, { status: 500 });
  }
}