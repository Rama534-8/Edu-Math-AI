'use client';

import React, { useEffect, useState } from 'react';
import { Activity, BarChart3, GraduationCap, ShieldCheck, Users } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Navbar } from '@/components/layout/Navbar';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Sidebar } from '@/components/layout/Sidebar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

interface PlatformOverview {
  users: {
    total: number;
    students: number;
    teachers: number;
    parents: number;
    schoolAdmins: number;
    platformAdmins: number;
  };
  activity: {
    activeStudentsLast7Days: number;
    assessmentParticipants: number;
    participationRate: number | null;
    recent: { id: string; studentName: string; activityType: string; createdAt: string }[];
  };
  assessments: {
    attempts: number;
    participants: number;
    averageScore: number | null;
    averageAccuracy: number | null;
  };
}

export default function PlatformAdminDashboardPage() {
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const loadOverview = async () => {
      try {
        const response = await fetch('/api/admin/overview', { credentials: 'same-origin' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load platform overview.');
        if (!cancelled) setOverview(data as PlatformOverview);
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load platform overview.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void loadOverview();
    return () => { cancelled = true; };
  }, []);

  const users = overview?.users;
  const assessments = overview?.assessments;
  const activity = overview?.activity;

  return (
    <RoleGuard allowedRoles={['PLATFORM_ADMIN']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex-1 flex">
          <Sidebar />
          <main className="flex-1 flex min-w-0 flex-col">
            <Header title="Platform Administration" subtitle="Live account, activity, and assessment data from SQLite" />
            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
              {error && <Card className="p-4 text-sm text-rose-700 dark:text-rose-300" role="alert">{error}</Card>}

              <section aria-label="Platform totals" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric label="Total accounts" value={isLoading ? '...' : users?.total ?? 0} icon={<Users className="h-4 w-4 text-indigo-500" />} />
                <Metric label="Students" value={isLoading ? '...' : users?.students ?? 0} icon={<GraduationCap className="h-4 w-4 text-emerald-500" />} />
                <Metric label="Teachers" value={isLoading ? '...' : users?.teachers ?? 0} icon={<ShieldCheck className="h-4 w-4 text-sky-500" />} />
                <Metric label="Assessment attempts" value={isLoading ? '...' : assessments?.attempts ?? 0} icon={<BarChart3 className="h-4 w-4 text-amber-500" />} />
              </section>

              <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card className="p-6">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Assessment health</h2>
                    <Badge variant="info" size="sm">SQLite data</Badge>
                  </div>
                  {isLoading ? <p className="text-sm text-slate-500">Loading assessment data...</p> : (
                    <dl className="grid grid-cols-2 gap-4">
                      <Value label="Average score" value={assessments?.averageScore == null ? 'No results' : `${assessments.averageScore}%`} />
                      <Value label="Average accuracy" value={assessments?.averageAccuracy == null ? 'No results' : `${assessments.averageAccuracy}%`} />
                      <Value label="Participating students" value={assessments?.participants ?? 0} />
                      <Value label="Participation rate" value={activity?.participationRate == null ? 'No results' : `${activity.participationRate}%`} />
                    </dl>
                  )}
                </Card>

                <Card className="p-6">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                      <Activity className="h-4 w-4 text-indigo-500" /> Recent activity
                    </h2>
                    <Badge variant="secondary" size="sm">Last 7 days: {isLoading ? '...' : activity?.activeStudentsLast7Days ?? 0} active students</Badge>
                  </div>
                  {isLoading ? <p className="text-sm text-slate-500">Loading recent activity...</p> : activity?.recent.length ? (
                    <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                      {activity.recent.map((item) => (
                        <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                          <span className="font-medium text-slate-800 dark:text-slate-200">{item.studentName} · {item.activityType.toLowerCase()}</span>
                          <time className="text-xs text-slate-500" dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-sm text-slate-500">No student activity has been recorded yet.</p>}
                </Card>
              </section>

              {!isLoading && users?.total === 0 && (
                <Card className="p-8 text-center">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">No accounts are registered yet.</p>
                  <p className="mt-1 text-xs text-slate-500">Platform totals will appear as accounts and assessments are created.</p>
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}

function Metric({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-slate-500">{label}</span>{icon}
      </div>
      <div className="mt-3 text-2xl font-black text-slate-900 dark:text-slate-100">{value}</div>
    </Card>
  );
}

function Value({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">{value}</dd>
    </div>
  );
}