'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth-context';
import { computeBeforeAfterComparison } from '@/lib/deterministic-evaluator';
import {
  TrendingUp,
  Award,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  RotateCcw,
  Clock,
  Target,
} from 'lucide-react';

export default function BeforeAfterPage() {
  const { getBaselineSnapshot, getLatestComparableSnapshot } = useAuth();

  const baseline = getBaselineSnapshot();
  const latestSnapshot = getLatestComparableSnapshot();

  const comparison = baseline
    ? computeBeforeAfterComparison(baseline, latestSnapshot)
    : null;

  return (
    <RoleGuard allowedRoles={['STUDENT']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />

        <div className="flex-1 flex">
          <Sidebar />

          <main className="flex-1 flex flex-col min-w-0">
            <Header
              title="Before & After Measurable Improvement ⭐⭐⭐"
              subtitle="Standardized comparison between diagnostic baseline and post-learning retest"
            />

            <div className="p-6 max-w-6xl w-full mx-auto space-y-8">
              {/* Competition Showcase Banner */}
              <Card className="p-6 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 border-emerald-500/30 text-white shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Academic Standard: Percentage Points Delta
                    </div>
                    <h2 className="text-2xl font-black">
                      Measurable Learning Gains Evidence
                    </h2>
                    <p className="text-xs text-slate-300 max-w-xl mt-1">
                      EduMathAI uses deterministic evaluation algorithms. We only compare standardized, comparable assessments covering matched Class 9 syllabus weightings.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    <Link href="/student/before-after/report">
                      <Button
                        size="sm"
                        className="bg-white text-slate-950 hover:bg-slate-100 font-bold border-none"
                        leftIcon={<FileText className="w-3.5 h-3.5" />}
                      >
                        Generate Progress Report
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>

              {/* If no baseline test taken */}
              {!baseline && (
                <Card className="p-12 text-center">
                  <Target className="w-12 h-12 text-indigo-500 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
                    Not Enough Assessment Data Yet
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
                    Complete your baseline diagnostic assessment first to establish your immutable starting point.
                  </p>
                  <Link href="/student/baseline">
                    <Button size="sm">Take Baseline Assessment</Button>
                  </Link>
                </Card>
              )}

              {/* If baseline exists and comparison is computed */}
              {baseline && comparison && (
                <div className="space-y-8">
                  {/* Core Side-by-Side Comparison Table */}
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          Comprehensive Performance Delta (Before vs Current)
                        </h3>
                        <p className="text-xs text-slate-500">{comparison.comparisonReason}</p>
                      </div>
                      <Badge variant="success" size="sm">
                        Standardized
                      </Badge>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="p-3.5 rounded-l-xl">Metric</th>
                            <th className="p-3.5 text-center">Before (Baseline)</th>
                            <th className="p-3.5 text-center">Current (Retest)</th>
                            <th className="p-3.5 text-right rounded-r-xl">Change</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {comparison.metrics.map((m, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                              <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                                {m.metricName}
                              </td>
                              <td className="p-3.5 text-center font-mono text-slate-600 dark:text-slate-400">
                                {m.beforeValue} {m.unit}
                              </td>
                              <td className="p-3.5 text-center font-mono font-bold text-slate-900 dark:text-slate-100">
                                {m.currentValue} {m.unit}
                              </td>
                              <td className="p-3.5 text-right font-mono font-black">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs ${
                                    m.delta > 0
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                      : m.delta < 0
                                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                  }`}
                                >
                                  {m.delta > 0 ? `+${m.delta}` : m.delta} {m.unit}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>

                  {/* Topic-by-Topic Mastery Growth Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Improved Topics */}
                    <Card className="p-6 border-emerald-200 dark:border-emerald-900/40">
                      <div className="flex items-center gap-2 mb-4">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          Topics with Measurable Mastery Gain
                        </h3>
                      </div>
                      {comparison.improvedTopics.length > 0 ? (
                        <div className="space-y-3">
                          {comparison.improvedTopics.map((top) => (
                            <div
                              key={top.topicId}
                              className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-xs"
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="font-bold text-slate-900 dark:text-slate-100">
                                  {top.topicName}
                                </span>
                                <span className="font-bold text-emerald-600">
                                  +{top.gainPercentagePoints} pts
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                <span>Before: {top.beforeAccuracy}%</span>
                                <span>→</span>
                                <span className="font-semibold text-emerald-700">
                                  Now: {top.currentAccuracy}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">
                          Complete a post-learning retest to view topic mastery gains.
                        </p>
                      )}
                    </Card>

                    {/* Topics Still Needing Practice */}
                    <Card className="p-6 border-amber-200 dark:border-amber-900/40">
                      <div className="flex items-center gap-2 mb-4">
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          Topics Still Requiring Practice
                        </h3>
                      </div>
                      <div className="space-y-2 text-xs">
                        {comparison.topicsStillNeedingPractice.map((topName, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 flex items-center justify-between"
                          >
                            <span className="font-medium text-amber-900 dark:text-amber-200">
                              {topName}
                            </span>
                            <Link href="/student/practice">
                              <Button size="sm" variant="outline" className="text-xs py-1">
                                Practice Now
                              </Button>
                            </Link>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
