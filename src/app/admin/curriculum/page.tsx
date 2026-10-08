'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Chapter, Topic } from '@/types';
import {
  BookOpen,
  Calculator,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  ListChecks,
  Loader2,
  Lightbulb,
  Sigma,
} from 'lucide-react';

// ─── Types (mirror /api/curriculum responses) ─────────────────────────────────

interface BoardSummary {
  board: string;
  chapters: number;
  topics: number;
}

interface TopicSummary {
  id: string;
  title: string;
  titleTelugu?: string;
  order: number;
  lessonCount: number;
  formulaCount: number;
  exampleCount: number;
  questionCount: number;
}

interface ChapterSummary {
  id: string;
  chapterNumber: number;
  title: string;
  titleTelugu?: string;
  description: string;
  board: string;
  grade: number;
  unitLabel?: string;
  estimatedHours: number;
  topicCount: number;
  topics: TopicSummary[];
}

const BOARD_LABELS: Record<string, string> = {
  CBSE: 'CBSE',
  AP_STATE_BOARD: 'AP State Board',
};

const boardLabel = (board: string) => BOARD_LABELS[board] ?? board;

/** Strip HTML for a safe plain-text preview of lesson concept content. */
const stripHtml = (html: string, maxLength = 360): string => {
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
};

function MetricTile({ label, value, hint, icon }: {
  label: string;
  value: number | string;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
        {icon ? <span className="text-slate-300 dark:text-slate-600">{icon}</span> : null}
      </div>
      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlatformAdminCurriculumPage() {
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [chapters, setChapters] = useState<ChapterSummary[]>([]);
  const [board, setBoard] = useState('');
  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(null);
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, Chapter>>({});
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [detailError, setDetailError] = useState('');

  // Overview list: all chapters with per-topic counts.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/curriculum?level=chapters', { credentials: 'same-origin' });
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(json?.error || 'Failed to load curriculum.');
        if (cancelled) return;
        setBoards((json.boards ?? []) as BoardSummary[]);
        setChapters((json.chapters ?? []) as ChapterSummary[]);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load curriculum.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Full chapter detail (learning outcomes, formulas, examples, notes, lessons).
  const loadDetail = async (chapterId: string) => {
    if (details[chapterId] || detailLoadingId) return;
    setDetailLoadingId(chapterId);
    setDetailError('');
    try {
      const res = await fetch(`/api/curriculum?chapterId=${encodeURIComponent(chapterId)}`, { credentials: 'same-origin' });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || 'Failed to load chapter details.');
      setDetails((prev) => ({ ...prev, [chapterId]: json.chapter as Chapter }));
    } catch (loadError) {
      setDetailError(loadError instanceof Error ? loadError.message : 'Failed to load chapter details.');
    } finally {
      setDetailLoadingId(null);
    }
  };

  const toggleChapter = (chapterId: string) => {
    const isOpen = expandedChapterId === chapterId;
    setExpandedChapterId(isOpen ? null : chapterId);
    setExpandedTopicId(null);
    setDetailError('');
    if (!isOpen) void loadDetail(chapterId);
  };

  const visible = useMemo(
    () => (board ? chapters.filter((chapter) => chapter.board === board) : chapters),
    [chapters, board]
  );

  // Board-scoped overview totals (B. Curriculum overview).
  const totals = useMemo(() => {
    let topics = 0;
    let lessons = 0;
    let formulas = 0;
    let examples = 0;
    for (const chapter of visible) {
      topics += chapter.topicCount;
      for (const topic of chapter.topics) {
        lessons += topic.lessonCount;
        formulas += topic.formulaCount;
        examples += topic.exampleCount;
      }
    }
    return { chapters: visible.length, topics, lessons, formulas, examples };
  }, [visible]);

  return (
    <RoleGuard allowedRoles={['PLATFORM_ADMIN']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex-1 flex">
          <Sidebar />
          <main className="flex-1 flex flex-col min-w-0">
            <Header title="Curriculum & Boards" subtitle="Inspect the CBSE and AP State Board syllabus served to students" />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
              {error && (
                <Card className="p-4 text-sm text-rose-700 dark:text-rose-300" role="alert">
                  {error}
                </Card>
              )}

              {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-20 text-slate-500" role="status">
                  <Loader2 className="w-5 h-5 animate-spin" /> Loading curriculum...
                </div>
              ) : (
                <>
                  {/* B. Curriculum overview */}
                  <section className="grid grid-cols-2 gap-4 lg:grid-cols-5" aria-label="Curriculum overview">
                    <MetricTile label="Chapters" value={totals.chapters} hint={board ? boardLabel(board) : 'CBSE + AP State Board'} icon={<BookOpen className="w-4 h-4" />} />
                    <MetricTile label="Topics" value={totals.topics} hint="Across all visible chapters" icon={<ListChecks className="w-4 h-4" />} />
                    <MetricTile label="Lessons" value={totals.lessons} hint="Concept lessons with notes" icon={<FileText className="w-4 h-4" />} />
                    <MetricTile label="Formulas" value={totals.formulas} hint="Topic + lesson formulas" icon={<Sigma className="w-4 h-4" />} />
                    <MetricTile label="Worked examples" value={totals.examples} hint="Step-by-step solutions" icon={<Calculator className="w-4 h-4" />} />
                  </section>

                  {/* A. Board selection */}
                  <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Board selection">
                    <button
                      type="button"
                      onClick={() => setBoard('')}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${board === '' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
                    >
                      All boards
                    </button>
                    {boards.map((item) => (
                      <button
                        key={item.board}
                        type="button"
                        onClick={() => setBoard(item.board)}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${board === item.board ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
                      >
                        {boardLabel(item.board)} · {item.chapters} chapters · {item.topics} topics
                      </button>
                    ))}
                    <span className="ml-auto text-[11px] text-slate-400">
                      Curriculum source: board seed modules (read-only) · Active chapters are published to students
                    </span>
                  </div>

                  {/* C. Chapter management */}
                  {visible.length === 0 ? (
                    <EmptyState
                      icon={<BookOpen className="w-6 h-6" />}
                      title="No chapters found"
                      description="This board has no chapters in the curriculum source."
                    />
                  ) : (
                    <div className="space-y-3">
                      {visible.map((chapter) => {
                        const open = expandedChapterId === chapter.id;
                        const detail = details[chapter.id];
                        const lessonCount = chapter.topics.reduce((sum, topic) => sum + topic.lessonCount, 0);
                        const formulaCount = chapter.topics.reduce((sum, topic) => sum + topic.formulaCount, 0);
                        const exampleCount = chapter.topics.reduce((sum, topic) => sum + topic.exampleCount, 0);
                        const questionCount = chapter.topics.reduce((sum, topic) => sum + topic.questionCount, 0);

                        return (
                          <Card key={chapter.id} className="p-0">
                            <button
                              type="button"
                              onClick={() => toggleChapter(chapter.id)}
                              aria-expanded={open}
                              className="flex w-full items-start justify-between gap-4 p-5 text-left"
                            >
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge variant="info" size="sm">Chapter {chapter.chapterNumber}</Badge>
                                  <Badge variant="secondary" size="sm">{boardLabel(chapter.board)}</Badge>
                                  {chapter.unitLabel ? <Badge variant="secondary" size="sm">{chapter.unitLabel}</Badge> : null}
                                  <Badge variant="success" size="sm">Active</Badge>
                                  <span className="text-xs text-slate-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {chapter.estimatedHours} hrs
                                  </span>
                                </div>
                                <h2 className="mt-2 text-base font-bold text-slate-900 dark:text-slate-100">{chapter.title}</h2>
                                {chapter.titleTelugu ? (
                                  <p className="text-sm text-slate-500 dark:text-slate-400">{chapter.titleTelugu}</p>
                                ) : null}
                                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{chapter.description}</p>
                              </div>
                              <div className="flex flex-col items-end gap-2 shrink-0">
                                <div className="flex flex-wrap justify-end gap-1.5">
                                  <Badge variant="secondary" size="sm">{chapter.topicCount} topics</Badge>
                                  <Badge variant="secondary" size="sm">{lessonCount} lessons</Badge>
                                  <Badge variant="secondary" size="sm">{formulaCount} formulas</Badge>
                                  <Badge variant="secondary" size="sm">{exampleCount} examples</Badge>
                                  <Badge variant="secondary" size="sm">{questionCount} questions</Badge>
                                </div>
                                <span className="text-xs font-semibold text-indigo-600 flex items-center gap-1">
                                  {open ? 'Hide details' : 'View details'}
                                  <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                                </span>
                              </div>
                            </button>

                            {open && (
                              <div className="border-t border-slate-100 p-5 dark:border-slate-800">
                                {detailError && (
                                  <p className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700" role="alert">
                                    {detailError}
                                  </p>
                                )}
                                {!detail ? (
                                  <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500" role="status">
                                    <Loader2 className="w-4 h-4 animate-spin" /> Loading chapter details...
                                  </div>
                                ) : (
                                  <ChapterDetail chapter={detail} expandedTopicId={expandedTopicId} onToggleTopic={setExpandedTopicId} />
                                )}
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}

// ─── D. Chapter details panel ─────────────────────────────────────────────────

function ChapterDetail({ chapter, expandedTopicId, onToggleTopic }: {
  chapter: Chapter;
  expandedTopicId: string | null;
  onToggleTopic: (topicId: string | null) => void;
}) {
  const outcomes = chapter.learningOutcomes ?? [];
  const outcomesTelugu = chapter.learningOutcomesTelugu ?? [];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            <ListChecks className="w-4 h-4 text-indigo-500" /> Learning objectives
          </h3>
          {outcomes.length === 0 ? (
            <p className="mt-2 text-xs text-slate-400">No published learning outcomes for this chapter.</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {outcomes.map((outcome, index) => (
                <li key={index} className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <ChevronRight className="w-3.5 h-3.5 mt-0.5 shrink-0 text-indigo-400" />
                  {outcome}
                </li>
              ))}
            </ul>
          )}
          {outcomesTelugu.length > 0 && (
            <>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">తెలుగు లక్ష్యాలు</p>
              <ul className="mt-1 space-y-1.5">
                {outcomesTelugu.map((outcome, index) => (
                  <li key={index} className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <ChevronRight className="w-3.5 h-3.5 mt-0.5 shrink-0 text-indigo-300" />
                    {outcome}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            <BookOpen className="w-4 h-4 text-emerald-500" /> Chapter structure
          </h3>
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div>
              <dt className="text-slate-400">Curriculum source</dt>
              <dd className="text-slate-700 dark:text-slate-300">{chapter.curriculumSource ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Unit / semester</dt>
              <dd className="text-slate-700 dark:text-slate-300">{chapter.unitLabel ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Grade</dt>
              <dd className="text-slate-700 dark:text-slate-300">{chapter.grade}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Estimated hours</dt>
              <dd className="text-slate-700 dark:text-slate-300">{chapter.estimatedHours}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Topics</dt>
              <dd className="text-slate-700 dark:text-slate-300">{chapter.topics.length}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Board</dt>
              <dd className="text-slate-700 dark:text-slate-300">{boardLabel(chapter.board)}</dd>
            </div>
          </dl>
          {chapter.descriptionTelugu ? (
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{chapter.descriptionTelugu}</p>
          ) : null}
        </section>
      </div>

      {/* E. Topic list */}
      <section>
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
          <Lightbulb className="w-4 h-4 text-amber-500" /> Topics ({chapter.topics.length})
        </h3>
        <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {chapter.topics.map((topic) => {
            const open = expandedTopicId === topic.id;
            return (
              <li key={topic.id}>
                <button
                  type="button"
                  onClick={() => onToggleTopic(open ? null : topic.id)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between gap-3 p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {topic.order}. {topic.title}
                    </p>
                    {topic.titleTelugu ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400">{topic.titleTelugu}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant="secondary" size="sm">{topic.lessons.length} lessons</Badge>
                    <Badge variant="secondary" size="sm">{topic.formulas?.length ?? 0} formulas</Badge>
                    <Badge variant="secondary" size="sm">{topic.examples?.length ?? 0} examples</Badge>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                {open && <TopicDetail topic={topic} />}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

// ─── E. Topic details panel ───────────────────────────────────────────────────

function TopicDetail({ topic }: { topic: Topic }) {
  const formulas = topic.formulas ?? [];
  const examples = topic.examples ?? [];
  const concepts = topic.concepts ?? [];
  const conceptsTelugu = topic.conceptsTelugu ?? [];
  const objectives = topic.learningObjectives ?? [];
  const objectivesTelugu = topic.learningObjectivesTelugu ?? [];

  return (
    <div className="space-y-4 border-t border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/40">
      <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">{topic.description}</p>
      {topic.descriptionTelugu ? (
        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{topic.descriptionTelugu}</p>
      ) : null}

      {concepts.length > 0 && (
        <section>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Concepts</h4>
          <ul className="mt-1.5 space-y-1">
            {concepts.map((concept, index) => (
              <li key={index} className="flex items-start gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                <Lightbulb className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-400" />
                {concept}
              </li>
            ))}
          </ul>
          {conceptsTelugu.length > 0 && (
            <ul className="mt-1.5 space-y-1">
              {conceptsTelugu.map((concept, index) => (
                <li key={index} className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Lightbulb className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-300" />
                  {concept}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {objectives.length > 0 && (
        <section>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Learning objectives</h4>
          <ul className="mt-1.5 space-y-1">
            {objectives.map((objective, index) => (
              <li key={index} className="flex items-start gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                <ChevronRight className="w-3.5 h-3.5 mt-0.5 shrink-0 text-indigo-400" />
                {objective}
              </li>
            ))}
          </ul>
          {objectivesTelugu.length > 0 && (
            <ul className="mt-1.5 space-y-1">
              {objectivesTelugu.map((objective, index) => (
                <li key={index} className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <ChevronRight className="w-3.5 h-3.5 mt-0.5 shrink-0 text-indigo-300" />
                  {objective}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {formulas.length > 0 && (
        <section>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Formulas</h4>
          <ul className="mt-1.5 space-y-2">
            {formulas.map((formula) => (
              <li key={formula.id} className="rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{formula.title}</p>
                  <code className="rounded bg-indigo-50 px-1.5 py-0.5 text-[11px] text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                    {formula.latex}
                  </code>
                </div>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{formula.description}</p>
                {formula.titleTelugu ? (
                  <p className="mt-0.5 text-[11px] text-slate-400">{formula.titleTelugu}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      )}

      {examples.length > 0 && (
        <section>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Worked examples</h4>
          <ul className="mt-1.5 space-y-2">
            {examples.map((example) => (
              <li key={example.id} className="rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{example.question}</p>
                <ol className="mt-1.5 space-y-1">
                  {example.steps.map((step) => (
                    <li key={step.stepNumber} className="text-[11px] text-slate-600 dark:text-slate-400">
                      <span className="font-semibold text-indigo-500">Step {step.stepNumber}:</span> {step.explanation}
                      {step.latex ? <code className="ml-1 rounded bg-slate-100 px-1 text-[10px] dark:bg-slate-800">{step.latex}</code> : null}
                    </li>
                  ))}
                </ol>
                <p className="mt-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Answer: {example.finalAnswer}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {topic.lessons.length > 0 && (
        <section>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Lessons ({topic.lessons.length})
          </h4>
          <ul className="mt-1.5 space-y-2">
            {topic.lessons.map((lesson) => (
              <li key={lesson.id} className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{lesson.title}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary" size="sm">{lesson.formulas.length} formulas</Badge>
                    <Badge variant="secondary" size="sm">{lesson.examples.length} examples</Badge>
                    <Badge variant="secondary" size="sm">{lesson.revisionNotes.length} revision notes</Badge>
                  </div>
                </div>
                {lesson.titleTelugu ? (
                  <p className="mt-0.5 text-[11px] text-slate-400">{lesson.titleTelugu}</p>
                ) : null}

                {lesson.learningObjectives.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {lesson.learningObjectives.map((objective, index) => (
                      <li key={index} className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                        <ChevronRight className="w-3 h-3 mt-0.5 shrink-0 text-indigo-400" />
                        {objective}
                      </li>
                    ))}
                  </ul>
                )}

                <p className="mt-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  {stripHtml(lesson.conceptHtml)}
                </p>

                {lesson.revisionNotes.length > 0 && (
                  <div className="mt-2 rounded-lg bg-indigo-50/70 p-2 dark:bg-indigo-950/40">
                    <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-500">
                      <FileText className="w-3 h-3" /> Revision notes
                    </p>
                    <ul className="mt-1 space-y-0.5">
                      {lesson.revisionNotes.map((note, index) => (
                        <li key={index} className="text-[11px] text-indigo-900 dark:text-indigo-200">
                          · {note}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}





