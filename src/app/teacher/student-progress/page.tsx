'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ModuleShell, { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/layout/ModuleShell';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Search } from 'lucide-react';
import type { UserRole } from '@/types';

const ROLES: UserRole[] = ['TEACHER', 'SCHOOL_ADMIN', 'PLATFORM_ADMIN'];

interface ProgressRow {
  uid: string;
  displayName: string;
  email: string;
  class: string;
  board: string;
  level: number;
  xp: number;
  questionsSolved: number;
}

interface QuizSummary {
  attempts: number;
  average: number | null;
  passed: number;
}

/**
 * Student progress across the teacher's authorized students: quiz averages and
 * mastery, with a link into the full student profile.
 */
export default function TeacherStudentProgressPage() {
  const [students, setStudents] = useState<ProgressRow[]>([]);
  const [attempts, setAttempts] = useState<Record<string, QuizSummary>>({});
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/users/students', { credentials: 'same-origin' });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load students.');
        if (cancelled) return;
        const rows = (json.students as ProgressRow[]) ?? [];
        setStudents(rows);

        const summary: Record<string, QuizSummary> = {};
        for (const student of rows) {
          const res2 = await fetch(`/api/teacher/students/${student.uid}`, { credentials: 'same-origin' });
          if (!res2.ok) continue;
          const detail = await res2.json();
          const quizzes = (detail.quizzes ?? []) as { percentage: number; resultStatus: string }[];
          summary[student.uid] = {
            attempts: quizzes.length,
            average: quizzes.length
              ? Math.round((quizzes.reduce((sum, quiz) => sum + Number(quiz.percentage ?? 0), 0) / quizzes.length) * 10) / 10
              : null,
            passed: quizzes.filter((quiz) => quiz.resultStatus === 'PASS').length,
          };
        }
        if (!cancelled) setAttempts(summary);
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Failed to load progress.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return students;
    return students.filter(
      (student) =>
        student.displayName.toLowerCase().includes(needle) ||
        student.email.toLowerCase().includes(needle)
    );
  }, [students, search]);

  return (
    <ModuleShell allowedRoles={ROLES} title="Student Progress" subtitle="Quiz performance and mastery for your students">
      {error && <ErrorBlock message={error} />}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search students"
          className="pl-9"
          aria-label="Search students"
        />
      </div>

      {isLoading ? (
        <LoadingBlock label="Loading student progress..." />
      ) : visible.length === 0 ? (
        <EmptyBlock
          title="No students to show"
          description="Progress appears once students are enrolled in your assigned sections."
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <tr>
                <th className="p-3.5">Student</th>
                <th className="p-3.5">Class / Board</th>
                <th className="p-3.5">Level / XP</th>
                <th className="p-3.5">Questions solved</th>
                <th className="p-3.5">Quiz average</th>
                <th className="p-3.5 text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {visible.map((student) => {
                const summary = attempts[student.uid];
                return (
                  <tr key={student.uid} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                    <td className="p-3.5">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{student.displayName}</p>
                      <p className="text-xs text-slate-500">{student.email}</p>
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300">
                      {student.class} · {student.board}
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300">
                      Lvl {student.level} ({student.xp} XP)
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300">{student.questionsSolved}</td>
                    <td className="p-3.5">
                      {summary?.average == null ? (
                        <span className="text-slate-400">No attempts</span>
                      ) : (
                        <>
                          <span className={`font-semibold ${summary.average >= 40 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {summary.average}%
                          </span>
                          <p className="text-xs text-slate-400">
                            {summary.attempts} attempt{summary.attempts === 1 ? '' : 's'} · {summary.passed} passed
                          </p>
                        </>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <Link href={`/teacher/students/${student.uid}`} className="text-xs font-semibold text-indigo-600 hover:underline">
                        View progress
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </ModuleShell>
  );
}