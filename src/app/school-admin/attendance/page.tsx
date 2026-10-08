'use client';

import React, { useEffect, useMemo, useState } from 'react';
import ModuleShell, { EmptyBlock, ErrorBlock, LoadingBlock, MetricTile } from '@/components/layout/ModuleShell';
import { Card } from '@/components/ui/Card';
import type { UserRole } from '@/types';

const ROLES: UserRole[] = ['SCHOOL_ADMIN', 'PLATFORM_ADMIN'];

interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  sectionName: string;
  className: string;
  attendanceDate: string;
  status: string;
  remarks: string | null;
}

interface SectionOption {
  sectionId: string;
  sectionName: string;
  className: string;
}

const STATUS_STYLES: Record<string, string> = {
  PRESENT: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  ABSENT: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  LATE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  EXCUSED: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
};

export default function SchoolAdminAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [totals, setTotals] = useState<Record<string, number | null>>({});
  const [sectionId, setSectionId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = sectionId ? `/api/school-admin/attendance?sectionId=${encodeURIComponent(sectionId)}` : '/api/school-admin/attendance';
        const res = await fetch(url, { credentials: 'same-origin' });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load attendance.');
        if (cancelled) return;
        setRecords((json.records as AttendanceRecord[]) ?? []);
        setSections((json.sections as SectionOption[]) ?? []);
        setTotals(json.totals ?? {});
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Failed to load attendance.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [sectionId]);

  const rate = useMemo(() => {
    const total = totals.total ?? 0;
    if (!total) return null;
    return Math.round(((totals.present ?? 0) / total) * 100);
  }, [totals]);

  return (
    <ModuleShell allowedRoles={ROLES} title="Attendance" subtitle="Daily attendance recorded by your teachers">
      {error && <ErrorBlock message={error} />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          value={sectionId}
          onChange={(event) => setSectionId(event.target.value)}
          aria-label="Filter by section"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
        >
          <option value="">All sections</option>
          {sections.map((section) => (
            <option key={section.sectionId} value={section.sectionId}>
              {section.className} · {section.sectionName}
            </option>
          ))}
        </select>
      </div>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <MetricTile label="Present" value={totals.present ?? 0} />
        <MetricTile label="Absent" value={totals.absent ?? 0} />
        <MetricTile label="Late" value={totals.late ?? 0} />
        <MetricTile label="Excused" value={totals.excused ?? 0} />
        <MetricTile label="Attendance rate" value={rate == null ? '—' : `${rate}%`} hint={`${totals.total ?? 0} records`} />
      </section>

      {isLoading ? (
        <LoadingBlock label="Loading attendance..." />
      ) : records.length === 0 ? (
        <EmptyBlock
          title="No attendance recorded"
          description="Teachers mark attendance from the Teacher module. Once a register is saved it appears here."
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <tr>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Student</th>
                <th className="p-3.5">Class / Section</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {records.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                  <td className="p-3.5 whitespace-nowrap text-slate-600 dark:text-slate-300">{record.attendanceDate}</td>
                  <td className="p-3.5 font-semibold text-slate-900 dark:text-slate-100">{record.studentName}</td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-300">
                    {record.className} · {record.sectionName}
                  </td>
                  <td className="p-3.5">
                    <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${STATUS_STYLES[record.status] ?? 'bg-slate-100 text-slate-700'}`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-500">{record.remarks ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </ModuleShell>
  );
}