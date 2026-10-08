'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, TrendingUp } from 'lucide-react';

type ChapterPerformance = {
  id: string;
  name: string;
  attempted: number;
  correct: number;
  incorrect: number;
  accuracy: number | null;
  strength: 'STRONG' | 'IMPROVING' | 'NEEDS_PRACTICE' | 'WEAK' | 'NOT_ATTEMPTED';
  mostCommonMistake: string | null;
  weakTopics: { id: string; name: string; attempted: number; accuracy: number }[];
  lastPracticed: string | null;
  improvement: number | null;
};

type ChapterData = {
  chapters: ChapterPerformance[];
  summary: {
    weakest: ChapterPerformance | null;
    strongest: ChapterPerformance | null;
    mostImproved: ChapterPerformance | null;
  };
};

const strengthStyles: Record<ChapterPerformance['strength'], string> = {
  STRONG: 'border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100',
  IMPROVING: 'border-yellow-300 bg-yellow-50 text-yellow-950 dark:border-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-100',
  NEEDS_PRACTICE: 'border-orange-300 bg-orange-50 text-orange-950 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-100',
  WEAK: 'border-rose-300 bg-rose-50 text-rose-950 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100',
  NOT_ATTEMPTED: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400',
};

const strengthLabels: Record<ChapterPerformance['strength'], string> = {
  STRONG: 'Strong',
  IMPROVING: 'Improving',
  NEEDS_PRACTICE: 'Needs practice',
  WEAK: 'Weak',
  NOT_ATTEMPTED: 'Not attempted',
};

function formatDate(date: string | null) {
  if (!date) return 'No practice recorded';
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? 'Date unavailable' : parsed.toLocaleDateString();
}

export function ChapterHeatmap() {
  const [data, setData] = useState<ChapterData | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/users/chapters', { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not load chapter performance.');
        return result as ChapterData;
      })
      .then((result) => {
        setData(result);
        setSelectedId((current) => current ?? result.chapters[0]?.id ?? null);
      })
      .catch((cause: unknown) => {
        if (cause instanceof Error && cause.name === 'AbortError') return;
        setError(cause instanceof Error ? cause.message : 'Could not load chapter performance.');
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [reload]);

  const selected = data?.chapters.find((chapter) => chapter.id === selectedId) ?? null;

  return (
    <section aria-labelledby="chapter-heatmap-title" className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
          Based on your saved assessment answers
        </p>
        <h2 id="chapter-heatmap-title" className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
          Chapter strength &amp; weakness
        </h2>
      </div>

      {loading ? (
        <p className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-800" role="status">
          Loading your chapter results...
        </p>
      ) : error ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200" role="alert">
          <span className="flex items-center gap-2"><AlertCircle className="h-4 w-4" />{error}</span>
          <button
            className="inline-flex items-center gap-2 font-semibold"
            onClick={() => {
              setLoading(true);
              setError(null);
              setReload((value) => value + 1);
            }}
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      ) : data ? (
        <>
          <dl className="grid grid-cols-1 gap-3 border-y border-slate-200 py-3 text-sm dark:border-slate-800 sm:grid-cols-3">
            <div><dt className="text-xs text-slate-500">Weakest chapter</dt><dd className="mt-1 font-semibold">{data.summary.weakest?.name ?? 'No results yet'}</dd></div>
            <div><dt className="text-xs text-slate-500">Strongest chapter</dt><dd className="mt-1 font-semibold">{data.summary.strongest?.name ?? 'No results yet'}</dd></div>
            <div><dt className="text-xs text-slate-500">Most improved</dt><dd className="mt-1 font-semibold">{data.summary.mostImproved ? `${data.summary.mostImproved.name} (+${data.summary.mostImproved.improvement} pts)` : 'More attempts needed'}</dd></div>
          </dl>

          {data.chapters.some((chapter) => chapter.attempted > 0) ? (
            <div role="grid" aria-label="Chapter Heatmap" className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {data.chapters.map((chapter) => (
                <button
                  key={chapter.id}
                  type="button"
                  role="gridcell"
                  aria-pressed={selectedId === chapter.id}
                  aria-label={`Chapter: ${chapter.name}, Score: ${chapter.accuracy === null ? 'No score' : `${chapter.accuracy}%`}, Strength: ${strengthLabels[chapter.strength]}`}
                  onClick={() => setSelectedId(chapter.id)}
                  className={`min-h-20 rounded-lg border p-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${strengthStyles[chapter.strength]} ${selectedId === chapter.id ? 'ring-2 ring-emerald-600 ring-offset-1 dark:ring-offset-slate-950' : ''}`}
                >
                  <span className="block text-sm font-semibold" aria-hidden="true">{chapter.name}</span>
                  <span className="mt-1 flex items-center justify-between gap-2 text-xs" aria-hidden="true">
                    <span>{chapter.accuracy === null ? 'No score' : `${chapter.accuracy}%`}</span>
                    <span>{strengthLabels[chapter.strength]}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center dark:border-slate-700">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No chapter results yet</p>
              <p className="mt-1 text-xs text-slate-500">Complete a baseline assessment or quiz to see your actual chapter performance.</p>
              <Link className="mt-3 inline-flex text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-400" href="/student/baseline">
                Start baseline assessment
              </Link>
            </div>
          )}

          {selected && selected.attempted > 0 && (
            <div className="border-t border-slate-200 pt-4 dark:border-slate-800" aria-live="polite">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{selected.name}</h3>
                  <p className="mt-1 text-xs text-slate-500">Last practiced: {formatDate(selected.lastPracticed)}</p>
                </div>
                <Link className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-400" href="/student/practice">
                  Practice <TrendingUp className="h-4 w-4" />
                </Link>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2 text-xs sm:grid-cols-4">
                <div><dt className="text-slate-500">Questions attempted</dt><dd className="font-semibold">{selected.attempted}</dd></div>
                <div><dt className="text-slate-500">Correct</dt><dd className="font-semibold">{selected.correct}</dd></div>
                <div><dt className="text-slate-500">Incorrect</dt><dd className="font-semibold">{selected.incorrect}</dd></div>
                <div><dt className="text-slate-500">Accuracy</dt><dd className="font-semibold">{selected.accuracy}%</dd></div>
              </dl>
              <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200">Common mistake</h4>
                  <p className="mt-1 text-slate-600 dark:text-slate-400">{selected.mostCommonMistake?.replaceAll('_', ' ') ?? 'No mistakes recorded'}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200">Concepts to revisit</h4>
                  <p className="mt-1 text-slate-600 dark:text-slate-400">{selected.weakTopics.length ? selected.weakTopics.map((topic) => `${topic.name} (${topic.accuracy}%)`).join(', ') : 'No weak concepts identified from saved answers'}</p>
                </div>
              </div>
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}
