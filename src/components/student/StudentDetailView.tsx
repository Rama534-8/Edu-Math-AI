'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ModuleShell, { ErrorBlock, LoadingBlock, MetricTile } from '@/components/layout/ModuleShell';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { UserRole } from '@/types';

type Row = Record<string, unknown>;

interface DetailPayload {
  student: Row;
  chapters: Row[];
  quizzes: Row[];
  submissions: Row[];
  attendance: Row[];
  attendanceTotals: Row;
  activity: Row[];
  mistakes: Row[];
}

function text(value: unknown, fallback = '—'): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function num(value: unknown): number {
  return typeof value === 'number' ? value : Number(value ?? 0);
}

/**
 * Shared student detail view. Renders the full record returned by
 * /api/teacher/students/[studentId] (chapter progress, quiz history, assignment
 * submissions, attendance, activity and unresolved mistakes).
 */
export default function StudentDetailView({ allowedRoles }: { allowedRoles: UserRole[] }) {
  const params = useParams<{ studentId: string }>();
  const studentId = params?.studentId ?? '';
  const [data, setData] = useState<DetailPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!studentId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/teacher/students/${encodeURIComponent(studentId)}`, {
          credentials: 'same-origin',
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load the student.');
        if (!cancelled) setData(json as DetailPayload);
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Failed to load the student.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [studentId]);

  const attendanceRate = data && num(data.attendanceTotals.total)
    ? Math.round((num(data.attendanceTotals.present) / num(data.attendanceTotals.total)) * 100)
    : null;
return (
    <ModuleShell allowedRoles={allowedRoles} title="Student Profile" subtitle="Progress, assessments, assignments and attendance">
      {error && <ErrorBlock message={error} />}
      {isLoading ? (
        <LoadingBlock label="Loading student..." />
      ) : !data ? (
        <ErrorBlock message="Student data is unavailable." />
      ) : (
        <>
          <Card className="p-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{text(data.student.displayName)}</h2>
            <p className="text-sm text-slate-500">
              {text(data.student.email)} · {text(data.student.studentCode)} · {text(data.student.className)} · {text(data.student.board)}
            </p>
          </Card>

          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <MetricTile label="Level" value={num(data.student.level)} hint={`${num(data.student.xp)} XP`} />
            <MetricTile label="Questions solved" value={num(data.student.questionsSolved)} />
            <MetricTile label="Study minutes" value={num(data.student.totalStudyMinutes)} />
            <MetricTile
              label="Attendance"
              value={attendanceRate == null ? '—' : `${attendanceRate}%`}
              hint={`${num(data.attendanceTotals.total)} records`}
            />
          </section>

          <Section
            title="Chapter progress"
            rows={data.chapters}
            headers={['Chapter', 'Sessions', 'Practice', 'Best quiz']}
            render={(row) => [
              text(row.chapterId),
              num(row.sessionsCompleted),
              `${num(row.practiceCorrect)}/${num(row.practiceAttempted)}`,
              row.bestQuizScore == null ? '—' : `${row.bestQuizScore}%`,
            ]}
          />

          <Section
            title="Quiz history"
            rows={data.quizzes}
            headers={['Quiz', 'Score', 'Result', 'Date']}
            render={(row) => [
              text(row.quizTitle, 'Quiz'),
              `${row.percentage ?? 0}% (${num(row.correct)}/${num(row.total)})`,
              text(row.resultStatus),
              new Date(text(row.createdAt)).toLocaleDateString(),
            ]}
          />

          <Section
            title="Assignment submissions"
            rows={data.submissions}
            headers={['Assignment', 'Status', 'Marks', 'Submitted']}
            render={(row) => [
              text(row.title),
              text(row.status),
              row.marks == null ? 'Not graded' : `${row.marks}/${num(row.totalMarks)}`,
              new Date(text(row.submittedAt)).toLocaleDateString(),
            ]}
          />

          <Section
            title="Attendance"
            rows={data.attendance}
            headers={['Date', 'Class / Section', 'Status', 'Remarks']}
            render={(row) => [
              text(row.attendanceDate),
              `${text(row.className)} · ${text(row.sectionName)}`,
              text(row.status),
              text(row.remarks),
            ]}
          />

          <Section
            title="Unresolved mistakes"
            rows={data.mistakes}
            headers={['Chapter', 'Concept to revise', 'What went wrong']}
            render={(row) => [text(row.chapterId), text(row.conceptToRevise), text(row.whatWentWrong)]}
          />

          <Section
            title="Recent activity"
            rows={data.activity}
            headers={['Activity', 'When']}
            render={(row) => [text(row.activityType), new Date(text(row.createdAt)).toLocaleString()]}
          />
        </>
      )}
    </ModuleShell>
  );
}

function Section({
  title,
  rows,
  headers,
  render,
}: {
  title: string;
  rows: Row[];
  headers: string[];
  render: (row: Row) => (string | number)[];
}) {
  return (
    <Card className="overflow-x-auto p-0">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h2>
        <Badge variant="secondary" size="sm">{rows.length} record{rows.length === 1 ? '' : 's'}</Badge>
      </div>
      {rows.length === 0 ? (
        <p className="p-6 text-center text-sm text-slate-500">Nothing recorded yet.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <tr>{headers.map((header) => <th key={header} className="p-3.5">{header}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((row, index) => (
              <tr key={String(row.id ?? index)} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                {render(row).map((cell, cellIndex) => (
                  <td key={headers[cellIndex]} className="p-3.5 text-slate-700 dark:text-slate-200">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}