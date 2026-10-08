'use client';

import React, { useEffect, useMemo, useState } from 'react';
import ModuleShell, { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/layout/ModuleShell';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Search } from 'lucide-react';
import type { UserRole } from '@/types';

const ROLES: UserRole[] = ['SCHOOL_ADMIN', 'PLATFORM_ADMIN'];

interface QuizRow {
  id: string;
  title: string;
  subject: string | null;
  className: string;
  sectionName: string;
  teacherName: string;
  questionCount: number;
  attempts: number;
  averageScore: number | null;
}

interface AttemptRow {
  id: string;
  quizTitle: string | null;
  studentName: string;
  percentage: number;
  resultStatus: string;
  correct: number;
  total: number;
  createdAt: string;
}

export default function SchoolAdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/school-admin/quizzes', { credentials: 'same-origin' });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load quizzes.');
        if (cancelled) return;
        setQuizzes((json.quizzes as QuizRow[]) ?? []);
        setAttempts((json.attempts as AttemptRow[]) ?? []);
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Failed to load quizzes.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return quizzes;
    return quizzes.filter((quiz) => quiz.title.toLowerCase().includes(needle));
  }, [quizzes, search]);
return (
    <ModuleShell allowedRoles={ROLES} title="Quizzes" subtitle="Quizzes published by your teachers and how students performed">
      {error && <ErrorBlock message={error} />}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search quizzes by title"
          className="pl-9"
          aria-label="Search quizzes"
        />
      </div>

      {isLoading ? (
        <LoadingBlock label="Loading quizzes..." />
      ) : visible.length === 0 ? (
        <EmptyBlock
          title="No quizzes found"
          description={quizzes.length === 0
            ? 'Teachers create quizzes from the Teacher module. They appear here with live attempt data.'
            : 'No quiz matches your search.'}
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <tr>
                <th className="p-3.5">Quiz</th>
                <th className="p-3.5">Class / Section</th>
                <th className="p-3.5">Teacher</th>
                <th className="p-3.5">Questions</th>
                <th className="p-3.5">Attempts</th>
                <th className="p-3.5">Average</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {visible.map((quiz) => (
                <tr key={quiz.id} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                  <td className="p-3.5">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{quiz.title}</p>
                    <p className="text-xs text-slate-500">{quiz.subject ?? 'Mathematics'}</p>
                  </td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-300">{quiz.className} · {quiz.sectionName}</td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-300">{quiz.teacherName}</td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-300">{quiz.questionCount}</td>
                  <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-100">{quiz.attempts}</td>
                  <td className="p-3.5">
                    {quiz.averageScore == null ? (
                      <span className="text-slate-400">No attempts</span>
                    ) : (
                      <span className="font-semibold text-emerald-600">{quiz.averageScore}%</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {attempts.length > 0 ? (
        <Card className="overflow-x-auto p-0">
          <div className="border-b border-slate-100 p-4 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Recent quiz attempts</h2>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <tr>
                <th className="p-3.5">Student</th>
                <th className="p-3.5">Quiz</th>
                <th className="p-3.5">Score</th>
                <th className="p-3.5">Result</th>
                <th className="p-3.5">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {attempts.map((attempt) => (
                <tr key={attempt.id} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                  <td className="p-3.5 font-semibold text-slate-900 dark:text-slate-100">{attempt.studentName}</td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-300">{attempt.quizTitle ?? '—'}</td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-300">
                    {attempt.percentage}% ({attempt.correct}/{attempt.total})
                  </td>
                  <td className="p-3.5">
                    <Badge variant={attempt.resultStatus === 'PASS' ? 'success' : 'danger'} size="sm">
                      {attempt.resultStatus}
                    </Badge>
                  </td>
                  <td className="p-3.5 whitespace-nowrap text-xs text-slate-500">
                    {new Date(attempt.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : null}
    </ModuleShell>
  );
}