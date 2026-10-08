'use client';

import React, { useCallback, useEffect, useState } from 'react';
import ModuleShell, { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/layout/ModuleShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { UserRole } from '@/types';

const ROLES: UserRole[] = ['TEACHER', 'SCHOOL_ADMIN', 'PLATFORM_ADMIN'];

type Status = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
const STATUSES: Status[] = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];

const STATUS_STYLES: Record<Status, string> = {
  PRESENT: 'bg-emerald-600 text-white',
  ABSENT: 'bg-rose-600 text-white',
  LATE: 'bg-amber-500 text-white',
  EXCUSED: 'bg-sky-600 text-white',
};

interface SectionOption { sectionId: string; sectionName: string; className: string }
interface RosterRow {
  studentId: string;
  studentName: string;
  studentCode: string | null;
  status: Status | null;
  remarks: string | null;
}

export default function TeacherAttendancePage() {
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [sectionId, setSectionId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [marks, setMarks] = useState<Record<string, Status>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async (nextSectionId: string, nextDate: string) => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams();
      if (nextSectionId) query.set('sectionId', nextSectionId);
      if (nextDate) query.set('date', nextDate);
      const res = await fetch(`/api/teacher/attendance?${query.toString()}`, { credentials: 'same-origin' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load the attendance register.');
      setSections((json.sections as SectionOption[]) ?? []);
      setSectionId((json.sectionId as string) ?? '');
      setDate((json.date as string) ?? nextDate);
      setRoster((json.roster as RosterRow[]) ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load the attendance register.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void load('', date); }, [load, date]);

  async function save() {
    const records = Object.entries(marks).map(([studentId, status]) => ({ studentId, status }));
    if (records.length === 0) {
      setError('Mark at least one student before saving.');
      return;
    }
    setIsSaving(true);
    setError('');
    setNotice('');
    try {
      const res = await fetch('/api/teacher/attendance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionId, date, records }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save attendance.');
      setNotice(`Attendance saved for ${json.saved} student${json.saved === 1 ? '' : 's'}.`);
      setMarks({});
      await load(sectionId, date);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save attendance.');
    } finally {
      setIsSaving(false);
    }
  }
return (
    <ModuleShell allowedRoles={ROLES} title="Attendance" subtitle="Mark and review daily attendance for your sections">
      {error && <ErrorBlock message={error} />}
      {notice && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300" role="status">
          {notice}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div>
          <label htmlFor="attendance-section" className="mb-1.5 block text-xs font-semibold text-slate-500">Section</label>
          <select
            id="attendance-section"
            value={sectionId}
            onChange={(event) => { setMarks({}); void load(event.target.value, date); }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            {sections.length === 0 ? <option value="">No sections assigned</option> : null}
            {sections.map((section) => (
              <option key={section.sectionId} value={section.sectionId}>
                {section.className} · {section.sectionName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="attendance-date" className="mb-1.5 block text-xs font-semibold text-slate-500">Date</label>
          <input
            id="attendance-date"
            type="date"
            value={date}
            onChange={(event) => { setMarks({}); setDate(event.target.value); }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          />
        </div>
        <Button onClick={save} disabled={isSaving || roster.length === 0} size="sm">
          {isSaving ? 'Saving...' : 'Save attendance'}
        </Button>
      </div>

      {isLoading ? (
        <LoadingBlock label="Loading register..." />
      ) : sections.length === 0 ? (
        <EmptyBlock
          title="No sections assigned"
          description="A school administrator assigns teachers to sections from the Teacher Assignments page before attendance can be marked."
        />
      ) : roster.length === 0 ? (
        <EmptyBlock title="No students enrolled" description="This section has no enrolled students yet." />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <tr>
                <th className="p-3.5">Student</th>
                <th className="p-3.5">Code</th>
                <th className="p-3.5">Saved status</th>
                <th className="p-3.5">Mark for {date}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {roster.map((student) => (
                <tr key={student.studentId} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                  <td className="p-3.5 font-semibold text-slate-900 dark:text-slate-100">{student.studentName}</td>
                  <td className="p-3.5 text-xs text-slate-500">{student.studentCode ?? '—'}</td>
                  <td className="p-3.5">
                    {student.status ? (
                      <Badge variant="secondary" size="sm">{student.status}</Badge>
                    ) : (
                      <span className="text-xs text-slate-400">Not marked</span>
                    )}
                  </td>
                  <td className="p-3.5">
                    <div className="flex flex-wrap gap-1.5">
                      {STATUSES.map((status) => {
                        const active = marks[student.studentId] === status;
                        return (
                          <button
                            key={status}
                            type="button"
                            onClick={() => setMarks((prev) => {
                              const next = { ...prev };
                              if (next[student.studentId] === status) delete next[student.studentId];
                              else next[student.studentId] = status;
                              return next;
                            })}
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors ${active ? STATUS_STYLES[status] : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}
                          >
                            {status}
                          </button>
                        );
                      })}
                    </div>
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