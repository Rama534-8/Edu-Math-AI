'use client';

import React, { useEffect, useState } from 'react';
import ModuleShell, { ErrorBlock, LoadingBlock } from '@/components/layout/ModuleShell';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth-context';
import type { UserRole } from '@/types';

const ROLES: UserRole[] = ['SCHOOL_ADMIN', 'PLATFORM_ADMIN'];

export default function SchoolAdminSettingsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/school-admin/school', { credentials: 'same-origin' });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load settings.');
        if (!cancelled) setData(json);
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Failed to load settings.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const stats = (data?.stats ?? {}) as Record<string, number>;

  return (
    <ModuleShell allowedRoles={ROLES} title="Settings" subtitle="Your administrator account and school configuration">
      {error && <ErrorBlock message={error} />}

      <Card className="p-5">
        <h2 className="mb-4 text-sm font-bold text-slate-900 dark:text-slate-100">Administrator account</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold text-slate-500">Signed in as</dt>
            <dd className="mt-1 text-sm text-slate-800 dark:text-slate-100">{user?.email ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-slate-500">Role</dt>
            <dd className="mt-1"><Badge variant="purple" size="sm">{user?.role ?? 'SCHOOL_ADMIN'}</Badge></dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-slate-400">
          Account credentials are managed from your sign-in email. Contact the platform administrator to change your role.
        </p>
      </Card>

      {isLoading ? (
        <LoadingBlock label="Loading school configuration..." />
      ) : (
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-bold text-slate-900 dark:text-slate-100">School configuration</h2>
          <dl className="grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-semibold text-slate-500">Students</dt>
              <dd className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">{stats.students ?? 0}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-500">Teachers</dt>
              <dd className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">{stats.teachers ?? 0}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-500">Classes</dt>
              <dd className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">{stats.classes ?? 0}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-500">Sections</dt>
              <dd className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">{stats.sections ?? 0}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-500">Parents</dt>
              <dd className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">{stats.parents ?? 0}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-500">Administrators</dt>
              <dd className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">{stats.admins ?? 0}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-slate-400">
            Update the school name and address from the School Profile page.
          </p>
        </Card>
      )}
    </ModuleShell>
  );
}