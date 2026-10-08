'use client';

import React, { useEffect, useState } from 'react';
import ModuleShell, { ErrorBlock, LoadingBlock, MetricTile } from '@/components/layout/ModuleShell';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { UserRole } from '@/types';

const ROLES: UserRole[] = ['SCHOOL_ADMIN', 'PLATFORM_ADMIN', 'TEACHER'];

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
  unitLabel?: string;
  estimatedHours: number;
  topicCount: number;
  topics: TopicSummary[];
}

export default function SchoolAdminCurriculumPage() {
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [chapters, setChapters] = useState<ChapterSummary[]>([]);
  const [board, setBoard] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/curriculum?level=chapters', { credentials: 'same-origin' });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load curriculum.');
        if (cancelled) return;
        setBoards((json.boards as BoardSummary[]) ?? []);
        setChapters((json.chapters as ChapterSummary[]) ?? []);
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Failed to load curriculum.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const visible = board ? chapters.filter((chapter) => chapter.board === board) : chapters;
return (
    <ModuleShell
      allowedRoles={ROLES}
      title="Curriculum"
      subtitle="The exact CBSE and AP State Board syllabus, topics and resources your students are learning"
    >
      {error && <ErrorBlock message={error} />}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {boards.map((item) => (
          <MetricTile
            key={item.board}
            label={item.board === 'CBSE' ? 'CBSE Class 9' : 'AP State Board Class 9'}
            value={`${item.chapters} chapters`}
            hint={`${item.topics} topics`}
          />
        ))}
        <MetricTile
          label="Total curriculum"
          value={`${boards.reduce((sum, item) => sum + item.chapters, 0)} chapters`}
          hint={`${boards.reduce((sum, item) => sum + item.topics, 0)} topics`}
        />
      </section>

      <div className="flex flex-wrap items-center gap-2">
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
            {item.board === 'CBSE' ? 'CBSE' : 'AP State Board'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingBlock label="Loading curriculum..." />
      ) : (
        <div className="space-y-3">
          {visible.map((chapter) => {
            const open = expanded === chapter.id;
            return (
              <Card key={chapter.id} className="p-0">
                <button
                  type="button"
                  onClick={() => setExpanded(open ? null : chapter.id)}
                  aria-expanded={open}
                  className="flex w-full items-start justify-between gap-4 p-5 text-left"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="info" size="sm">Chapter {chapter.chapterNumber}</Badge>
                      <Badge variant="secondary" size="sm">
                        {chapter.board === 'CBSE' ? 'CBSE' : 'AP State Board'}
                      </Badge>
                      {chapter.unitLabel ? <Badge variant="secondary" size="sm">{chapter.unitLabel}</Badge> : null}
                      <span className="text-xs text-slate-400">{chapter.estimatedHours} hrs</span>
                    </div>
                    <h2 className="mt-2 text-base font-bold text-slate-900 dark:text-slate-100">{chapter.title}</h2>
                    {chapter.titleTelugu ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400">{chapter.titleTelugu}</p>
                    ) : null}
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{chapter.description}</p>
                  </div>
                  <span className="whitespace-nowrap text-xs font-semibold text-indigo-600">
                    {chapter.topicCount} topics
                  </span>
                </button>

                {open ? (
                  <div className="border-t border-slate-100 p-5 dark:border-slate-800">
                    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                      {chapter.topics.map((topic) => (
                        <li key={topic.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                              {topic.order}. {topic.title}
                            </p>
                            {topic.titleTelugu ? (
                              <p className="text-xs text-slate-500 dark:text-slate-400">{topic.titleTelugu}</p>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-500">
                            <Badge variant="secondary" size="sm">{topic.lessonCount} lessons</Badge>
                            <Badge variant="secondary" size="sm">{topic.formulaCount} formulas</Badge>
                            <Badge variant="secondary" size="sm">{topic.exampleCount} examples</Badge>
                            <Badge variant="secondary" size="sm">{topic.questionCount} questions</Badge>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </ModuleShell>
  );
}