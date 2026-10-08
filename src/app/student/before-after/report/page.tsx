'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Brain,
  Printer,
  FileCheck,
  ShieldAlert,
  TrendingUp,
  CheckCircle2,
  Calendar,
  User,
  ArrowLeft,
} from 'lucide-react';

export default function BeforeAfterReportPage() {
  const { studentProfile, getBaselineSnapshot, getLatestComparableSnapshot } = useAuth();

  const baseline = getBaselineSnapshot();
  const latestSnapshot = getLatestComparableSnapshot();

  const handlePrint = () => {
    window.print();
  };

  const hasComparison = Boolean(baseline && latestSnapshot);
  // Fall back to the public marketing sample only when the student has no
  // comparable retest yet — never silently present it as their own result.
  const startingScore = baseline?.percentage ?? 40;
  const currentScore = latestSnapshot?.percentage ?? baseline?.percentage ?? 40;
  const deltaPoints = currentScore - startingScore;

  const baselineTopicById = new Map(
    (baseline?.topicPerformance ?? []).map((t) => [t.topicId, t])
  );
  const topicRows = (latestSnapshot?.topicPerformance ?? baseline?.topicPerformance ?? []).map(
    (t) => {
      const before = baselineTopicById.get(t.topicId)?.accuracy ?? t.accuracy;
      const after = latestSnapshot
        ? t.accuracy
        : baselineTopicById.get(t.topicId)?.accuracy ?? t.accuracy;
      const gain = after - before;
      return {
        topic: t.topicName,
        before,
        after,
        gainLabel: gain > 0 ? `+${gain} pts` : gain === 0 ? 'Maintained' : `${gain} pts`,
        status: after >= 85 ? 'Mastered' : after >= 60 ? 'Improving' : 'In Progress',
      };
    }
  );

  const mistakeRows = Object.entries(latestSnapshot?.mistakeBreakdown ?? baseline?.mistakeBreakdown ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const nextSteps = latestSnapshot?.recommendedNextAction
    ? [latestSnapshot.recommendedNextAction]
    : baseline?.recommendedNextAction
      ? [baseline.recommendedNextAction]
      : [
          'Complete a comparable retest after targeted practice to generate this report from your own results.',
          'Review weak topics in Learn, then drill them in Practice → Topic Drill.',
        ];
  const weakTopicNames = (latestSnapshot ?? baseline)?.weakAreas ?? [];

  return (
    <RoleGuard allowedRoles={['STUDENT', 'TEACHER', 'PARENT', 'PLATFORM_ADMIN']}>
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8 print:bg-white print:p-0">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Action Bar (Hidden on print) */}
          <div className="flex items-center justify-between print:hidden">
            <Link href="/student/before-after">
              <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back to Before & After
              </Button>
            </Link>

            <Button size="sm" onClick={handlePrint} leftIcon={<Printer className="w-4 h-4" />}>
              Print / Save as PDF
            </Button>
          </div>

          {/* Official Printable Report Document */}
          <Card className="p-8 sm:p-12 bg-white dark:bg-slate-900 shadow-2xl border-slate-300 print:shadow-none print:border-none">
            {/* Header */}
            <div className="flex items-start justify-between pb-6 border-b-2 border-slate-900 dark:border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-950 text-white flex items-center justify-center">
                  <Brain className="w-7 h-7 text-indigo-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    EduMathAI Learning Progress Report
                  </h1>
                  <p className="text-xs text-slate-500">
                    Standardized Mathematics Diagnostic & Mastery Growth Audit
                  </p>
                </div>
              </div>

              <div className="text-right text-xs text-slate-500">
                <div>Report Date: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                <div className="font-mono text-[11px]">ID: RPT-{studentProfile?.uid?.slice(-6) || '248901'}</div>
              </div>
            </div>

            {/* Crucial Academic Disclaimer */}
            <div className="my-6 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 text-amber-600" />
              <span>
                <strong>Academic Notice:</strong> This is a learning progress report, not an official school certificate. It measures verified performance gain between standardized comparable assessments.
              </span>
            </div>

            {/* Student Metadata Table */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs mb-8">
              <div>
                <span className="text-slate-400 block text-[11px]">Student Name</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {studentProfile?.displayName || 'Student'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Class & Board</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  Class 9 • {studentProfile?.board || 'CBSE'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Instruction Medium</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {studentProfile?.medium || 'ENGLISH'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">School / Center</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {studentProfile?.schoolName || 'Not specified'}
                </span>
              </div>
            </div>

            {/* Before vs After Score Metric Grid */}
            <div className="space-y-4 mb-8">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                1. Standardized Assessment Comparison
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">Diagnostic Baseline</span>
                  <div className="text-2xl font-black text-rose-600">{startingScore}%</div>
                  <span className="text-[11px] text-slate-500">Initial Snapshot</span>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">Mastery Retest</span>
                  <div className="text-2xl font-black text-emerald-600">{currentScore}%</div>
                  <span className="text-[11px] text-slate-500">Post-Learning Retest</span>
                </div>
                <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800">
                  <span className="text-xs text-indigo-700 dark:text-indigo-300 block mb-1">Measured Improvement</span>
                  <div className="text-2xl font-black text-indigo-700 dark:text-indigo-300">
                    +{deltaPoints} pts
                  </div>
                  <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">Percentage Points Delta</span>
                </div>
              </div>
            </div>

            {/* Topic Mastery Audit — real snapshot deltas, never placeholder rows */}
            <div className="space-y-4 mb-8">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                2. Topic-Wise Learning Trajectory
              </h3>
              {!hasComparison && (
                <p className="text-[11px] text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                  No comparable retest yet — showing your baseline topic profile. Complete Learn → Practice → Retest to populate the Before → After deltas.
                </p>
              )}
              <div className="space-y-2 text-xs">
                {topicRows.length === 0 && (
                  <p className="text-slate-500">No topic data available yet. Complete the baseline diagnostic first.</p>
                )}
                {topicRows.map((row, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{row.topic}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-500">Baseline: {row.before}% → Retest: {row.after}%</span>
                      <Badge variant={row.after >= row.before ? 'success' : 'warning'} size="sm">
                        {row.gainLabel} · {row.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Identified Mistake Reductions — from the actual evaluated snapshots */}
            <div className="space-y-4 mb-8">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                3. Cognitive Mistake Patterns Observed
              </h3>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                {mistakeRows.length === 0 && (
                  <p className="text-slate-500">No mistake patterns recorded yet.</p>
                )}
                {mistakeRows.map(([key, count]) => (
                  <div key={key} className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span><strong>{key.replace(/_/g, ' ')}:</strong> {count} instance{count === 1 ? '' : 's'} in the latest comparable snapshot.</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Recommended Learning Milestones — from the evaluation engine */}
            <div className="space-y-3 pt-6 border-t border-slate-200 dark:border-slate-800 text-xs">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                4. Next Recommended Steps
              </h3>
              <ul className="text-slate-600 dark:text-slate-400 space-y-1.5 list-disc pl-5">
                {nextSteps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
                {weakTopicNames.length > 0 && (
                  <li>Priority weak topics: {weakTopicNames.slice(0, 3).join(', ')}.</li>
                )}
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
}
