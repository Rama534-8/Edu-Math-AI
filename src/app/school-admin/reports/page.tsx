'use client';

import React, { useEffect, useState } from 'react';
import ModuleShell, { EmptyBlock, ErrorBlock, LoadingBlock, MetricTile } from '@/components/layout/ModuleShell';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { UserRole } from '@/types';

const ROLES: UserRole[] = ['SCHOOL_ADMIN', 'PLATFORM_ADMIN'];

type Row = Record<string, unknown>;

interface ReportPayload {
  headline: {
    students: number; teachers: number; parents: number;
    classes: number; sections: number; assignments: number;
    quizzes: number; averageScore: number | null; attempts: number;
  };
  studentPerformance: Row[];
  classPerformance: Row[];
  teacherActivity: Row[];
  quizPerformance: Row[];
  assignmentPerformance: Row[];
  attendanceSummary: Row;
}

function num(value: unknown): number {
  return typeof value === 'number' ? value : Number(value ?? 0);
}

function text(value: unknown, fallback = '—'): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

export default function SchoolAdminReportsPage() {
  const [data, setData] = useState<ReportPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/school-admin/reports?limit=10', { credentials: 'same-origin' });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to build reports.');
        if (!cancelled) setData(json as ReportPayload);
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Failed to build reports.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const attendance = data?.attendanceSummary;
  const attendanceTotal = num(attendance?.total);
  const attendanceRate = attendanceTotal
    ? Math.round((num(attendance?.present) / attendanceTotal) * 100)
    : null;
return (
    <ModuleShell allowedRoles={ROLES} title="Reports" subtitle="Student, class, teacher, quiz, assignment and attendance reporting">
      {error && <ErrorBlock message={error} />}
      {isLoading ? (
        <LoadingBlock label="Building reports..." />
      ) : !data ? (
        <EmptyBlock title="No report data" description="Reports appear once your school has students, quizzes and assignments." />
      ) : (
        <>
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <MetricTile label="Students" value={num(data.headline.students)} hint={`${num(data.headline.classes)} classes`} />
            <MetricTile label="Teachers" value={num(data.headline.teachers)} hint={`${num(data.headline.sections)} sections`} />
            <MetricTile label="Average score" value={data.headline.averageScore == null ? '—' : `${data.headline.averageScore}%`} hint={`${num(data.headline.attempts)} attempts`} />
            <MetricTile label="Attendance" value={attendanceRate == null ? '—' : `${attendanceRate}%`} hint={`${attendanceTotal} records`} />
          </section>

          <ReportTable
            title="Student performance"
            headers={['Student', 'Class', 'Attempts', 'Average', 'Best', 'Passed']}
            rows={data.studentPerformance}
            render={(row) => [
              text(row.studentName),
              text(row.className),
              num(row.attempts),
              row.averageScore == null ? '—' : `${row.averageScore}%`,
              row.bestScore == null ? '—' : `${row.bestScore}%`,
              num(row.passed),
            ]}
          />

          <ReportTable
            title="Class performance"
            headers={['Class', 'Students', 'Sections', 'Active', 'Average score']}
            rows={data.classPerformance}
            render={(row) => [
              text(row.className),
              num(row.studentCount),
              num(row.sectionCount),
              num(row.activeStudents),
              row.averageScore == null ? '—' : `${row.averageScore}%`,
            ]}
          />

          <ReportTable
            title="Teacher activity"
            headers={['Teacher', 'Sections', 'Assignments', 'Quizzes', 'Submissions']}
            rows={data.teacherActivity}
            render={(row) => [
              text(row.teacherName),
              num(row.sections),
              num(row.assignments),
              num(row.quizzes),
              num(row.gradedSubmissions),
            ]}
          />

          <ReportTable
            title="Quiz performance"
            headers={['Quiz', 'Type', 'Attempts', 'Participants', 'Average', 'Passed / Failed']}
            rows={data.quizPerformance}
            render={(row) => [
              text(row.quizTitle),
              text(row.type),
              num(row.attempts),
              num(row.participants),
              row.averageScore == null ? '—' : `${row.averageScore}%`,
              `${num(row.passed)} / ${num(row.failed)}`,
            ]}
          />

          <ReportTable
            title="Assignment performance"
            headers={['Assignment', 'Class', 'Expected', 'Submitted', 'Pending', 'Average marks']}
            rows={data.assignmentPerformance}
            render={(row) => [
              text(row.title),
              text(row.className),
              num(row.expected),
              num(row.submitted),
              num(row.pending),
              row.averageMarks == null ? '—' : String(row.averageMarks),
            ]}
          />
        </>
      )}
    </ModuleShell>
  );
}

function ReportTable({
  title,
  headers,
  rows,
  render,
}: {
  title: string;
  headers: string[];
  rows: Row[];
  render: (row: Row) => (string | number)[];
}) {
  return (
    <Card className="p-0 overflow-x-auto">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h2>
        <Badge variant="secondary" size="sm">{rows.length} row{rows.length === 1 ? '' : 's'}</Badge>
      </div>
      {rows.length === 0 ? (
        <p className="p-6 text-center text-sm text-slate-500">No data recorded yet.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              {headers.map((header) => <th key={header} className="p-3.5">{header}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((row, index) => (
              <tr key={String(row.id ?? index)} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                {render(row).map((cell, cellIndex) => (
                  <td key={headers[cellIndex]} className="p-3.5 text-slate-700 dark:text-slate-200">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}