'use client';

import React, { useEffect, useState } from 'react';
import ModuleShell, { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/layout/ModuleShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AnnouncementCard, type AnnouncementView } from '@/components/announcements/AnnouncementCard';
import type { UserRole } from '@/types';

const ROLES: UserRole[] = ['SCHOOL_ADMIN', 'PLATFORM_ADMIN'];

const TYPES = ['GENERAL', 'IMPORTANT', 'EXAM', 'HOLIDAY', 'ASSIGNMENT', 'EVENT'];

export default function SchoolAdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementView[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState('EVERYONE');
  const [type, setType] = useState('GENERAL');
  const [isPinned, setIsPinned] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    try {
      const res = await fetch('/api/school-admin/announcements', { credentials: 'same-origin' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load announcements.');
      setAnnouncements((json.announcements as AnnouncementView[]) ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load announcements.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  async function publish(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim() || !body.trim()) {
      setError('Title and message are required.');
      return;
    }
    setIsSaving(true);
    setError('');
    setNotice('');
    try {
      const res = await fetch('/api/school-admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message: body, audience, type, isPinned }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to publish announcement.');
      setTitle('');
      setBody('');
      setNotice('Announcement published.');
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to publish announcement.');
    } finally {
      setIsSaving(false);
    }
  }

  async function remove(id: string) {
    setError('');
    const res = await fetch(`/api/school-admin/announcements?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'Failed to delete announcement.');
      return;
    }
    setNotice('Announcement deleted.');
    await load();
  }
return (
    <ModuleShell allowedRoles={ROLES} title="Announcements" subtitle="Publish notices to teachers, students and parents">
      {error && <ErrorBlock message={error} />}
      {notice && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300" role="status">
          {notice}
        </div>
      )}

      <Card className="p-5">
        <h2 className="mb-4 text-sm font-bold text-slate-900 dark:text-slate-100">New announcement</h2>
        <form className="space-y-3" onSubmit={publish}>
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title" aria-label="Announcement title" />
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Write your message..."
            rows={4}
            aria-label="Announcement message"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          />
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={audience}
              onChange={(event) => setAudience(event.target.value)}
              aria-label="Audience"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="EVERYONE">Everyone</option>
              <option value="TEACHERS">Teachers</option>
              <option value="STUDENTS">Students</option>
              <option value="PARENTS">Parents</option>
            </select>
            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
              aria-label="Type"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <input type="checkbox" checked={isPinned} onChange={(event) => setIsPinned(event.target.checked)} />
              Pin to top
            </label>
            <Button type="submit" disabled={isSaving} size="sm">
              {isSaving ? 'Publishing...' : 'Publish announcement'}
            </Button>
          </div>
        </form>
      </Card>

      {isLoading ? (
        <LoadingBlock label="Loading announcements..." />
      ) : announcements.length === 0 ? (
        <EmptyBlock title="No announcements yet" description="Published notices will be listed here with their audience and author." />
      ) : (
        <div className="space-y-3">
          {announcements.map((item) => (
            <div key={item.id} className="space-y-2">
              <AnnouncementCard announcement={item} showStatus />
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => remove(item.id)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </ModuleShell>
  );
}