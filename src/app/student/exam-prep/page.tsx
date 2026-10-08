'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { MixedMathText } from '@/components/ui/MathRenderer';
import { BookOpen, Sigma, PenTool, RotateCcw, ClipboardList, Trophy } from 'lucide-react';

const BOARDS = [
  { id: 'CBSE', label: 'CBSE' },
  { id: 'AP_STATE_BOARD', label: 'AP State Board' },
];

interface ChapterRow {
  id: string;
  title: string;
  chapterNumber: number;
  topicCount: number;
  href: string;
}

interface TopicRow {
  id: string;
  title: string;
  titleTelugu: string | null;
  lessonCount: number;
  formulaCount: number;
  questionCount: number;
}

interface LessonPack {
  id: string;
  title: string;
  topicId: string;
  topicTitle: string;
  learningObjectives: string[];
  conceptHtml: string;
  examples: { question: string; finalAnswer: string; steps: { explanation?: string }[] }[];
  revisionNotes: string[];
  formulas: { title?: string; latex?: string; description?: string }[];
  href: string;
}

interface QuestionRow {
  id: string;
  topicId: string;
  questionText: string;
  questionTextTelugu: string | null;
  latex?: string;
  marks?: number;
}

interface ResultRow {
  id: string;
  quizTitle: string;
  type: string;
  percentage: number;
  accuracy: number;
  resultStatus: string;
  createdAt: string;
}

interface PackData {
  chapter: { id: string; title: string; href: string };
  topics: TopicRow[];
  lessons: LessonPack[];
  questions: QuestionRow[];
  results: ResultRow[];
}

export default function ExamPrepPage() {
  const [board, setBoard] = useState('CBSE');
  const [chapters, setChapters] = useState<ChapterRow[]>([]);
  const [pack, setPack] = useState<PackData | null>(null);
  const [loadingChapters, setLoadingChapters] = useState(true);
  const [loadingPack, setLoadingPack] = useState(false);
  const [error, setError] = useState('');
  const [topicFilter, setTopicFilter] = useState<string>('ALL');

  useEffect(() => {
    let cancelled = false;
    setLoadingChapters(true);
    setPack(null);
    setTopicFilter('ALL');
    (async () => {
      try {
        const res = await fetch(`/api/student/exam-prep?board=${board}`, {
          credentials: 'same-origin',
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load chapters.');
        if (!cancelled) setChapters((json.chapters as ChapterRow[]) ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load chapters.');
      } finally {
        if (!cancelled) setLoadingChapters(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [board]);

  const openChapter = async (chapterId: string) => {
    setLoadingPack(true);
    setError('');
    setTopicFilter('ALL');
    try {
      const res = await fetch(
        `/api/student/exam-prep?board=${board}&chapterId=${encodeURIComponent(chapterId)}`,
        { credentials: 'same-origin' }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load chapter pack.');
      setPack(json as PackData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load chapter pack.');
    } finally {
      setLoadingPack(false);
    }
  };

const lessons = pack
    ? topicFilter === 'ALL'
      ? pack.lessons
      : pack.lessons.filter((l) => l.topicTitle === topicFilter)
    : [];
  const questions = pack
    ? topicFilter === 'ALL'
      ? pack.questions
      : pack.questions.filter((q) =>
          pack.lessons.some((l) => l.topicTitle === topicFilter && l.topicId === q.topicId)
        )
    : [];

  const topicNames = pack ? ['ALL', ...pack.topics.map((t) => t.title)] : ['ALL'];
  const allFormulas = lessons.flatMap((l) => l.formulas ?? []);
  const allRevision = lessons.flatMap((l) => l.revisionNotes ?? []);
  const allExamples = lessons.flatMap((l) => l.examples ?? []);

  return (
    <RoleGuard allowedRoles={['STUDENT']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex-1 flex">
          <Sidebar />
          <main className="flex-1 flex flex-col min-w-0">
            <Header title="Exam Preparation" subtitle="Board to topic revision pack from your curriculum" />
            <div className="mx-auto w-full max-w-6xl space-y-4 p-4 sm:p-6">
              {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300" role="alert">
                  {error}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {BOARDS.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setBoard(b.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      board === b.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>

{!pack ? (
                loadingChapters ? (
                  <Card className="p-10 text-center text-sm text-slate-500">Loading chapters...</Card>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {chapters.map((c) => (
                      <button key={c.id} onClick={() => openChapter(c.id)} className="text-left">
                        <Card className="h-full p-4 transition-colors hover:border-indigo-300 dark:hover:border-indigo-700">
                          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                            Chapter {c.chapterNumber}
                          </p>
                          <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">{c.title}</p>
                          <p className="mt-1 text-xs text-slate-400">{c.topicCount} topics</p>
                        </Card>
                      </button>
                    ))}
                  </div>
                )
              ) : loadingPack ? (
                <Card className="p-10 text-center text-sm text-slate-500">Loading study pack...</Card>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{pack.chapter.title}</h2>
                    <div className="flex flex-wrap gap-2">
                      <Link href="/student/quizzes" className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700">
                        <ClipboardList className="mr-1 inline h-3.5 w-3.5" /> Practice quiz
                      </Link>
                      <Link href="/student/mock-exams" className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800">
                        <Trophy className="mr-1 inline h-3.5 w-3.5" /> Mock exam
                      </Link>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {topicNames.map((t) => (
                      <button
                        key={t}
                        onClick={() => setTopicFilter(t)}
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                          topicFilter === t
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                        }`}
                      >
                        {t === 'ALL' ? 'All topics' : t}
                      </button>
                    ))}
                  </div>

                  {/* 1 & 5 - Important concepts + revision notes */}
                  <Card className="p-4">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                      <BookOpen className="h-4 w-4" /> Important concepts &amp; revision
                    </h3>
                    <div className="mt-3 space-y-3">
                      {lessons.map((l) => (
                        <div key={l.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {l.title}
                            <span className="ml-2 text-[11px] font-normal text-slate-400">{l.topicTitle}</span>
                          </p>
                          {l.learningObjectives.length > 0 ? (
                            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-slate-600 dark:text-slate-300">
                              {l.learningObjectives.slice(0, 4).map((o, i) => (
                                <li key={i}>{o}</li>
                              ))}
                            </ul>
                          ) : null}
                          {l.revisionNotes.length > 0 ? (
                            <div className="mt-2 space-y-1">
                              {l.revisionNotes.slice(0, 3).map((n, i) => (
                                <p key={i} className="text-xs text-slate-500 dark:text-slate-400">
                                  <RotateCcw className="mr-1 inline h-3 w-3" />
                                  {n}
                                </p>
                              ))}
                            </div>
                          ) : null}
                          <Link href={l.href} className="mt-2 inline-block text-xs font-semibold text-indigo-600 hover:underline">
                            Open lesson
                          </Link>
                        </div>
                      ))}
                      {lessons.length === 0 ? (
                        <p className="text-xs text-slate-400">No lessons for this selection.</p>
                      ) : null}
                    </div>
                    {allRevision.length > 0 ? (
                      <p className="mt-3 text-[11px] text-slate-400">
                        {allRevision.length} revision notes available in the lesson pages.
                      </p>
                    ) : null}
                  </Card>

                  {/* 2 - Formulas */}
                  <Card className="p-4">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                      <Sigma className="h-4 w-4" /> Formulas
                    </h3>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {allFormulas.slice(0, 24).map((f, i) => (
                        <div key={i} className="rounded-xl border border-slate-200 p-2.5 dark:border-slate-800">
                          {f.title ? (
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{f.title}</p>
                          ) : null}
                          {f.latex ? (
                            <div className="mt-1 text-sm">
                              <MixedMathText text={`$$${f.latex}$$`} />
                            </div>
                          ) : null}
                        </div>
                      ))}
                      {allFormulas.length === 0 ? (
                        <p className="text-xs text-slate-400">No formulas recorded for this selection.</p>
                      ) : null}
                    </div>
                  </Card>

                  {/* 3 - Worked examples */}
                  <Card className="p-4">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                      <PenTool className="h-4 w-4" /> Worked examples
                    </h3>
                    <div className="mt-3 space-y-3">
                      {allExamples.slice(0, 12).map((ex, i) => (
                        <div key={i} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                            <MixedMathText text={ex.question} />
                          </p>
                          {ex.steps.length > 0 ? (
                            <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-slate-600 dark:text-slate-300">
                              {ex.steps.slice(0, 5).map((s, si) => (
                                <li key={si}>{s.explanation}</li>
                              ))}
                            </ol>
                          ) : null}
                          {ex.finalAnswer ? (
                            <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              Answer: <MixedMathText text={ex.finalAnswer} />
                            </p>
                          ) : null}
                        </div>
                      ))}
                      {allExamples.length === 0 ? (
                        <p className="text-xs text-slate-400">No worked examples recorded for this selection.</p>
                      ) : null}
                    </div>
                  </Card>

                  {/* 4 - Practice questions */}
                  <Card className="p-4">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                      <ClipboardList className="h-4 w-4" /> Practice questions
                    </h3>
                    <ol className="mt-3 space-y-2">
                      {questions.slice(0, 15).map((q, i) => (
                        <li key={q.id} className="rounded-xl border border-slate-200 p-3 text-sm text-slate-700 dark:border-slate-800 dark:text-slate-200">
                          <MixedMathText text={q.questionText} />
                          {q.latex ? (
                            <div className="mt-1 text-xs text-slate-500">
                              <MixedMathText text={`$$${q.latex}$$`} />
                            </div>
                          ) : null}
                        </li>
                      ))}
                      {questions.length === 0 ? (
                        <li className="text-xs text-slate-400">No questions available for this selection.</li>
                      ) : null}
                    </ol>
                    <Link href="/student/practice" className="mt-3 inline-block text-xs font-semibold text-indigo-600 hover:underline">
                      Practise these in the practice engine
                    </Link>
                  </Card>

                  {/* 7 - Real stored results */}
                  <Card className="p-4">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                      <Trophy className="h-4 w-4" /> Your results for this chapter
                    </h3>
                    <div className="mt-3 space-y-2">
                      {pack.results.map((r) => (
                        <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                          <div>
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{r.quizTitle}</p>
                            <p className="text-[11px] text-slate-400">
                              {r.type} Â· {new Date(r.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={r.resultStatus === 'PASS' ? 'success' : 'danger'} size="sm">
                              {r.resultStatus}
                            </Badge>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                              {r.percentage}%
                            </span>
                          </div>
                        </div>
                      ))}
                      {pack.results.length === 0 ? (
                        <p className="text-xs text-slate-400">
                          No assessments recorded for this chapter yet.
                        </p>
                      ) : null}
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
