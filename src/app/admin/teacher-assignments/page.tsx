'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader2, Plus, Trash2, UserCog, CheckCircle2, AlertCircle, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Teacher { id: string; email: string; displayName: string | null; }
interface School { id: string; name: string; }
interface ClassRow { id: string; schoolId: string; name: string; }
interface SectionRow { id: string; classId: string; name: string; }
interface Assignment {
  id: string; subject: string | null; created_at: string;
  teacherId: string; teacherEmail: string; teacherName: string | null;
  schoolId: string; schoolName: string;
  classId: string; className: string;
  sectionId: string; sectionName: string;
}

const SUBJECTS = ['Mathematics', 'Science', 'English', 'Social Science', 'Hindi', 'Telugu'];

const sel =
  'w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 ' +
  'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 ' +
  'px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed';

// ─── Component ─────────────────────────────────────────────────────────────────

export default function AdminTeacherAssignmentsPage() {
  const [data, setData] = useState<{
    assignments: Assignment[];
    teachers: Teacher[];
    schools: School[];
    classes: ClassRow[];
    sections: SectionRow[];
  } | null>(null);

  const [loadError, setLoadError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [fTeacher, setFTeacher] = useState('');
  const [fSchool, setFSchool] = useState('');
  const [fClass, setFClass] = useState('');
  const [fSection, setFSection] = useState('');
  const [fSubject, setFSubject] = useState('Mathematics');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setIsLoading(true);
    setLoadError('');
    fetch('/api/admin/teacher-assignments')
      .then(async r => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Failed to load data.');
        setData(d);
      })
      .catch(e => setLoadError(e instanceof Error ? e.message : 'Failed to load.'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Cascading filter helpers (derived from data)
  const availableClasses = data?.classes.filter(c => c.schoolId === fSchool) ?? [];
  const availableSections = data?.sections.filter(s => s.classId === fClass) ?? [];

  function resetForm() {
    setFTeacher(''); setFSchool(''); setFClass('');
    setFSection(''); setFSubject('Mathematics');
    setFormError(''); setFormSuccess('');
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(''); setFormSuccess('');
    if (!fTeacher) return setFormError('Select a teacher.');
    if (!fSection) return setFormError('Select a school → class → section.');

    setSaving(true);
    try {
      const res = await fetch('/api/admin/teacher-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId: fTeacher, sectionId: fSection, subject: fSubject }),
      });
      const d = await res.json();
      if (!res.ok) {
        setFormError(d.error || 'Failed to create assignment.');
      } else {
        setFormSuccess('Mapping created successfully.');
        resetForm();
        setShowForm(false);
        fetchData();
      }
    } catch {
      setFormError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch('/api/admin/teacher-assignments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) fetchData();
    } finally {
      setDeletingId(null);
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <RoleGuard allowedRoles={['PLATFORM_ADMIN', 'SCHOOL_ADMIN']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex-1 flex">
          <Sidebar />
          <main className="flex-1 flex flex-col min-w-0">
            <Header
              title="Teacher → Class/Section Mapping"
              subtitle="Assign teachers to schools, classes and sections so they can manage assignments and quizzes."
            />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">

              {/* Global success */}
              {formSuccess && !showForm && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-3 text-sm text-emerald-800 dark:text-emerald-200">
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> {formSuccess}
                </div>
              )}

              {/* Load error */}
              {loadError && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 p-3 text-sm text-rose-800 dark:text-rose-200" role="alert">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {loadError}
                </div>
              )}

              {/* Create Assignment Form Modal */}
              {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                  <Card className="w-full max-w-xl p-6">
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <UserCog className="w-5 h-5 text-indigo-500" />
                        New Teacher Assignment
                      </h2>
                      <button
                        onClick={() => { setShowForm(false); resetForm(); }}
                        className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        aria-label="Close form"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={handleCreate} className="space-y-4">
                      {/* Teacher */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Teacher *</label>
                        <select className={sel} value={fTeacher} onChange={e => setFTeacher(e.target.value)} required>
                          <option value="">-- Select Teacher --</option>
                          {(data?.teachers ?? []).map(t => (
                            <option key={t.id} value={t.id}>
                              {t.displayName ? `${t.displayName} (${t.email})` : t.email}
                            </option>
                          ))}
                        </select>
                        {(data?.teachers.length ?? 0) === 0 && (
                          <p className="mt-1 text-xs text-amber-600">No teachers registered. Teachers must register with role=TEACHER first.</p>
                        )}
                      </div>

                      {/* School */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">School *</label>
                        <select
                          className={sel}
                          value={fSchool}
                          onChange={e => { setFSchool(e.target.value); setFClass(''); setFSection(''); }}
                          required
                        >
                          <option value="">-- Select School --</option>
                          {(data?.schools ?? []).map(sc => (
                            <option key={sc.id} value={sc.id}>{sc.name}</option>
                          ))}
                        </select>
                        {(data?.schools.length ?? 0) === 0 && (
                          <p className="mt-1 text-xs text-amber-600">
                            No schools in the database. Use the database to seed school records first.
                          </p>
                        )}
                      </div>

                      {/* Class */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Class *</label>
                        <select
                          className={sel}
                          value={fClass}
                          onChange={e => { setFClass(e.target.value); setFSection(''); }}
                          disabled={!fSchool}
                          required
                        >
                          <option value="">-- Select Class --</option>
                          {availableClasses.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                        {fSchool && availableClasses.length === 0 && (
                          <p className="mt-1 text-xs text-amber-600">No classes in this school yet.</p>
                        )}
                      </div>

                      {/* Section */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Section *</label>
                        <select
                          className={sel}
                          value={fSection}
                          onChange={e => setFSection(e.target.value)}
                          disabled={!fClass}
                          required
                        >
                          <option value="">-- Select Section --</option>
                          {availableSections.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                        {fClass && availableSections.length === 0 && (
                          <p className="mt-1 text-xs text-amber-600">No sections in this class yet.</p>
                        )}
                      </div>

                      {/* Subject */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Subject</label>
                        <select className={sel} value={fSubject} onChange={e => setFSubject(e.target.value)}>
                          {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>

                      {formError && (
                        <div className="flex items-center gap-2 text-sm text-rose-600 dark:text-rose-400" role="alert">
                          <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
                        </div>
                      )}

                      <div className="flex gap-3 pt-2">
                        <Button type="submit" isLoading={saving} disabled={saving}>
                          Create Mapping
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => { setShowForm(false); resetForm(); }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Card>
                </div>
              )}

              {/* Header row */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Current Teacher Assignments
                </h2>
                <Button
                  onClick={() => { setShowForm(true); setFormSuccess(''); setFormError(''); }}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Assign Teacher
                </Button>
              </div>

              {/* Assignments table */}
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin" /> Loading assignments…
                </div>
              ) : (data?.assignments.length ?? 0) === 0 ? (
                <Card className="p-12 text-center">
                  <UserCog className="w-12 h-12 mx-auto mb-4 opacity-20 text-slate-500" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">No teacher assignments yet.</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Use the &ldquo;Assign Teacher&rdquo; button to map a teacher to a class section.
                  </p>
                  {(data?.schools.length ?? 0) === 0 && (
                    <p className="mt-4 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                      ⚠️ There are no schools in the database. You must insert at least one School, Class and Section record before creating teacher assignments.
                    </p>
                  )}
                </Card>
              ) : (
                <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm" aria-label="Teacher section assignments">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900/50">
                          <th className="text-left px-4 py-3">Teacher</th>
                          <th className="text-left px-4 py-3 hidden sm:table-cell">School</th>
                          <th className="text-left px-4 py-3">Class / Section</th>
                          <th className="text-left px-4 py-3 hidden md:table-cell">Subject</th>
                          <th className="text-left px-4 py-3 hidden lg:table-cell">Created</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {data!.assignments.map(a => (
                          <tr
                            key={a.id}
                            className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <p className="font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                                {a.teacherName ?? '—'}
                              </p>
                              <p className="text-[11px] text-slate-400 font-mono">{a.teacherEmail}</p>
                            </td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400 hidden sm:table-cell">
                              {a.schoolName}
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                              {a.className} <span className="text-slate-400">/</span> {a.sectionName}
                            </td>
                            <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                              {a.subject ?? '—'}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-400 hidden lg:table-cell">
                              {new Date(a.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleDelete(a.id)}
                                disabled={deletingId === a.id}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors disabled:opacity-50"
                                aria-label={`Remove ${a.teacherName ?? a.teacherEmail} from ${a.sectionName}`}
                              >
                                {deletingId === a.id
                                  ? <Loader2 className="w-4 h-4 animate-spin" />
                                  : <Trash2 className="w-4 h-4" />}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
