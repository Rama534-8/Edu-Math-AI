'use client';

import React, { useEffect, useState } from 'react';
import ModuleShell, { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/layout/ModuleShell';
import { AnnouncementCard, type AnnouncementView } from '@/components/announcements/AnnouncementCard';
import type { UserRole } from '@/types';

const ROLES: UserRole[] = ['TEACHER', 'SCHOOL_ADMIN', 'PLATFORM_ADMIN'];

export default function TeacherAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/teacher/announcements', { credentials: 'same-origin' });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load announcements.');
        if (!cancelled) setAnnouncements((json.announcements as AnnouncementView[]) ?? []);
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Failed to load announcements.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <ModuleShell allowedRoles={ROLES} title="Announcements" subtitle="Notices published by your school administration">
      {error && <ErrorBlock message={error} />}

      {isLoading ? (
        <LoadingBlock label="Loading announcements..." />
      ) : announcements.length === 0 ? (
        <EmptyBlock
          title="No announcements"
          description="Notices from your school administration will appear here. Teachers receive announcements addressed to Everyone or Teachers."
        />
      ) : (
        <div className="space-y-3">
          {announcements.map((item) => (
            <AnnouncementCard key={item.id} announcement={item} />
          ))}
        </div>
      )}
    </ModuleShell>
  );
}