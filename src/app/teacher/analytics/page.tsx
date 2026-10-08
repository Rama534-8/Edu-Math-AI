'use client';

import { useCallback, useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { BarChart3 } from 'lucide-react';

interface AnalyticsPayload {
  hasData: boolean;
  classes: Record<string, unknown>[];
  students: Record<string, unknown>[];
  types: Record<string, unknown>[];
  recent: Record<string, unknown>[];
}

const text = (v: unknown, fallback = '—') => (typeof v === 'string' && v.trim() ? v : fallback);
const num = (v: unknown) => (typeof v === 'number' ? v : Number(v ?? 0));

export default function TeacherAnalyticsPage() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/teacher/analytics', { credentials: 'same-origin' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load class analytics.');
      setData(json as AnalyticsPayload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load class analytics.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <RoleGuard allowedRoles={['TEACHER', 'PLATFORM_ADMIN']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex-1 flex">
          <Sidebar />
          <main className="flex-1 flex flex-col min-w-0">
            <Header title="Class Analytics & Insights" subtitle="Real assessment performance for the classes assigned to you" />
            <div className="mx-auto w-full max-w-7xl space-y-6 p-6">
              {error && (
                <Card className="border-rose-200 p-4 text-sm text-rose-700 dark:border-rose-800 dark:text-rose-300" role="alert">
                  {error}
                </Card>
              )}

              {isLoading ? (
                <Card className="p-12 text-center text-sm text-slate-500" role="status">
                  Loading class analytics...
                </Card>
              ) : !data?.hasData ? (
                <EmptyState
                  icon={<BarChart3 className="h-6 w-6" />}
                  title="Class analytics are unavailable"
                  description="No assessment results are linked to your assigned classes yet. Once students in your sections sit a baseline or chapter quiz, their real scores appear here."
                />
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {data.classes.map((row) => (
                      <Card key={String(row.classId)} className="p-5">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {text(row.className)}
                          </h3>
                          <Badge variant="info" size="sm">{num(row.students)} students</Badge>
                        </div>
                        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <dt className="text-xs text-slate-500">Attempts</dt>
                            <dd className="font-semibold text-slate-900 dark:text-slate-100">{num(row.attempts)}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-slate-500">Average</dt>
                            <dd className="font-semibold text-slate-900 dark:text-slate-100">
                              {row.averageScore == null ? '—' : `${row.averageScore}%`}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-slate-500">Passed</dt>
                            <dd className="font-semibold text-emerald-600">{num(row.passed)}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-slate-500">Failed</dt>
                            <dd className="font-semibold text-rose-600">{num(row.failed)}</dd>
                          </div>
                        </dl>
                      </Card>
                    ))}
                  </div>
<Card className="overflow-x-auto p-0">
                    <h2 className="p-4 text-sm font-bold text-slate-900 dark:text-slate-100">Student performance</h2>
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        <tr>
                          <th className="p-3.5">Student</th>
                          <th className="p-3.5">Class / Section</th>
                          <th className="p-3.5">Attempts</th>
                          <th className="p-3.5">Average</th>
                          <th className="p-3.5">Best</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {data.students.map((row) => (
                          <tr key={String(row.studentId)} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                            <td className="p-3.5 font-semibold text-slate-900 dark:text-slate-100">{text(row.studentName)}</td>
                            <td className="p-3.5 text-slate-600 dark:text-slate-300">
                              {text(row.className)} · {text(row.sectionName)}
                            </td>
                            <td className="p-3.5 text-slate-600 dark:text-slate-300">{num(row.attempts)}</td>
                            <td className="p-3.5 font-semibold text-slate-900 dark:text-slate-100">
                              {row.averageScore == null ? '—' : `${row.averageScore}%`}
                            </td>
                            <td className="p-3.5 text-slate-600 dark:text-slate-300">
                              {row.bestScore == null ? '—' : `${row.bestScore}%`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Card>

                  {data.types.length > 0 ? (
                    <Card className="p-5">
                      <h2 className="mb-3 text-sm font-bold text-slate-900 dark:text-slate-100">By assessment type</h2>
                      <ul className="space-y-2 text-sm">
                        {data.types.map((row) => (
                          <li key={text(row.type)} className="flex items-center justify-between text-slate-700 dark:text-slate-200">
                            <span>{text(row.type)}</span>
                            <span>
                              {num(row.attempts)} attempts · {row.averageScore == null ? '—' : `${row.averageScore}%`} · {num(row.passed)} passed
                            </span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  ) : null}
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}