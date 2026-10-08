'use client';

import React, { useEffect, useState } from 'react';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import {
  BarChart3,
  CheckCircle2,
  XCircle,
  Trophy,
  TrendingUp,
  Activity,
  RotateCcw,
  Loader2,
  Users,
  Award,
} from 'lucide-react';

interface AnalyticsData {
  passFail: { passed: number; failed: number; total: number; passRate: number | null };
  scoreBuckets: { bucket: string; count: number }[];
  typeBreakdown: {
    type: string;
    attempts: number;
    avgScore: number | null;
    avgAccuracy: number | null;
    passed: number;
    failed: number;
  }[];
  boardBreakdown: {
    board: string;
    students: number;
    avgXP: number;
    avgQuestionsSolved: number;
  }[];
  topPerformers: {
    name: string;
    className: string;
    board: string;
    xp: number;
    level: number;
    questionsSolved: number;
    streak: number;
  }[];
  recentAssessments: {
    id: string;
    studentName: string;
    type: string;
    percentage: number;
    resultStatus: string;
    correct: number;
    total: number;
    createdAt: string;
  }[];
  activityTrend: { day: string; count: number }[];
  retestStats: {
    totalRetests: number;
    retestPassed: number;
    avgRetestScore: number | null;
  };
}

function formatTypeName(type: string): string {
  const map: Record<string, string> = {
    BASELINE: 'Baseline Diagnostic',
    CHAPTER_QUIZ: 'Chapter Quiz',
    PRACTICE: 'Practice Test',
    MOCK_EXAM: 'Mock Exam',
    RETEST: 'Retest',
  };
  return map[type] || type;
}

export default function SchoolAdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/analytics', { credentials: 'same-origin' })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load analytics.');
        if (!cancelled) setData(json as AnalyticsData);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load analytics.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <RoleGuard allowedRoles={['SCHOOL_ADMIN', 'PLATFORM_ADMIN']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />

        <div className="flex-1 flex">
          <Sidebar />

          <main className="flex-1 flex flex-col min-w-0">
            <Header
              title="Institutional Analytics"
              subtitle="Deep insights into school-wide performance from live database"
            />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
              {error && (
                <Card className="p-4 text-sm text-rose-700 dark:text-rose-300" role="alert">
                  {error}
                </Card>
              )}

              {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-20 text-slate-500" role="status">
                  <Loader2 className="w-5 h-5 animate-spin" /> Loading analytics data...
                </div>
              ) : data ? (
                <>
                  {/* Pass/Fail Overview KPIs */}
                  <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPI
                      label="Total Attempts"
                      value={data.passFail.total}
                      icon={<BarChart3 className="w-4 h-4 text-indigo-500" />}
                    />
                    <KPI
                      label="Passed"
                      value={data.passFail.passed}
                      icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      valueColor="text-emerald-600"
                    />
                    <KPI
                      label="Failed"
                      value={data.passFail.failed}
                      icon={<XCircle className="w-4 h-4 text-rose-500" />}
                      valueColor="text-rose-600"
                    />
                    <KPI
                      label="Pass Rate"
                      value={data.passFail.passRate !== null ? `${data.passFail.passRate}%` : 'N/A'}
                      icon={<TrendingUp className="w-4 h-4 text-amber-500" />}
                      valueColor="text-amber-600"
                    />
                  </section>

                  {/* Score Distribution + Retest Stats */}
                  <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Score Distribution */}
                    <Card className="p-6">
                      <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-indigo-500" /> Score Distribution
                      </h2>
                      {data.scoreBuckets.length === 0 ? (
                        <p className="text-sm text-slate-500">No assessment data yet.</p>
                      ) : (
                        <div className="space-y-2.5">
                          {data.scoreBuckets.map((bucket) => {
                            const maxCount = Math.max(...data.scoreBuckets.map((b) => b.count), 1);
                            return (
                              <div key={bucket.bucket} className="flex items-center gap-3">
                                <span className="text-xs font-mono font-semibold text-slate-500 w-14 text-right shrink-0">
                                  {bucket.bucket}%
                                </span>
                                <div className="flex-1 h-5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                                    style={{ width: `${Math.max((bucket.count / maxCount) * 100, 2)}%` }}
                                  />
                                </div>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-8">
                                  {bucket.count}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </Card>

                    {/* Retest Stats */}
                    <Card className="p-6">
                      <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                        <RotateCcw className="w-4 h-4 text-purple-500" /> Retest Performance
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 text-center">
                          <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{data.retestStats.totalRetests}</p>
                          <p className="text-[10px] text-slate-500 mt-1">Total Retests</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 text-center">
                          <p className="text-2xl font-black text-emerald-600">{data.retestStats.retestPassed}</p>
                          <p className="text-[10px] text-slate-500 mt-1">Passed on Retest</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 text-center">
                          <p className="text-2xl font-black text-indigo-600">
                            {data.retestStats.avgRetestScore !== null ? `${data.retestStats.avgRetestScore}%` : 'N/A'}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-1">Avg Retest Score</p>
                        </div>
                      </div>

                      {/* Activity Trend */}
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-6 mb-3 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-sky-500" /> Activity Trend (Last 7 Days)
                      </h3>
                      {data.activityTrend.length === 0 ? (
                        <p className="text-sm text-slate-500">No activity recorded in the last 7 days.</p>
                      ) : (
                        <div className="flex items-end gap-1.5 h-20">
                          {data.activityTrend.map((day) => {
                            const maxVal = Math.max(...data.activityTrend.map((d) => d.count), 1);
                            const height = Math.max((day.count / maxVal) * 100, 5);
                            return (
                              <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
                                <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300">{day.count}</span>
                                <div
                                  className="w-full rounded-t bg-gradient-to-t from-sky-500 to-sky-400 transition-all"
                                  style={{ height: `${height}%` }}
                                />
                                <span className="text-[8px] text-slate-400">{day.day.slice(5)}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </Card>
                  </section>

                  {/* Assessment Type Breakdown */}
                  <Card className="p-6">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-amber-500" /> Assessment Type Breakdown
                    </h2>
                    {data.typeBreakdown.length === 0 ? (
                      <p className="text-sm text-slate-500">No assessments recorded yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700">
                              <th className="text-left py-2.5 px-3 font-bold text-slate-500">Type</th>
                              <th className="text-center py-2.5 px-3 font-bold text-slate-500">Attempts</th>
                              <th className="text-center py-2.5 px-3 font-bold text-slate-500">Avg Score</th>
                              <th className="text-center py-2.5 px-3 font-bold text-slate-500">Avg Accuracy</th>
                              <th className="text-center py-2.5 px-3 font-bold text-slate-500">Passed</th>
                              <th className="text-center py-2.5 px-3 font-bold text-slate-500">Failed</th>
                              <th className="text-center py-2.5 px-3 font-bold text-slate-500">Pass Rate</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.typeBreakdown.map((row) => {
                              const rate = row.attempts > 0 ? Math.round((row.passed / row.attempts) * 100) : 0;
                              return (
                                <tr key={row.type} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                  <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                                    {formatTypeName(row.type)}
                                  </td>
                                  <td className="py-2.5 px-3 text-center font-bold">{row.attempts}</td>
                                  <td className="py-2.5 px-3 text-center">
                                    {row.avgScore !== null ? `${row.avgScore}%` : '—'}
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    {row.avgAccuracy !== null ? `${row.avgAccuracy}%` : '—'}
                                  </td>
                                  <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">{row.passed}</td>
                                  <td className="py-2.5 px-3 text-center text-rose-600 font-bold">{row.failed}</td>
                                  <td className="py-2.5 px-3 text-center">
                                    <ProgressBar value={rate} size="sm" showPercentage />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>

                  {/* Board Breakdown + Top Performers */}
                  <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Board Breakdown */}
                    <Card className="p-6">
                      <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-500" /> Students by Board
                      </h2>
                      {data.boardBreakdown.length === 0 ? (
                        <p className="text-sm text-slate-500">No student data yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {data.boardBreakdown.map((board) => (
                            <div
                              key={board.board}
                              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50"
                            >
                              <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{board.board}</p>
                                <p className="text-[10px] text-slate-500">
                                  {board.students} students · Avg {board.avgQuestionsSolved} questions solved
                                </p>
                              </div>
                              <Badge variant="primary" size="sm">
                                Avg {board.avgXP} XP
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>

                    {/* Top Performers */}
                    <Card className="p-6">
                      <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-amber-500" /> Top 10 Performers
                      </h2>
                      {data.topPerformers.length === 0 ? (
                        <p className="text-sm text-slate-500">No students yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {data.topPerformers.map((student, idx) => (
                            <div
                              key={`${student.name}-${idx}`}
                              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                            >
                              <span
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                                  idx === 0
                                    ? 'bg-amber-400 text-amber-900'
                                    : idx === 1
                                    ? 'bg-slate-300 text-slate-700'
                                    : idx === 2
                                    ? 'bg-orange-300 text-orange-800'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                }`}
                              >
                                {idx + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                  {student.name}
                                </p>
                                <p className="text-[10px] text-slate-500">
                                  {student.className} · {student.board} · Lvl {student.level}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-xs font-bold text-amber-600">⚡ {student.xp} XP</p>
                                <p className="text-[10px] text-slate-400">{student.questionsSolved} Q&apos;s</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  </section>

                  {/* Recent Assessments */}
                  <Card className="p-6">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                      <Award className="w-4 h-4 text-purple-500" /> Recent Assessment Results
                    </h2>
                    {data.recentAssessments.length === 0 ? (
                      <p className="text-sm text-slate-500">No assessment results yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700">
                              <th className="text-left py-2 px-3 font-bold text-slate-500">Student</th>
                              <th className="text-left py-2 px-3 font-bold text-slate-500">Type</th>
                              <th className="text-center py-2 px-3 font-bold text-slate-500">Score</th>
                              <th className="text-center py-2 px-3 font-bold text-slate-500">Result</th>
                              <th className="text-right py-2 px-3 font-bold text-slate-500">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.recentAssessments.map((a) => (
                              <tr key={a.id} className="border-b border-slate-100 dark:border-slate-800">
                                <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">{a.studentName}</td>
                                <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{formatTypeName(a.type)}</td>
                                <td className="py-2 px-3 text-center font-bold">
                                  {a.correct}/{a.total} ({a.percentage}%)
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <Badge
                                    variant={a.resultStatus === 'PASS' ? 'success' : 'danger'}
                                    size="sm"
                                  >
                                    {a.resultStatus}
                                  </Badge>
                                </td>
                                <td className="py-2 px-3 text-right text-slate-500">
                                  {new Date(a.createdAt).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>
                </>
              ) : null}
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}

function KPI({
  label,
  value,
  icon,
  valueColor,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  valueColor?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-slate-500">{label}</span>
        {icon}
      </div>
      <div className={`mt-3 text-2xl font-black ${valueColor || 'text-slate-900 dark:text-slate-100'}`}>
        {value}
      </div>
    </Card>
  );
}
