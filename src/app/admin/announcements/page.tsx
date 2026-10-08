'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ModuleShell, { ErrorBlock, LoadingBlock, EmptyBlock } from '@/components/layout/ModuleShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AnnouncementCard, type AnnouncementView } from '@/components/announcements/AnnouncementCard';
import { Pin, PinOff, Power, Plus, Pencil, Trash2 } from 'lucide-react';
import type { UserRole } from '@/types';

const ROLES: UserRole[] = ['PLATFORM_ADMIN', 'SCHOOL_ADMIN'];

const TYPES = ['GENERAL', 'IMPORTANT', 'EXAM', 'HOLIDAY', 'ASSIGNMENT', 'EVENT'];
const AUDIENCES = ['EVERYONE', 'STUDENTS', 'TEACHERS', 'PARENTS', 'SCHOOL', 'CLASS', 'SECTION'];

interface Target {
  id: string;
  name: string;
  classId?: string;
}

interface FormState {
  id?: string;
  title: string;
  message: string;
  type: string;
  audience: string;
  targetClassId: string;
  targetSectionId: string;
  isPinned: boolean;
  isActive: boolean;
  publishAt: string;
  expiresAt: string;
}

const EMPTY_FORM: FormState = {
  title: '',
  message: '',
  type: 'GENERAL',
  audience: 'EVERYONE',
  targetClassId: '',
  targetSectionId: '',
  isPinned: false,
  isActive: true,
  publishAt: '',
  expiresAt: '',
};

const inputCls =
  'w-full text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500';
const labelCls = 'block text-xs font-semibold text-slate-500 mb-1';

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementView[]>([]);
  const [classes, setClasses] = useState<Target[]>([]);
  const [sections, setSections] = useState<Target[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/announcements?includeInactive=true', {
        credentials: 'same-origin',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load announcements.');
      setAnnouncements((json.announcements as AnnouncementView[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load announcements.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    // Targets come from the existing admin classes API - nothing is invented.
    (async () => {
      try {
        const res = await fetch('/api/admin/classes', { credentials: 'same-origin' });
        const json = await res.json();
        if (!res.ok) return;
        const rows = (json.classes ?? []) as {
          id: string;
          name: string;
          sections?: { id: string; name: string }[];
        }[];
        setClasses(rows.map((c) => ({ id: c.id, name: c.name })));
        setSections(
          rows.flatMap((c) =>
            (c.sections ?? []).map((s) => ({ id: s.id, name: `${c.name} - ${s.name}`, classId: c.id }))
          )
        );
      } catch {
        /* target lists are optional */
      }
    })();
  }, [load]);

  const filteredSections = useMemo(
    () => (form.targetClassId ? sections.filter((s) => s.classId === form.targetClassId) : sections),
    [sections, form.targetClassId]
  );

  const update = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const startEdit = (a: AnnouncementView) => {
    setForm({
      id: a.id,
      title: a.title,
      message: a.message,
      type: a.type,
      audience: a.audience,
      targetClassId: (a as { targetClassId?: string }).targetClassId ?? '',
      targetSectionId: (a as { targetSectionId?: string }).targetSectionId ?? '',
      isPinned: Boolean(a.isPinned),
      isActive: a.isActive !== false,
      publishAt: a.publishAt ? a.publishAt.slice(0, 16) : '',
      expiresAt: a.expiresAt ? a.expiresAt.slice(0, 16) : '',
    });
    setFormError('');
    setShowForm(true);
  };

  const reset = () => {
    setForm(EMPTY_FORM);
    setFormError('');
    setShowForm(false);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        title: form.title,
        message: form.message,
        type: form.type,
        audience: form.audience,
        targetClassId: form.targetClassId || null,
        targetSectionId: form.targetSectionId || null,
        isPinned: form.isPinned,
        isActive: form.isActive,
        publishAt: form.publishAt || null,
        expiresAt: form.expiresAt || null,
      };
      const isEdit = Boolean(form.id);
      const res = await fetch('/api/admin/announcements', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(isEdit ? { id: form.id, ...payload } : payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save announcement.');
      reset();
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Failed to save announcement.');
    } finally {
      setSaving(false);
    }
  };

  const patch = async (id: string, body: Record<string, unknown>) => {
    setError('');
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ id, ...body }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update announcement.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update announcement.');
    }
  };

  const deactivate = async (id: string) => {
    setError('');
    try {
      const res = await fetch(`/api/admin/announcements?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to deactivate announcement.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to deactivate announcement.');
    }
  };

  return (
    <ModuleShell
      allowedRoles={ROLES}
      title="Announcements"
      subtitle="Publish notices to your whole school or a specific class or section"
    >
      {error && <ErrorBlock message={error} />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {announcements.length} announcement{announcements.length === 1 ? '' : 's'}
        </p>
        <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => (showForm ? reset() : setShowForm(true))}>
          {showForm ? 'Close' : 'New announcement'}
        </Button>
      </div>

      {showForm ? (
        <Card className="p-5">
          <form onSubmit={submit} className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {form.id ? 'Edit announcement' : 'Create announcement'}
            </h2>
            {formError && <ErrorBlock message={formError} />}

            <div>
              <label className={labelCls} htmlFor="an-title">Title</label>
              <input id="an-title" className={inputCls} value={form.title} maxLength={200}
                onChange={(e) => update({ title: e.target.value })} required />
            </div>

            <div>
              <label className={labelCls} htmlFor="an-message">Message</label>
              <textarea id="an-message" className={`${inputCls} min-h-[110px]`} value={form.message} maxLength={5000}
                onChange={(e) => update({ message: e.target.value })} required />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls} htmlFor="an-type">Type</label>
                <select id="an-type" className={inputCls} value={form.type} onChange={(e) => update({ type: e.target.value })}>
                  {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls} htmlFor="an-audience">Target audience</label>
                <select id="an-audience" className={inputCls} value={form.audience}
                  onChange={(e) => update({ audience: e.target.value, targetSectionId: '' })}>
                  {AUDIENCES.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>

            {form.audience === 'CLASS' ? (
              <div>
                <label className={labelCls} htmlFor="an-class">Class</label>
                <select id="an-class" className={inputCls} value={form.targetClassId}
                  onChange={(e) => update({ targetClassId: e.target.value, targetSectionId: '' })} required>
                  <option value="">Select a class</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            ) : null}

            {form.audience === 'SECTION' ? (
              <div>
                <label className={labelCls} htmlFor="an-section">Section</label>
                <select id="an-section" className={inputCls} value={form.targetSectionId}
                  onChange={(e) => update({ targetSectionId: e.target.value })} required>
                  <option value="">Select a section</option>
                  {filteredSections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls} htmlFor="an-publish">Publish date (optional)</label>
                <input id="an-publish" type="datetime-local" className={inputCls} value={form.publishAt}
                  onChange={(e) => update({ publishAt: e.target.value })} />
              </div>
              <div>
                <label className={labelCls} htmlFor="an-expires">Expiry date (optional)</label>
                <input id="an-expires" type="datetime-local" className={inputCls} value={form.expiresAt}
                  onChange={(e) => update({ expiresAt: e.target.value })} />
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <input type="checkbox" checked={form.isPinned} onChange={(e) => update({ isPinned: e.target.checked })} />
                Pin to top
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <input type="checkbox" checked={form.isActive} onChange={(e) => update({ isActive: e.target.checked })} />
                Active
              </label>
            </div>

            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? 'Saving...' : form.id ? 'Save changes' : 'Publish'}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={reset}>Cancel</Button>
            </div>
          </form>
        </Card>
      ) : null}

      {isLoading ? (
        <LoadingBlock label="Loading announcements..." />
      ) : announcements.length === 0 ? (
        <EmptyBlock
          title="No announcements yet"
          description="Create your first announcement to notify students, teachers or parents."
        />
      ) : (
        <div className="space-y-3">
          {announcements.map((item) => (
            <div key={item.id} className="space-y-2">
              <AnnouncementCard announcement={item} showStatus />
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => startEdit(item)}
                  leftIcon={<Pencil className="w-3.5 h-3.5" />}>Edit</Button>
                <Button size="sm" variant="ghost"
                  onClick={() => patch(item.id, { isPinned: !item.isPinned })}
                  leftIcon={item.isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}>
                  {item.isPinned ? 'Unpin' : 'Pin'}
                </Button>
                <Button size="sm" variant="ghost"
                  onClick={() => patch(item.id, { isActive: item.isActive === false })}
                  leftIcon={<Power className="w-3.5 h-3.5" />}>
                  {item.isActive === false ? 'Activate' : 'Deactivate'}
                </Button>
                {item.isActive === false ? null : (
                  <Button size="sm" variant="ghost" onClick={() => deactivate(item.id)}
                    leftIcon={<Trash2 className="w-3.5 h-3.5" />}>Delete</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Badge variant="secondary" size="sm">Tip</Badge>
        Deleting deactivates the announcement so existing notifications stay intact.
      </div>
    </ModuleShell>
  );
}
