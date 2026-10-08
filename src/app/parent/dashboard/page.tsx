'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import {
  Users,
  TrendingUp,
  Activity,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface ParentDashboardChild {
  id: string;
  displayName: string;
  className: string;
  board: string;
  xp: number;
  streakDays: number;
  questionsSolved: number;
  accuracy: number | null;
  improvement: number | null;
}

export default function ParentDashboardPage() {
  const { user } = useAuth();
  const [children, setChildren] = useState<ParentDashboardChild[]>([]);
  const [summary, setSummary] = useState({
    studentsCount: 0,
    activitiesThisWeek: 0,
    averageImprovement: 0 as number | null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/parent/children', { credentials: 'same-origin' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load parent dashboard.');
        if (!cancelled) {
          setChildren(data.children as ParentDashboardChild[]);
          setSummary(data.summary);
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Could not load parent dashboard.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const improvementLabel = children.length === 0
    ? '0%'
    : summary.averageImprovement === null
      ? 'No retest data'
      : `${summary.averageImprovement >= 0 ? '+' : ''}${Math.round(summary.averageImprovement)}%`;

  return (
    <RoleGuard allowedRoles={['PARENT']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex-1 flex">
          <Sidebar />
          <main className="flex-1 flex flex-col min-w-0">
            <Header
              title={`Welcome, ${user?.email || 'Parent'}`}
              subtitle="Monitor your linked students’ learning progress"
            />
            <div className="p-6 space-y-8 max-w-7xl w-full mx-auto">
              {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
              {isLoading ? (
                <div role="status" className="flex items-center justify-center gap-2 py-10 text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin" /> Loading linked student data...
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-100 dark:border-indigo-900/40">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-indigo-950 dark:text-indigo-200">Linked Students</h3>
                        <Users className="w-5 h-5 text-indigo-500" />
                      </div>
                      <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{summary.studentsCount}</div>
                      <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70 mt-1">Children linked to this account</p>
                    </Card>
                    <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-100 dark:border-amber-900/40">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-amber-950 dark:text-amber-200">Recent Activity</h3>
                        <Activity className="w-5 h-5 text-amber-500" />
                      </div>
                      <div className="text-3xl font-black text-amber-600 dark:text-amber-400">{summary.activitiesThisWeek}</div>
                      <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1">Recorded activities this week</p>
                    </Card>
                    <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-100 dark:border-emerald-900/40">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-emerald-950 dark:text-emerald-200">Average Improvement</h3>
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{improvementLabel}</div>
                      <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">
                        {children.length === 0 ? 'No students linked' : 'Based on baseline and later assessments'}
                      </p>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-600" /> My Children
                      </h2>
                      <Link href="/parent/children" className="text-sm font-semibold text-indigo-700 hover:underline dark:text-indigo-300">
                        Link a student
                      </Link>
                    </div>
                    {children.length === 0 ? (
                      <Card className="p-12 text-center flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                          <AlertCircle className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">No children linked yet</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                          Link a student using the unique code shown in their profile.
                        </p>
                        <Link href="/parent/children" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                          Link New Student
                        </Link>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {children.map((child) => (
                          <Card key={child.id} className="p-5 flex flex-col gap-4">
                            <div className="flex items-center justify-between gap-4">
                              <div className="min-w-0">
                                <h3 className="font-bold text-slate-900 dark:text-slate-100 truncate">{child.displayName}</h3>
                                <p className="text-xs text-slate-500">{child.className} · {child.board}</p>
                              </div>
                              <Link href={`/parent/progress?studentId=${encodeURIComponent(child.id)}`} className="shrink-0 text-sm font-semibold text-indigo-700 hover:underline dark:text-indigo-300">
                                View Progress
                              </Link>
                            </div>
                            <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                              <div><p className="text-xs text-slate-500">Accuracy</p><p className="font-semibold">{child.accuracy === null ? 'No data' : `${Math.round(child.accuracy)}%`}</p></div>
                              <div><p className="text-xs text-slate-500">Questions</p><p className="font-semibold">{child.questionsSolved}</p></div>
                              <div><p className="text-xs text-slate-500">Streak · XP</p><p className="font-semibold">{child.streakDays} · {child.xp}</p></div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
