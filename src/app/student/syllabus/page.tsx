'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CLASS_9_CHAPTERS } from '@/lib/curriculum-data';
import { buildLessonHref } from '@/lib/lesson-href';
import {
  BookOpen,
  PenTool,
} from 'lucide-react';

export default function SyllabusPage() {
  const [selectedBoard, setSelectedBoard] = useState<'CBSE' | 'AP_STATE_BOARD'>('CBSE');
  const boardChapters = CLASS_9_CHAPTERS.filter(c => c.board === selectedBoard);
  const [selectedChapterId, setSelectedChapterId] = useState<string>(boardChapters[0]?.id || CLASS_9_CHAPTERS[0].id);
  const selectedChapter = boardChapters.find((c) => c.id === selectedChapterId) || boardChapters[0];

  

  return (
    <RoleGuard allowedRoles={['STUDENT', 'TEACHER']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />

        <div className="flex-1 flex">
          <Sidebar />

          <main className="flex-1 flex flex-col min-w-0">
            <Header
              title="Class 9 Mathematics Syllabus & Hierarchy"
              subtitle="Board → Class 9 → Subject → Chapter → Topic → Lesson Structure (CBSE & AP State Board)"
            />

            <div className="p-6 max-w-7xl w-full mx-auto space-y-6">
              {/* Hierarchy Visualizer */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="flex gap-4 mb-4">
                  <Button variant={selectedBoard === 'CBSE' ? 'primary' : 'outline'} onClick={() => { setSelectedBoard('CBSE'); setSelectedChapterId(CLASS_9_CHAPTERS.filter(c => c.board === 'CBSE')[0]?.id); }}>CBSE</Button>
                  <Button variant={selectedBoard === 'AP_STATE_BOARD' ? 'primary' : 'outline'} onClick={() => { setSelectedBoard('AP_STATE_BOARD'); setSelectedChapterId(CLASS_9_CHAPTERS.filter(c => c.board === 'AP_STATE_BOARD')[0]?.id); }}>AP State Board</Button>
                </div>
                {/* Chapters List */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Chapters (12 Core Units)
                  </h3>
                  <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                    {boardChapters.map((ch) => {
                      const isSelected = ch.id === selectedChapterId;
                      return (
                        <button
                          key={ch.id}
                          onClick={() => setSelectedChapterId(ch.id)}
                          className={`w-full p-4 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 ring-2 ring-indigo-500/20'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant={isSelected ? 'primary' : 'secondary'} size="sm">
                              Chapter {ch.chapterNumber}
                            </Badge>
                            <span className="text-[11px] text-slate-400">{ch.estimatedHours}h</span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {ch.title}
                          </h4>
                          {ch.titleTelugu && (
                            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">
                              {ch.titleTelugu}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Chapter Details & Topic Breakdown */}
                <div className="lg:col-span-2 space-y-6">
                  <Card className="p-6">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="primary" size="md">
                            Unit {selectedChapter.chapterNumber}
                          </Badge>
                          <span className="text-xs text-slate-500 font-semibold">
                            Grade 9 • {selectedChapter.board}
                          </span>
                        </div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
                          {selectedChapter.title}
                        </h2>
                        {selectedChapter.titleTelugu && (
                          <p className="text-sm text-indigo-600 font-medium">
                            {selectedChapter.titleTelugu}
                          </p>
                        )}
                      </div>

                      <Link href="/student/practice">
                        <Button size="sm" leftIcon={<PenTool className="w-3.5 h-3.5" />}>
                          Practice Chapter
                        </Button>
                      </Link>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                      {selectedChapter.description}
                    </p>

                    {/* Topics List */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Topic Hierarchy & Interactive Lessons
                      </h4>

                      {selectedChapter.topics.map((topic, tIdx) => (
                        <div
                          key={topic.id}
                          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">
                                {tIdx + 1}
                              </span>
                              <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                {topic.title}
                              </h5>
                            </div>
                            <span className="text-xs text-slate-400">
                              {topic.formulas?.length || 0} Formulas
                            </span>
                          </div>

                          {topic.titleTelugu && (
                            <p className="text-xs text-indigo-600 pl-8">
                              {topic.titleTelugu}
                            </p>
                          )}

                          <div className="pl-8 flex flex-wrap gap-2 pt-1">
                            <Link href={buildLessonHref(selectedChapter, tIdx + 1)}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs"
                                leftIcon={<BookOpen className="w-3.5 h-3.5" />}
                              >
                                View Interactive Lesson
                              </Button>
                            </Link>
                            <Link href="/student/practice">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-xs"
                                leftIcon={<PenTool className="w-3.5 h-3.5" />}
                              >
                                Solve Questions
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
