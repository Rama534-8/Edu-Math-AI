'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';

import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { RoleGuard } from '@/components/layout/RoleGuard';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

import { CLASS_9_CHAPTERS } from '@/lib/curriculum-data';
import type { BoardType } from '@/types';

import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Search,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export default function StudentLearnPage() {
  const [selectedBoard, setSelectedBoard] =
    useState<BoardType>('AP_STATE_BOARD');

  const [searchQuery, setSearchQuery] =
    useState('');

  const boardChapters = useMemo(() => {
    return CLASS_9_CHAPTERS.filter(
      (chapter) => chapter.board === selectedBoard
    );
  }, [selectedBoard]);

  const filteredChapters = useMemo(() => {
    const query =
      searchQuery.trim().toLowerCase();

    if (!query) {
      return boardChapters;
    }

    return boardChapters.filter((chapter) => {
      const title =
        String(chapter.title || '').toLowerCase();

      const description =
        String(
          chapter.description || ''
        ).toLowerCase();

      const chapterNumber =
        String(chapter.chapterNumber || '');

      return (
        title.includes(query) ||
        description.includes(query) ||
        chapterNumber.includes(query)
      );
    });
  }, [boardChapters, searchQuery]);

  return (
    <RoleGuard allowedRoles={['STUDENT']}>
      <div className="min-h-screen bg-background">

        <Navbar />

        <div className="flex">

          <Sidebar />

          <main className="flex-1">

            <Header
              title="Learn Mathematics"
              subtitle={`Class 9 Mathematics • ${selectedBoard}`}
            />

            <div className="mx-auto max-w-7xl space-y-6 p-6">

              {/* Header */}

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
                            {selectedBoard}
                          </Badge>

                          <Badge variant="secondary">
                            Mathematics
                          </Badge>

                        </div>

                        <h1 className="text-3xl font-bold">
                          Learn Mathematics
                        </h1>

                        <p className="mt-2 max-w-2xl text-muted-foreground">
                          Select a chapter to start learning,
                          practice concepts, and improve your
                          mathematics skills.
                        </p>

                      </div>

                    </div>

                  </div>

                </div>
              </Card>

              {/* Board selector */}

              <Card className="p-5">

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                  <div>
                    <h2 className="font-bold">
                      Select Curriculum
                    </h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Choose your Class 9 Mathematics board.
                    </p>
                  </div>

                  <div className="flex gap-2">

                    <Button
                      variant={
                        selectedBoard === 'AP_STATE_BOARD'
                          ? 'primary'
                          : 'secondary'
                      }
                      onClick={() =>
                        setSelectedBoard('AP_STATE_BOARD')
                      }
                    >
                      AP State Board
                    </Button>

                    <Button
                      variant={
                        selectedBoard === 'CBSE'
                          ? 'primary'
                          : 'secondary'
                      }
                      onClick={() =>
                        setSelectedBoard('CBSE')
                      }
                    >
                      CBSE
                    </Button>

                  </div>

                </div>

              </Card>

              {/* Search */}

              <Card className="p-4">

                <div className="relative">

                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />

                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) =>
                      setSearchQuery(
                        event.target.value
                      )
                    }
                    placeholder="Search chapters..."
                    className="w-full rounded-xl border bg-background py-3 pl-10 pr-4 text-sm outline-none transition focus:ring-2 focus:ring-primary"
                  />

                </div>

              </Card>

              {/* Curriculum information */}

              <Card className="border-dashed p-4">

                <div className="flex items-start gap-3">

                  <Sparkles className="mt-0.5 h-5 w-5 shrink-0" />

                  <div>

                    <p className="font-semibold">
                      {selectedBoard} Class 9 Mathematics
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Select a chapter below to open its
                      learning page.
                    </p>

                  </div>

                </div>

              </Card>

              {/* Chapters heading */}

              <div className="flex items-center justify-between">

                <div>

                  <h2 className="text-2xl font-bold">
                    Chapters
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    {filteredChapters.length}{' '}
                    chapter
                    {filteredChapters.length === 1
                      ? ''
                      : 's'} available
                  </p>

                </div>

                <Badge variant="secondary">
                  {selectedBoard}
                </Badge>

              </div>

              {/* Chapters */}

              {filteredChapters.length > 0 ? (

                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

                  {filteredChapters.map((chapter) => {

                    const boardPath =
                      chapter.board === 'CBSE'
                        ? 'cbse'
                        : 'ap';

                    return (
                      <Link
                        key={chapter.id}
                        href={`/student/learn/${boardPath}-ch${chapter.chapterNumber}-l1`}
                        className="block h-full"
                      >

                        <Card className="group h-full cursor-pointer p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">

                          <div className="flex items-start justify-between gap-4">

                            <div className="flex items-start gap-3">

                              <div className="rounded-xl bg-primary/10 p-3 transition group-hover:bg-primary/20">
                                <BookOpen className="h-5 w-5" />
                              </div>

                              <div>

                                <div className="mb-2 flex flex-wrap gap-2">

                                  <Badge>
                                    Chapter{' '}
                                    {chapter.chapterNumber}
                                  </Badge>

                                  <Badge variant="secondary">
                                    {chapter.board}
                                  </Badge>

                                </div>

                                <h3 className="text-lg font-bold leading-tight">
                                  {chapter.title}
                                </h3>

                              </div>

                            </div>

                            <ArrowRight className="mt-1 h-5 w-5 shrink-0 opacity-50 transition group-hover:translate-x-1 group-hover:opacity-100" />

                          </div>

                          {chapter.description && (
                            <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">
                              {chapter.description}
                            </p>
                          )}

                          {chapter.topics &&
                            chapter.topics.length > 0 && (

                              <div className="mt-5 border-t pt-4">

                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  Topics
                                </p>

                                <div className="space-y-2">

                                  {chapter.topics
                                    .slice(0, 3)
                                    .map(
                                      (
                                        topic: any,
                                        index: number
                                      ) => (
                                        <div
                                          key={
                                            topic.id ||
                                            index
                                          }
                                          className="flex items-center gap-2 text-sm"
                                        >

                                          <CheckCircle2 className="h-4 w-4 shrink-0 opacity-60" />

                                          <span className="truncate">
                                            {topic.title}
                                          </span>

                                        </div>
                                      )
                                    )}

                                </div>

                                {chapter.topics.length > 3 && (
                                  <p className="mt-2 text-xs text-muted-foreground">
                                    +
                                    {chapter.topics.length - 3}{' '}
                                    more topics
                                  </p>
                                )}

                              </div>
                            )}

                          <div className="mt-5 flex items-center justify-between border-t pt-4">

                            <span className="text-sm font-semibold">
                              Start Learning
                            </span>

                            <span className="flex items-center text-sm text-muted-foreground">
                              Lesson 1
                              <ArrowRight className="ml-1 h-4 w-4" />
                            </span>

                          </div>

                        </Card>

                      </Link>
                    );
                  })}

                </div>

              ) : (

                <Card className="p-10 text-center">

                  <Search className="mx-auto mb-4 h-10 w-10 opacity-40" />

                  <h3 className="text-lg font-bold">
                    No chapters found
                  </h3>

                  <p className="mt-2 text-sm text-muted-foreground">
                    Try a different chapter name or
                    clear the search.
                  </p>

                  <Button
                    className="mt-5"
                    variant="outline"
                    onClick={() =>
                      setSearchQuery('')
                    }
                  >
                    Clear Search
                  </Button>

                </Card>

              )}

              {/* Bottom */}

              <Card className="p-5">

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                  <div className="flex items-center gap-3">

                    <div className="rounded-xl bg-primary/10 p-2">
                      <BookOpen className="h-5 w-5" />
                    </div>

                    <div>

                      <p className="font-semibold">
                        Ready to learn?
                      </p>

                      <p className="text-sm text-muted-foreground">
                        Choose any chapter above to begin.
                      </p>

                    </div>

                  </div>

                  <Link href="/student/dashboard">

                    <Button variant="outline">

                      <ArrowLeft className="mr-2 h-4 w-4" />

                      Dashboard

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
