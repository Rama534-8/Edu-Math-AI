'use client';

import React, { useEffect, useState } from 'react';
import { BarChart3, CheckCircle2, Target } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Navbar } from '@/components/layout/Navbar';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Sidebar } from '@/components/layout/Sidebar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useAuth } from '@/lib/auth-context';

type ChapterMetric = {
  id: string;
  name: string;
  attempted: number;
  correct: number;
  incorrect: number;
  accuracy: number | null;
  strength: string;
  mostCommonMistake: string | null;
};

export default function ProgressDashboardPage() {
  const { studentProfile, getAssessmentSnapshots, getBaselineSnapshot, getLatestComparableSnapshot } = useAuth();
  const [chapters, setChapters] = useState<ChapterMetric[]>([]);
  const [isLoadingChapters, setIsLoadingChapters] = useState(true);
  const [chapterError, setChapterError] = useState('');
  const snapshots = getAssessmentSnapshots();
  const baseline = getBaselineSnapshot();
  const latestComparable = getLatestComparableSnapshot();
  const answered = snapshots.reduce((total, snapshot) => total + snapshot.correctCount + snapshot.incorrectCount, 0);
  const correct = snapshots.reduce((total, snapshot) => total + snapshot.correctCount, 0);
  const accuracy = answered ? Math.round(correct / answered * 100) : null;
  const mistakes = snapshots.reduce<Record<string, number>>((totals, snapshot) => {
    for (const [category, count] of Object.entries(snapshot.mistakeBreakdown ?? {})) {
      totals[category] = (totals[category] ?? 0) + count;
    }
    return totals;
  }, {});
  const mistakeRows = Object.entries(mistakes).filter(([, count]) => count > 0).sort((a, b) => b[1] - a[1]).slice(0, 5);

  useEffect(() => {
    let cancelled = false;
    const loadChapters = async () => {
      try {
        const response = await fetch('/api/users/chapters', { credentials: 'same-origin' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load chapter performance.');
        if (!cancelled) setChapters(data.chapters as ChapterMetric[]);
      } catch (error) {
        if (!cancelled) setChapterError(error instanceof Error ? error.message : 'Unable to load chapter performance.');
      } finally {
        if (!cancelled) setIsLoadingChapters(false);
      }
    };
    void loadChapters();
    return () => { cancelled = true; };
  }, []);

  return (
    <RoleGuard allowedRoles={['STUDENT']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex-1 flex">
          <Sidebar />
          <main className="flex flex-1 min-w-0 flex-col">
            <Header title="Student Progress & Mastery Analytics" subtitle="Saved assessment performance and chapter accuracy" />
            <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
              <section aria-label="Saved progress totals" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric label="Overall accuracy" value={accuracy === null ? 'No results' : `${accuracy}%`} progress={accuracy} />
                <Metric label="Questions solved" value={studentProfile?.questionsSolved ?? 0} />
                <Metric label="Baseline → comparable result" value={baseline && latestComparable ? `${baseline.percentage}% → ${latestComparable.percentage}%` : 'Not available'} />
                <Metric label="Study time" value={`${studentProfile?.totalStudyMinutes ?? 0} mins`} />
              </section>

              <Card className="p-6">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                  <Target className="h-4 w-4 text-indigo-500" /> Chapter mastery
                </h2>
                {chapterError ? <p className="text-sm text-rose-700 dark:text-rose-300" role="alert">{chapterError}</p> : isLoadingChapters ? (
                  <p className="text-sm text-slate-500">Loading saved chapter performance...</p>
                ) : chapters.some((chapter) => chapter.attempted > 0) ? (
                  <div className="space-y-4">
                    {chapters.filter((chapter) => chapter.attempted > 0).map((chapter) => (
                      <div key={chapter.id} className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{chapter.name}</span>
                          <div className="flex items-center gap-3">
                            <Badge variant={chapter.accuracy !== null && chapter.accuracy >= 80 ? 'success' : chapter.accuracy !== null && chapter.accuracy >= 50 ? 'warning' : 'danger'} size="sm">{chapter.strength.replaceAll('_', ' ')}</Badge>
                            <span className="w-12 text-right font-mono font-bold">{chapter.accuracy ?? 0}%</span>
                          </div>
                        </div>
                        <ProgressBar value={chapter.accuracy ?? 0} size="sm" showPercentage={false} />
                        <p className="text-[11px] text-slate-500">{chapter.attempted} answered · {chapter.correct} correct · {chapter.incorrect} incorrect</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={<Target className="h-6 w-6" />} title="No chapter results yet" description="Complete an assessment to see your actual chapter accuracy and practice priorities." />
                )}
              </Card>

              <Card className="p-6">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                  <BarChart3 className="h-4 w-4 text-amber-500" /> Recorded mistake categories
                </h2>
                {mistakeRows.length ? (
                  <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {mistakeRows.map(([category, count]) => (
                      <li key={category} className="flex items-center justify-between rounded-md border border-slate-200 p-3 text-sm dark:border-slate-800">
                        <span className="text-slate-700 dark:text-slate-300">{category.replaceAll('_', ' ')}</span>
                        <span className="flex items-center gap-1 font-semibold text-slate-900 dark:text-slate-100"><CheckCircle2 className="h-4 w-4 text-amber-500" />{count}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-slate-500">No mistake categories have been recorded yet.</p>}
              </Card>
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}

function Metric({ label, value, progress }: { label: string; value: number | string; progress?: number | null }) {
  return (
    <Card className="p-4">
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <div className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">{value}</div>
      {progress !== undefined && progress !== null && <ProgressBar value={progress} size="sm" showPercentage={false} />}
    </Card>
  );
}
