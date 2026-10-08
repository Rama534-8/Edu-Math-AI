'use client';

import React, { useEffect, useState } from 'react';
import ModuleShell, { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/layout/ModuleShell';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { UserRole } from '@/types';

const ROLES: UserRole[] = ['SCHOOL_ADMIN', 'PLATFORM_ADMIN'];

interface AssignmentRow {
  id: string;
  title: string;
  subject: string | null;
  className: string;
  sectionName: string;
  teacherName: string;
  totalMarks: number;
  dueDate: string | null;
  expected: number;
  submitted: number;
  pending: number;
  averageMarks: number | null;
}

export default function SchoolAdminAssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/school-admin/assignments', { credentials: 'same-origin' });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load assignments.');
        if (!cancelled) setAssignments((json.assignments as AssignmentRow[]) ?? []);
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Failed to load assignments.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <ModuleShell allowedRoles={ROLES} title="Assignments" subtitle="Every assignment your teachers have published, with submission progress">
      {error && <ErrorBlock message={error} />}

      {isLoading ? (
        <LoadingBlock label="Loading assignments..." />
      ) : assignments.length === 0 ? (
        <EmptyBlock
          title="No assignments yet"
          description="Teachers create assignments from the Teacher module. Once published they appear here with live submission counts."
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <tr>
                <th className="p-3.5">Assignment</th>
                <th className="p-3.5">Class / Section</th>
                <th className="p-3.5">Teacher</th>
                <th className="p-3.5">Due</th>
                <th className="p-3.5">Submissions</th>
                <th className="p-3.5">Average marks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {assignments.map((assignment) => (
                <tr key={assignment.id} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                  <td className="p-3.5">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{assignment.title}</p>
                    <p className="text-xs text-slate-500">
                      {assignment.subject ?? 'Mathematics'} · {assignment.totalMarks} marks
                    </p>
                  </td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-300">
                    {assignment.className} · {assignment.sectionName}
                  </td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-300">{assignment.teacherName}</td>
                  <td className="p-3.5 whitespace-nowrap text-slate-600 dark:text-slate-300">
                    {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="p-3.5">
                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                      {assignment.submitted}/{assignment.expected}
                    </span>
                    {assignment.pending > 0 ? (
                      <Badge variant="warning" size="sm">{assignment.pending} pending</Badge>
                    ) : null}
                  </td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-300">
                    {assignment.averageMarks == null ? 'Not graded' : assignment.averageMarks}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </ModuleShell>
  );
}