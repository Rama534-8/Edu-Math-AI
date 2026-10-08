'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Sparkles,
  TrendingUp,
  BookOpen,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Target,
} from 'lucide-react';

// Client panel for /api/student/insights ("Your Learning Insights").
// Every value rendered here comes from the server route, which only reads real
// stored performance data — no percentage is computed in the browser.

interface TopicStat {
  chapterId: string;
  chapterTitle: string;
  topicId: string;
  topicTitle: string;
  topicTitleTelugu: string | null;
  accuracy: number;
  attempted: number;
  correct: number;
  inSelectedCurriculum: boolean;
}

interface ChapterStat {
  chapterId: string;
  chapterTitle: string;
  chapterNumber: number;
  accuracy: number | null;
  attempted: number;
  status: 'MASTERED' | 'DEVELOPING' | 'NEEDS_PRACTICE' | 'NOT_STARTED';
}

interface InsightsData {
  board: 'CBSE' | 'AP_STATE_BOARD';
  hasEnoughData: boolean;
  message: string | null;
  totals: {
    gradedAnswers: number;
    quizzesTaken: number;
    retestsTaken: number;
    mockExamsSubmitted: number;
    gradedAssignments: number;
    assignmentAveragePercent: number | null;
    curriculumChapterCount: number;
  };
  overallAccuracy: number | null;
  strongTopics: TopicStat[];
  needsPracticeTopics: TopicStat[];
  recommended: {
    chapterId: string;
    chapterTitle: string;
    topicId: string;
    topicTitle: string;
    accuracy: number | null;
    reason: string;
    lessonHref: string;
    learningPath: { label: string; href: string }[];
  } | null;
  improvement: {
    available: boolean;
    scoreChangePercentagePoints: number | null;
    baselinePercentage: number | null;
    latestPercentage: number | null;
    reason: string;
  };
  chapterPerformance: ChapterStat[];
}

const STATUS_BADGE: Record<ChapterStat['status'], { label: string; className: string }> = {
  MASTERED: { label: 'Strong', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900' },
  DEVELOPING: { label: 'Developing', className: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border-sky-200 dark:border-sky-900' },
  NEEDS_PRACTICE: { label: 'Needs practice', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-900' },
  NOT_STARTED: { label: 'Not started', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700' },
};

function TopicChips({ topics, tone }: { topics: TopicStat[]; tone: 'strong' | 'weak' }) {
  if (topics.length === 0) {
    return (
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {tone === 'strong'
          ? 'No topic has enough graded answers yet to call it strong.'
          : 'No topic needs urgent practice yet — keep taking quizzes.'}
      </p>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {topics.slice(0, 4).map((t) => (
        <span
          key={`${t.chapterId}-${t.topicId}`}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
            tone === 'strong'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900'
              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900'
          }`}
          title={t.chapterTitle}
        >
          {tone === 'strong' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
          {t.topicTitle} · {t.accuracy}%
        </span>
      ))}
      {topics.length > 4 && (
        <span className="text-[11px] text-slate-400 self-center">+{topics.length - 4} more</span>
      )}
    </div>
  );
}
interface LearningInsightsPanelProps {
  /** 'dashboard' renders the compact card; 'full' renders the whole learning path. */
  variant?: 'dashboard' | 'full';
}

export function LearningInsightsPanel({ variant = 'dashboard' }: LearningInsightsPanelProps) {
  const [data, setData] = React.useState<InsightsData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(null);
    fetch('/api/student/insights')
      .then(async (res) => {
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.error || 'Failed to load insights.');
        setData(payload as InsightsData);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load insights.'))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const boardLabel = data?.board === 'AP_STATE_BOARD' ? 'AP State Board' : 'CBSE';
  const rec = data?.recommended ?? null;

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-3" role="status" aria-label="Loading insights">
          <div className="h-4 w-56 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-20 w-full bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-rose-600 dark:text-rose-400">{error ?? 'Insights unavailable.'}</p>
          <Button size="sm" variant="outline" onClick={load}>
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Your Learning Insights</h3>
              <p className="text-[11px] text-slate-500">
                Class 9 Mathematics · {boardLabel} · built from your real quiz, mock exam &amp; assignment results
              </p>
            </div>
          </div>
          {variant === 'dashboard' && (
            <Link href="/student/insights">
              <Button size="sm" variant="outline" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                View Learning Path
              </Button>
            </Link>
          )}
        </div>

        {!data.hasEnoughData ? (
          <div className="mt-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              {data.message ?? 'Complete more quizzes to generate personalized insights.'}
            </p>
            <Link href="/student/quizzes">
              <Button size="sm" rightIcon={<HelpCircle className="w-3.5 h-3.5" />}>
                Go to Quizzes
              </Button>
            </Link>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/30 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Strong Topics</span>
                <Badge variant="success" size="sm">
                  {data.strongTopics.length}
                </Badge>
              </div>
              <TopicChips topics={data.strongTopics} tone="strong" />
            </div>

            <div className="rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/30 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300">Topics Needing Practice</span>
                <Badge variant="warning" size="sm">
                  {data.needsPracticeTopics.length}
                </Badge>
              </div>
              <TopicChips topics={data.needsPracticeTopics} tone="weak" />
            </div>

            <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/60 dark:bg-indigo-950/30 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300">Improvement</span>
                <TrendingUp className="w-4 h-4 text-indigo-500" />
              </div>
              {data.improvement.available && data.improvement.scoreChangePercentagePoints !== null ? (
                <>
                  <div
                    className={`text-2xl font-black ${
                      data.improvement.scoreChangePercentagePoints >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {data.improvement.scoreChangePercentagePoints >= 0 ? '+' : ''}
                    {data.improvement.scoreChangePercentagePoints} pts
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {data.improvement.baselinePercentage}% → {data.improvement.latestPercentage}% (baseline vs
                    comparable retest)
                  </p>
                </>
              ) : (
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {data.improvement.reason} Improvement appears only when a real baseline and comparable retest both
                  exist.
                </p>
              )}
            </div>
          </div>
        )}
      </Card>
      {/* Recommended next topic — compact strip on the dashboard */}
      {data.hasEnoughData && rec && variant === 'dashboard' && (
        <Card className="p-6 border-indigo-100 dark:border-indigo-900/50 bg-gradient-to-r from-indigo-50/70 to-purple-50/50 dark:from-indigo-950/40 dark:to-purple-950/30">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300">Recommended Next Topic</span>
            <Badge variant="primary" size="sm">
              {rec.accuracy !== null ? `${rec.accuracy}% accuracy` : 'New'}
            </Badge>
          </div>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{rec.topicTitle}</p>
          <p className="text-[11px] text-slate-500 mb-3">
            {rec.chapterTitle} · {rec.reason}
          </p>
          <div className="flex flex-wrap gap-2">
            {rec.learningPath.slice(0, 3).map((step) => (
              <Link key={step.label} href={step.href}>
                <Button size="sm" variant="outline" className="bg-white/70 dark:bg-slate-950/60">
                  {step.label}
                </Button>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Full learning-path extras on /student/insights */}
      {variant === 'full' && (
        <>
          {data.hasEnoughData && rec && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Personalized Learning Path</h4>
                <Badge variant="primary" size="sm">
                  {boardLabel}
                </Badge>
              </div>
              <p className="text-base font-black text-slate-900 dark:text-slate-100">{rec.topicTitle}</p>
              <p className="text-xs text-slate-500 mb-4">
                {rec.chapterTitle} — {rec.reason}
              </p>
              <ol className="space-y-3">
                {rec.learningPath.map((step, idx) => (
                  <li
                    key={step.label}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-4 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 shrink-0 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {step.label}
                      </span>
                    </div>
                    <Link href={step.href} className="shrink-0">
                      <Button size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                        Open
                      </Button>
                    </Link>
                  </li>
                ))}
              </ol>
            </Card>
          )}
          {/* Evidence totals — every figure is a stored record count */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Evidence Behind These Insights</h4>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
              {[
                { label: 'Quizzes taken', value: data.totals.quizzesTaken as React.ReactNode },
                { label: 'Retests taken', value: data.totals.retestsTaken },
                { label: 'Mock exams', value: data.totals.mockExamsSubmitted },
                { label: 'Graded answers', value: data.totals.gradedAnswers },
                { label: 'Overall accuracy', value: data.overallAccuracy === null ? '—' : `${data.overallAccuracy}%` },
                {
                  label: 'Assignments graded',
                  value:
                    data.totals.gradedAssignments === 0
                      ? 0
                      : data.totals.assignmentAveragePercent !== null
                        ? `${data.totals.gradedAssignments} (${data.totals.assignmentAveragePercent}%)`
                        : data.totals.gradedAssignments,
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3"
                >
                  <div className="text-lg font-black text-slate-900 dark:text-slate-100">{s.value}</div>
                  <div className="text-[10px] uppercase tracking-wide text-slate-500">{s.label}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Chapter performance — the student's selected board only */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-indigo-600" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Chapter Progress ({boardLabel}, Class 9)
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <th className="py-2 pr-3">#</th>
                    <th className="py-2 pr-3">Chapter</th>
                    <th className="py-2 pr-3">Accuracy</th>
                    <th className="py-2 pr-3">Answers graded</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.chapterPerformance.map((c) => (
                    <tr key={c.chapterId} className="border-b border-slate-100 dark:border-slate-800/60">
                      <td className="py-2 pr-3 text-slate-400">{c.chapterNumber}</td>
                      <td className="py-2 pr-3 font-semibold text-slate-800 dark:text-slate-200">{c.chapterTitle}</td>
                      <td className="py-2 pr-3">{c.accuracy === null ? '—' : `${c.accuracy}%`}</td>
                      <td className="py-2 pr-3">{c.attempted}</td>
                      <td className="py-2">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-bold ${STATUS_BADGE[c.status].className}`}
                        >
                          {STATUS_BADGE[c.status].label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

