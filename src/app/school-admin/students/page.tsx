'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ModuleShell, { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/layout/ModuleShell';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import type { UserRole } from '@/types';
import { Search } from 'lucide-react';

const ROLES: UserRole[] = ['SCHOOL_ADMIN', 'PLATFORM_ADMIN'];

interface StudentRow {
  id: string;
  displayName: string;
  email: string;
  className: string | null;
  board: string | null;
  studentCode: string | null;
  sectionName: string | null;
  averageScore: number | null;
  quizAttempts: number;
  attendancePresent: number;
  attendanceTotal: number;
}

interface ClassOption {
  classId: string;
  className: string;
}

export default function SchoolAdminStudentsPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [search, setSearch] = useState('');
  const [className, setClassName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/school-admin/students', { credentials: 'same-origin' });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load students.');
        if (cancelled) return;
        setStudents((json.students as StudentRow[]) ?? []);
        const seen = new Set<string>();
        setClasses(
          (json.classes as (ClassOption & { sectionId: string | null })[])
            .filter((row) => {
              if (!row.sectionId || seen.has(row.classId)) return false;
              seen.add(row.classId);
              return true;
            })
            .map(({ classId, className: name }) => ({ classId, className: name }))
        );
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Failed to load students.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return students.filter((student) => {
      if (className && student.className !== className) return false;
      if (!needle) return true;
      return (
        student.displayName.toLowerCase().includes(needle) ||
        student.email.toLowerCase().includes(needle) ||
        (student.studentCode ?? '').toLowerCase().includes(needle)
      );
    });
  }, [students, search, className]);
return (
    <ModuleShell allowedRoles={ROLES} title="Students" subtitle="Every student account in your school, with progress and attendance">
      {error && <ErrorBlock message={error} />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email or student code"
            className="pl-9"
            aria-label="Search students"
          />
        </div>
        <select
          value={className}
          onChange={(event) => setClassName(event.target.value)}
          aria-label="Filter by class"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
        >
          <option value="">All classes</option>
          {classes.map((option) => (
            <option key={option.classId} value={option.className}>{option.className}</option>
          ))}
        </select>
        <Badge variant="info" size="sm">{visible.length} shown</Badge>
      </div>

      {isLoading ? (
        <LoadingBlock label="Loading students..." />
      ) : visible.length === 0 ? (
        <EmptyBlock
          title="No students found"
          description={students.length === 0
            ? 'No student accounts are registered with your school yet.'
            : 'No student matches the current search or class filter.'}
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <tr>
                <th className="p-3.5">Student</th>
                <th className="p-3.5">Class / Section</th>
                <th className="p-3.5">Board</th>
                <th className="p-3.5">Average score</th>
                <th className="p-3.5">Attendance</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {visible.map((student) => {
                const rate = student.attendanceTotal
                  ? Math.round((student.attendancePresent / student.attendanceTotal) * 100)
                  : null;
                return (
                  <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                    <td className="p-3.5">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{student.displayName}</p>
                      <p className="text-xs text-slate-500">{student.email}</p>
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300">
                      {student.className ?? '—'}
                      {student.sectionName ? ` · ${student.sectionName}` : ''}
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300">{student.board ?? '—'}</td>
                    <td className="p-3.5">
                      {student.averageScore == null ? (
                        <span className="text-slate-400">No attempts</span>
                      ) : (
                        <span className={`font-semibold ${student.averageScore >= 40 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {student.averageScore}%
                        </span>
                      )}
                      <p className="text-xs text-slate-400">
                        {student.quizAttempts} attempt{student.quizAttempts === 1 ? '' : 's'}
                      </p>
                    </td>
                    <td className="p-3.5">
                      {rate == null ? (
                        <span className="text-slate-400">Not marked</span>
                      ) : (
                        <span className={`font-semibold ${rate >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>{rate}%</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <Link href={`/school-admin/students/${student.id}`} className="text-xs font-semibold text-indigo-600 hover:underline">
                        View profile
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