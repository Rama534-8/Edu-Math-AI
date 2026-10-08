'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { RoleGuard } from '@/components/layout/RoleGuard';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  MathRenderer,
  MixedMathText,
} from '@/components/ui/MathRenderer';

import { CLASS_9_CHAPTERS } from '@/lib/curriculum-data';
import type { WorkedExample } from '@/types';

import {
  GraduationCap,
  BookOpen,
  Sparkles,
  Bot,
  PenTool,
  CheckCircle2,
  Lightbulb,
  ArrowRight,
  ArrowLeft,
  Languages,
  BookmarkCheck,
  ChevronRight,
} from 'lucide-react';

type BoardType = 'AP_STATE_BOARD' | 'CBSE';

type ResolvedLesson = {
  id: string;
  title: string;
  learningObjectives?: string[];
  conceptHtml?: string;
  conceptTeluguHtml?: string;
  /**
   * Real curriculum shape (see `WorkedExample` / curriculum/builders.ts):
   * each step is an object `{ stepNumber, explanation, latex?, subHint? }`
   * and the result is `finalAnswer`. This type previously declared
   * `steps?: string[]` / `answer?: string`, which hid the mismatch from
   * TypeScript and made the page pass whole step objects into text renderers.
   */
  examples?: WorkedExample[];
  revisionNotes?: string[];
};

type ResolvedResult = {
  chapter: any;
  topic: any;
  lesson: ResolvedLesson | null;
  board: BoardType | null;
};

function resolveLesson(
  lessonId: string
): ResolvedResult {

  const match = lessonId?.match(
    /^(ap|cbse)-ch(\d+)(?:-l(\d+))?$/
  );

  if (!match) {
    return {
      chapter: null,
      topic: null,
      lesson: null,
      board: null,
    };
  }

  const boardParam = match[1];

  const chapterNumber = parseInt(
    match[2],
    10
  );

  const lessonNumber = match[3]
    ? parseInt(match[3], 10)
    : 1;

  const board: BoardType =
    boardParam === 'cbse'
      ? 'CBSE'
      : 'AP_STATE_BOARD';

  const boardChapters =
    CLASS_9_CHAPTERS.filter(
      (chapter) => chapter.board === board
    );

  const chapter =
    boardChapters.find(
      (item) =>
        Number(item.chapterNumber) ===
        chapterNumber
    );

  if (!chapter) {
    return {
      chapter: null,
      topic: null,
      lesson: null,
      board,
    };
  }

  const lessonsWithTopics =
    chapter.topics.flatMap((topic) =>
      (topic.lessons ?? []).map((lesson) => ({
        topic,
        lesson,
      }))
    );

  const resolved =
    lessonsWithTopics[
      lessonNumber - 1
    ];

  if (resolved) {
    return {
      chapter,
      topic: resolved.topic,
      lesson: resolved.lesson,
      board,
    };
  }

  const firstTopic =
    chapter.topics?.[0];

  if (!firstTopic) {
    return {
      chapter,
      topic: null,
      lesson: null,
      board,
    };
  }

  const fallbackLesson:
    ResolvedLesson = {

    id: `${chapter.id}-overview`,

    title: firstTopic.title,

    learningObjectives: [
      `Understand the basic concepts of ${firstTopic.title}.`,
      `Study the topics included in ${chapter.title}.`,
      `Build a strong foundation in ${chapter.title}.`,
    ],

    conceptHtml: `
      <h4>${firstTopic.title}</h4>

      <p>
        ${firstTopic.description || ''}
      </p>

      <p>
        This lesson is linked to the official
        ${board} Class 9 Mathematics curriculum.
      </p>

      <p>
        Detailed textbook-based lesson content will be
        added from the official ${board} textbook.
      </p>
    `,

    conceptTeluguHtml: `
      <h4>${firstTopic.title}</h4>

      <p>
        ${firstTopic.description || ''}
      </p>

      <p>
        ఈ పాఠం అధికారిక ${board}
        Class 9 Mathematics curriculum కు
        అనుసంధానించబడింది.
      </p>

      <p>
        అధికారిక ${board} పాఠ్యపుస్తకం ఆధారంగా
        పూర్తి lesson content తరువాత జోడించబడుతుంది.
      </p>
    `,

    examples: [],

    revisionNotes: [
      firstTopic.description ||
        `Study the main concepts of ${firstTopic.title}.`,
      `Refer to the official ${board} textbook for complete content.`,
    ],
  };

  return {
    chapter,
    topic: firstTopic,
    lesson: fallbackLesson,
    board,
  };
}

export default function LessonPage() {

  const params = useParams();

  const lessonId =
    (params?.lessonId as string) ||
    'ap-ch1-l1';

  const [language, setLanguage] =
    useState<'EN' | 'TE'>('EN');

  const [completedSteps, setCompletedSteps] =
    useState<number[]>([]);

  const [isBookmarked, setIsBookmarked] =
    useState<boolean>(false);

  const {
    chapter,
    topic,
    lesson,
    board,
  } = useMemo(
    () => resolveLesson(lessonId),
    [lessonId]
  );

  const boardChapters =
    CLASS_9_CHAPTERS.filter(
      (item) =>
        String(item.board).toUpperCase() ===
        board
    );

  const chapterIdx =
    boardChapters.findIndex(
      (item) =>
        item.id === chapter.id
    );

  const prevChapter =
    chapterIdx > 0
      ? boardChapters[
          chapterIdx - 1
        ]
      : null;

  const nextChapter =
    chapterIdx >= 0 &&
    chapterIdx <
      boardChapters.length - 1
      ? boardChapters[
          chapterIdx + 1
        ]
      : null;

  const boardPath =
    board === 'CBSE'
      ? 'cbse'
      : 'ap';

  const examples: WorkedExample[] =
    lesson?.examples ?? [];

  const totalSteps =
    examples.reduce(
      (
        total: number,
        example: WorkedExample
      ) =>
        total +
        (example.steps?.length || 0),
      0
    );

  const progress =
    totalSteps > 0
      ? Math.round(
          (completedSteps.length /
            totalSteps) *
            100
        )
      : 0;

  const toggleStep = (
    stepIndex: number
  ) => {

    setCompletedSteps(
      (current) => {

        if (
          current.includes(
            stepIndex
          )
        ) {
          return current.filter(
            (item) =>
              item !== stepIndex
          );
        }

        return [
          ...current,
          stepIndex,
        ];
      }
    );
  };

  // Phase 6 - record genuine lesson activity. Opening the lesson marks it in
  // progress; finishing every worked-example step marks it complete. This is
  // what feeds "Continue Learning" and the lesson achievements.
  // NOTE: hooks must run on every render, so this effect guards internally
  // and runs before the "lesson not found" early return below.
  const lessonIdForProgress = lesson?.id ?? null;
  const chapterIdForProgress = chapter?.id ?? null;
  const chapterBoardForProgress = chapter?.board ?? null;
  const topicIdForProgress = topic?.id ?? null;
  useEffect(() => {
    if (!lessonIdForProgress || !chapterIdForProgress || !chapterBoardForProgress) return;
    let cancelled = false;

    const post = (completed: boolean) => {
      void fetch('/api/student/lesson-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: lessonIdForProgress,
          board: chapterBoardForProgress,
          chapterId: chapterIdForProgress,
          topicId: topicIdForProgress,
          completed,
        }),
      }).catch(() => {
        /* progress recording must never block the lesson */
      });
    };

    // Mark as started on open.
    post(false);

    // Mark complete once every step is done.
    if (
      totalSteps > 0 &&
      completedSteps.length >= totalSteps
    ) {
      post(true);
    }

    return () => {
      cancelled = true;
      void cancelled;
    };
  }, [
    lessonIdForProgress,
    chapterIdForProgress,
    chapterBoardForProgress,
    topicIdForProgress,
    totalSteps,
    completedSteps.length,
  ]);

  // Phase 7 - bookmark toggle for this lesson.
  useEffect(() => {
    if (!lessonIdForProgress) {
      setIsBookmarked(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/student/bookmarks', {
          credentials: 'same-origin',
        });
        const json = await res.json();
        if (!res.ok || cancelled) return;
        const list = (json.bookmarks ?? []) as {
          itemType: string;
          itemId: string;
        }[];
        setIsBookmarked(
          list.some(
            (b) =>
              b.itemType ===
                'LESSON' &&
              b.itemId === lessonIdForProgress
          )
        );
      } catch {
        /* bookmark state is non-critical */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lessonIdForProgress]);

  if (
    !chapter ||
    !lesson ||
    !board
  ) {
    return (
      <RoleGuard allowedRoles={['STUDENT']}>

        <div className="min-h-screen bg-background">

          <Navbar />

          <div className="flex">

            <Sidebar />

            <main className="flex-1 p-6">

              <div className="mx-auto max-w-3xl">

                <Card className="p-8 text-center">

                  <BookOpen className="mx-auto mb-4 h-12 w-12 opacity-50" />

                  <h1 className="text-2xl font-bold">
                    Lesson not found
                  </h1>

                  <p className="mt-2 text-muted-foreground">
                    The requested lesson could not be loaded.
                  </p>

                  <div className="mt-6">

                    <Link href="/student/learn">

                      <Button>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Chapters
                      </Button>

                    </Link>

                  </div>

                </Card>

              </div>

            </main>

          </div>

        </div>

      </RoleGuard>
    );
  }

  const toggleBookmark = async () => {
    const next = !isBookmarked;
    setIsBookmarked(next);
    try {
      const res = await fetch('/api/student/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType: 'LESSON',
          itemId: lesson.id,
          title: lesson.title,
          board: chapter.board,
          chapterId: chapter.id,
          topicId: topic?.id ?? null,
          save: next,
        }),
      });
      if (!res.ok) {
        setIsBookmarked(!next);
      }
    } catch {
      setIsBookmarked(!next);
    }
  };

  return (
    <RoleGuard allowedRoles={['STUDENT']}>

      <div className="min-h-screen bg-background">

        <Navbar />

        <div className="flex">

          <Sidebar />

          <main className="flex-1">

            <Header
              title={lesson.title}
              subtitle={`${board} • ${chapter.title} • Class 9 Mathematics`}
            />

            <div className="mx-auto max-w-7xl space-y-6 p-6">

              {/* Navigation */}

              <div className="flex flex-wrap items-center justify-between gap-3">

                <Link href="/student/learn">

                  <Button
                    variant="outline"
                    size="sm"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    All Chapters
                  </Button>

                </Link>

                <div className="flex items-center gap-2">

                  <Button
                    variant={isBookmarked ? 'primary' : 'outline'}
                    size="sm"
                    onClick={toggleBookmark}
                    title={
                      isBookmarked
                        ? 'Remove from bookmarks'
                        : 'Save this lesson'
                    }
                  >
                    <BookmarkCheck className="mr-2 h-4 w-4" />
                    {isBookmarked
                      ? 'Saved'
                      : 'Save'}
                  </Button>

                  <Badge variant="secondary">
                    {board}
                  </Badge>

                  <Badge variant="secondary">
                    Chapter {chapter.chapterNumber}
                  </Badge>

                  {topic && (
                    <Badge variant="secondary">
                      {topic.title}
                    </Badge>
                  )}

                </div>

              </div>

              {/* Status */}

              <Card className="border-dashed p-4">

                <div className="flex items-start gap-3">

                  <Sparkles className="mt-0.5 h-5 w-5 shrink-0" />

                  <div>

                    <p className="font-semibold">
                      Curriculum-linked lesson
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      This page uses the selected {board}
                      Class 9 Mathematics chapter.
                    </p>

                  </div>

                </div>

              </Card>

              {/* Hero */}

              <Card className="overflow-hidden">

                <div className="bg-gradient-to-r from-primary/10 via-background to-primary/5 p-6">

                  <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

                    <div className="flex items-start gap-4">

                      <div className="rounded-2xl bg-primary/10 p-4">

                        <GraduationCap className="h-8 w-8" />

                      </div>

                      <div>

                        <div className="mb-2 flex flex-wrap gap-2">

                          <Badge>
                            Class 9
                          </Badge>

                          <Badge variant="secondary">
                            {board}
                          </Badge>

                          <Badge variant="secondary">
                            Chapter {chapter.chapterNumber}
                          </Badge>

                        </div>

                        <h1 className="text-3xl font-bold">
                          {lesson.title}
                        </h1>

                        <p className="mt-2 text-muted-foreground">
                          {chapter.title}
                        </p>

                      </div>

                    </div>

                    <div className="flex items-center gap-2 rounded-xl border p-1">

                      <Button
                        size="sm"
                        variant={
                          language === 'EN'
                            ? 'primary'
                            : 'ghost'
                        }
                        onClick={() =>
                          setLanguage('EN')
                        }
                      >
                        English
                      </Button>

                      <Button
                        size="sm"
                        variant={
                          language === 'TE'
                            ? 'primary'
                            : 'ghost'
                        }
                        onClick={() =>
                          setLanguage('TE')
                        }
                      >
                        తెలుగు
                      </Button>

                    </div>

                  </div>

                </div>

              </Card>

              {/* Objectives */}

              {lesson.learningObjectives &&
                lesson.learningObjectives.length >
                  0 && (

                  <Card className="p-6">

                    <div className="mb-5 flex items-center gap-3">

                      <div className="rounded-xl bg-primary/10 p-2">

                        <CheckCircle2 className="h-5 w-5" />

                      </div>

                      <div>

                        <h2 className="text-xl font-bold">
                          Learning Objectives
                        </h2>

                        <p className="text-sm text-muted-foreground">
                          What you should understand after
                          completing this lesson
                        </p>

                      </div>

                    </div>

                    <div className="space-y-3">

                      {lesson.learningObjectives.map(
                        (
                          objective,
                          index
                        ) => (

                          <div
                            key={index}
                            className="flex items-start gap-3"
                          >

                            <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold">
                              {index + 1}
                            </div>

                            <p className="text-sm leading-6">
                              {objective}
                            </p>

                          </div>

                        )
                      )}

                    </div>

                  </Card>
                )}

              {/* Concept */}

              <Card className="p-6">

                <div className="mb-5 flex items-center gap-3">

                  <div className="rounded-xl bg-primary/10 p-2">

                    <BookOpen className="h-5 w-5" />

                  </div>

                  <div>

                    <h2 className="text-xl font-bold">
                      Core Mathematical Concept
                    </h2>

                    <p className="text-sm text-muted-foreground">
                      Main concept explanation
                    </p>

                  </div>

                </div>

                {language === 'TE' ? (

                  <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{
                      __html:
                        lesson.conceptTeluguHtml ||
                        lesson.conceptHtml ||
                        '',
                    }}
                  />

                ) : (

                  <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{
                      __html:
                        lesson.conceptHtml ||
                        '',
                    }}
                  />

                )}

              </Card>

              {/* Worked examples */}

              {examples.length > 0 && (

                <Card className="p-6">

                  <div className="mb-6 flex items-center gap-3">

                    <div className="rounded-xl bg-primary/10 p-2">

                      <PenTool className="h-5 w-5" />

                    </div>

                    <div>

                      <h2 className="text-xl font-bold">
                        Worked Examples
                      </h2>

                      <p className="text-sm text-muted-foreground">
                        Follow each solution step by step
                      </p>

                    </div>

                  </div>

                  <div className="mb-6">

                    <div className="mb-2 flex items-center justify-between text-sm">

                      <span>
                        Lesson progress
                      </span>

                      <span className="font-semibold">
                        {progress}%
                      </span>

                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-muted">

                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{
                          width: `${progress}%`,
                        }}
                      />

                    </div>

                  </div>

                  <div className="space-y-8">

                    {examples.map(
                      (
                        example: WorkedExample,
                        exampleIndex: number
                      ) => (

                        <div
                          key={exampleIndex}
                          className="rounded-2xl border p-5"
                        >

                          <div className="mb-4 flex items-center gap-2">

                            <Badge>
                              Example {exampleIndex + 1}
                            </Badge>

                          </div>

                          <div className="mb-5 rounded-xl bg-muted/50 p-4">

                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Question
                            </p>

                            <MixedMathText text={example.question} />

                          </div>

                          {example.steps &&
                            example.steps.length >
                              0 && (

                              <div className="space-y-3">

                                <p className="text-sm font-semibold">
                                  Solution
                                </p>

                                {example.steps.map(
                                  (
                                    step: WorkedExample['steps'][number],
                                    stepIndex: number
                                  ) => {

                                    const globalStepIndex =
                                      examples
                                        .slice(
                                          0,
                                          exampleIndex
                                        )
                                        .reduce(
                                          (
                                            total: number,
                                            item: WorkedExample
                                          ) =>
                                            total +
                                            (item.steps?.length ||
                                              0),
                                          0
                                        ) +
                                      stepIndex;

                                    const completed =
                                      completedSteps.includes(
                                        globalStepIndex
                                      );

                                    return (
                                      <button
                                        type="button"
                                        key={stepIndex}
                                        onClick={() =>
                                          toggleStep(
                                            globalStepIndex
                                          )
                                        }
                                        className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${
                                          completed
                                            ? 'border-primary/40 bg-primary/5'
                                            : 'hover:bg-muted/50'
                                        }`}
                                      >

                                        <div
                                          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                                            completed
                                              ? 'bg-primary text-primary-foreground'
                                              : ''
                                          }`}
                                        >

                                          {completed ? (
                                            <CheckCircle2 className="h-4 w-4" />
                                          ) : (
                                            stepIndex + 1
                                          )}

                                        </div>

                                        <div className="flex-1">

                                          <MixedMathText text={step.explanation} />

                                        </div>

                                      </button>
                                    );
                                  }
                                )}

                              </div>
                            )}

                          {example.finalAnswer && (

                            <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4">

                              <p className="mb-2 text-xs font-semibold uppercase tracking-wide">
                                Final Answer
                              </p>

                              <MixedMathText text={example.finalAnswer} />

                            </div>

                          )}

                        </div>

                      )
                    )}

                  </div>

                </Card>
              )}

              {/* Revision */}

              {lesson.revisionNotes &&
                lesson.revisionNotes.length >
                  0 && (

                  <Card className="p-6">

                    <div className="mb-5 flex items-center gap-3">

                      <div className="rounded-xl bg-primary/10 p-2">

                        <BookmarkCheck className="h-5 w-5" />

                      </div>

                      <div>

                        <h2 className="text-xl font-bold">
                          Revision Key Notes
                        </h2>

                        <p className="text-sm text-muted-foreground">
                          Quick points for revision
                        </p>

                      </div>

                    </div>

                    <div className="grid gap-3">

                      {lesson.revisionNotes.map(
                        (
                          note,
                          index
                        ) => (

                          <div
                            key={index}
                            className="flex items-start gap-3 rounded-xl border p-4"
                          >

                            <Lightbulb className="mt-0.5 h-5 w-5 shrink-0" />

                            <p className="text-sm leading-6">
                              {note}
                            </p>

                          </div>

                        )
                      )}

                    </div>

                  </Card>
                )}

              {/* AI Tools */}

              <div className="grid gap-4 md:grid-cols-3">

                <Link href="/student/ai-tutor">

                  <Card className="h-full p-5 transition hover:-translate-y-1 hover:shadow-md">

                    <Bot className="mb-4 h-7 w-7" />

                    <h3 className="font-bold">
                      AI Tutor
                    </h3>

                    <p className="mt-2 text-sm text-muted-foreground">
                      Ask questions and get step-by-step
                      mathematical explanations.
                    </p>

                    <div className="mt-4 flex items-center text-sm font-semibold">
                      Open AI Tutor
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </div>

                  </Card>

                </Link>

                <Link href="/student/practice">

                  <Card className="h-full p-5 transition hover:-translate-y-1 hover:shadow-md">

                    <Sparkles className="mb-4 h-7 w-7" />

                    <h3 className="font-bold">
                      Practice
                    </h3>

                    <p className="mt-2 text-sm text-muted-foreground">
                      Practice mathematics questions from
                      your learning curriculum.
                    </p>

                    <div className="mt-4 flex items-center text-sm font-semibold">
                      Start Practice
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </div>

                  </Card>

                </Link>

                <Link href="/student/solver">

                  <Card className="h-full p-5 transition hover:-translate-y-1 hover:shadow-md">

                    <Languages className="mb-4 h-7 w-7" />

                    <h3 className="font-bold">
                      AI Question Solver
                    </h3>

                    <p className="mt-2 text-sm text-muted-foreground">
                      Get help solving mathematics questions
                      with AI.
                    </p>

                    <div className="mt-4 flex items-center text-sm font-semibold">
                      Open Solver
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </div>

                  </Card>

                </Link>

              </div>

              {/* Chapter navigation */}

              <Card className="p-5">

                <div className="mb-4 flex items-center justify-between">

                  <div>

                    <h2 className="font-bold">
                      Chapter Navigation
                    </h2>

                    <p className="text-sm text-muted-foreground">
                      Continue learning within the {board} curriculum
                    </p>

                  </div>

                  <ChevronRight className="h-5 w-5 opacity-50" />

                </div>

                <div className="grid gap-3 md:grid-cols-2">

                  {prevChapter ? (

                    <Link
                      href={`/student/learn/${boardPath}-ch${prevChapter.chapterNumber}-l1`}
                    >

                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >

                        <ArrowLeft className="mr-2 h-4 w-4" />

                        <span className="truncate">
                          Previous:{' '}
                          {prevChapter.title}
                        </span>

                      </Button>

                    </Link>

                  ) : (

                    <Button
                      variant="outline"
                      disabled
                      className="w-full justify-start"
                    >

                      <ArrowLeft className="mr-2 h-4 w-4" />

                      First Chapter

                    </Button>

                  )}

                  {nextChapter ? (

                    <Link
                      href={`/student/learn/${boardPath}-ch${nextChapter.chapterNumber}-l1`}
                    >

                      <Button
                        className="w-full justify-between"
                      >

                        <span className="truncate">
                          Next:{' '}
                          {nextChapter.title}
                        </span>

                        <ArrowRight className="ml-2 h-4 w-4" />

                      </Button>

                    </Link>

                  ) : (

                    <Button
                      disabled
                      className="w-full justify-between"
                    >

                      Last Chapter

                      <ArrowRight className="ml-2 h-4 w-4" />

                    </Button>

                  )}

                </div>

              </Card>

            </div>

          </main>

        </div>

      </div>

    </RoleGuard>
  );
}