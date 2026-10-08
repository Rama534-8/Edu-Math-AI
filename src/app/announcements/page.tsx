'use client';

import React, { useEffect, useState } from 'react';
import ModuleShell, { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/layout/ModuleShell';
import { AnnouncementCard, type AnnouncementView } from '@/components/announcements/AnnouncementCard';
import type { UserRole } from '@/types';

const ROLES: UserRole[] = ['STUDENT', 'TEACHER', 'PARENT', 'SCHOOL_ADMIN', 'PLATFORM_ADMIN'];

/**
 * Shared announcements feed for every signed-in role. Visibility (and the
 * pinned-first, newest-first ordering) is enforced by the API, so this page
 * never has to filter anything itself.
 */
export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/announcements', { credentials: 'same-origin' });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load announcements.');
        if (!cancelled) setAnnouncements((json.announcements as AnnouncementView[]) ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load announcements.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const pinned = announcements.filter((a) => a.isPinned);
  const rest = announcements.filter((a) => !a.isPinned);

  return (
    <ModuleShell
      allowedRoles={ROLES}
      title="Announcements"
      subtitle="Notices published for you by your school and teachers"
    >
      {error && <ErrorBlock message={error} />}

      {isLoading ? (
        <LoadingBlock label="Loading announcements..." />
      ) : announcements.length === 0 ? (
        <EmptyBlock
          title="No announcements"
          description="Announcements addressed to you will appear here."
        />
      ) : (
        <div className="space-y-4">
          {pinned.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Pinned</h2>
              {pinned.map((item) => (
                <AnnouncementCard key={item.id} announcement={item} />
              ))}
            </section>
          ) : null}

          {rest.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Latest</h2>
              {rest.map((item) => (
                <AnnouncementCard key={item.id} announcement={item} />
              ))}
            </section>
          ) : null}
        </div>
      )}
    </ModuleShell>
  );
}
