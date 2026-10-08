'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MathRenderer } from '@/components/ui/MathRenderer';
import { SAMPLE_QUESTIONS_BANK } from '@/lib/curriculum-data';
import { Sparkles } from 'lucide-react';

export default function TeacherQuestionsPage() {
  return (
    <RoleGuard allowedRoles={['TEACHER', 'PLATFORM_ADMIN']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />

        <div className="flex-1 flex">
          <Sidebar />

          <main className="flex-1 flex flex-col min-w-0">
            <Header
              title="Class 9 Question Bank Repository"
              subtitle="Manage question banks, edit test items, and review draft questions"
            />

            <div className="p-6 max-w-6xl w-full mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Approved Questions ({SAMPLE_QUESTIONS_BANK.length} Items)
                </span>
                <Link href="/teacher/ai-assistant">
                  <Button size="sm" leftIcon={<Sparkles className="w-3.5 h-3.5" />}>
                    Generate with AI Assistant
                  </Button>
                </Link>
              </div>

              <div className="space-y-4">
                {SAMPLE_QUESTIONS_BANK.map((q) => (
                  <Card key={q.id} className="p-5 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Badge variant="primary" size="sm">
                          {q.type}
                        </Badge>
                        <Badge
                          variant={
                            q.difficulty === 'EASY'
                              ? 'success'
                              : q.difficulty === 'MEDIUM'
                              ? 'warning'
                              : 'danger'
                          }
                          size="sm"
                        >
                          {q.difficulty}
                        </Badge>
                        <span className="text-xs text-slate-400 font-mono">{q.id}</span>
                      </div>
                      <Badge variant="success" size="sm">
                        {q.status || 'APPROVED'}
                      </Badge>
                    </div>

                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {q.questionText}
                    </p>

                    {q.latex && (
                      <div className="p-2.5 rounded-lg bg-slate-950 text-white text-center text-xs font-mono">
                        <MathRenderer math={q.latex} inline={false} />
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <strong>Correct Answer:</strong> {q.correctAnswer}
                      </div>
                      <div>
                        <strong>Explanation:</strong> {q.correctAnswerExplanation}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
