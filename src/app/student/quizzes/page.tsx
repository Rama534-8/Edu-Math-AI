'use client';

import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { BASELINE_QUIZ_METADATA, SAMPLE_QUESTIONS_BANK } from '@/lib/curriculum-data';
import {
  Clock,
  ArrowRight,
} from 'lucide-react';

export default function QuizzesIndexPage() {
  const questionCount = SAMPLE_QUESTIONS_BANK.length;
  const totalMarks = SAMPLE_QUESTIONS_BANK.reduce((total, question) => total + question.marks, 0);

  return (
    <RoleGuard allowedRoles={['STUDENT']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />

        <div className="flex-1 flex">
          <Sidebar />

          <main className="flex-1 flex flex-col min-w-0">
            <Header
              title="Class 9 Mathematics Quizzes & Assessments"
              subtitle="Timed assessment from the currently available Class 9 question bank"
            />

            <div className="p-6 max-w-6xl w-full mx-auto space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <Card hoverEffect className="flex flex-col justify-between p-6">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="primary" size="sm">Class 9 combined assessment</Badge>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {BASELINE_QUIZ_METADATA.durationMinutes} Mins
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Class 9 Mathematics Assessment</h3>
                      <p className="mt-1 text-xs text-indigo-600 dark:text-indigo-400">{BASELINE_QUIZ_METADATA.titleTelugu}</p>

                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-3">
                        <span>{questionCount} Questions</span>
                        <span>•</span>
                        <span>{totalMarks} Marks Total</span>
                        <span>•</span>
                        <span>XP from saved result</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <Link href="/student/quizzes/class9-assessment">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                        >
                          Start Assessment
                        </Button>
                      </Link>
                    </div>
                  </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
