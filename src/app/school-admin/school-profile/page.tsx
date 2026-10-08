'use client';

import React, { useEffect, useState } from 'react';
import ModuleShell, { ErrorBlock, LoadingBlock, MetricTile } from '@/components/layout/ModuleShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { UserRole } from '@/types';

const ROLES: UserRole[] = ['SCHOOL_ADMIN', 'PLATFORM_ADMIN'];

interface SchoolProfile {
  school: { id: string; name: string; address: string | null; createdAt: string };
  stats: Record<string, number>;
}

export default function SchoolAdminSchoolProfilePage() {
  const [data, setData] = useState<SchoolProfile | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    try {
      const res = await fetch('/api/school-admin/school', { credentials: 'same-origin' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load school profile.');
      setData(json as SchoolProfile);
      setName(json.school.name ?? '');
      setAddress(json.school.address ?? '');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load school profile.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError('School name is required.');
      return;
    }
    setIsSaving(true);
    setError('');
    setNotice('');
    try {
      const res = await fetch('/api/school-admin/school', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, address }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update school profile.');
      setNotice('School profile updated.');
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to update school profile.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ModuleShell allowedRoles={ROLES} title="School Profile" subtitle="Your institution details and account totals">
      {error && <ErrorBlock message={error} />}
      {notice && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300" role="status">
          {notice}
        </div>
      )}

      {isLoading ? (
        <LoadingBlock label="Loading school profile..." />
      ) : !data ? (
        <ErrorBlock message="School profile is unavailable." />
      ) : (
        <>
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <MetricTile label="Students" value={data.stats.students ?? 0} />
            <MetricTile label="Teachers" value={data.stats.teachers ?? 0} />
            <MetricTile label="Parents" value={data.stats.parents ?? 0} />
            <MetricTile label="Classes" value={data.stats.classes ?? 0} hint={`${data.stats.sections ?? 0} sections`} />
          </section>

          <Card className="p-5">
            <h2 className="mb-4 text-sm font-bold text-slate-900 dark:text-slate-100">Institution details</h2>
            <form className="space-y-4" onSubmit={save}>
              <div>
                <label htmlFor="school-name" className="mb-1.5 block text-xs font-semibold text-slate-500">School name</label>
                <Input id="school-name" value={name} onChange={(event) => setName(event.target.value)} required />
              </div>
              <div>
                <label htmlFor="school-address" className="mb-1.5 block text-xs font-semibold text-slate-500">Address</label>
                <textarea
                  id="school-address"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  rows={3}
                  placeholder="School address"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
              <Button type="submit" disabled={isSaving} size="sm">
                {isSaving ? 'Saving...' : 'Save changes'}
              </Button>
              <p className="text-xs text-slate-400">
                Registered on {new Date(data.school.createdAt).toLocaleDateString()}. Renaming also updates the school name shown on student and teacher profiles.
              </p>
            </form>
          </Card>
        </>
      )}
    </ModuleShell>
  );
}