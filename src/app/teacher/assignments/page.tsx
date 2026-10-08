'use client';
import React, { useEffect, useState } from 'react';
import { ClipboardList, Plus, Loader2, X, Eye, CheckCircle } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Navbar } from '@/components/layout/Navbar';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface AssignedClass {
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  schoolName: string;
}

interface Assignment {
  id: string;
  title: string;
  subject: string;
  className: string;
  sectionName: string;
  total_marks: number;
  due_date: string;
  created_at: string;
}

interface Submission {
  id: string;
  student_id: string;
  display_name: string;
  answer_text: string;
  submitted_at: string;
  status: string;
  marks: number | null;
  feedback: string | null;
}

const BOARDS = ['CBSE', 'ICSE', 'STATE'];
const SUBJECTS = ['Mathematics', 'Science', 'English', 'Social Science', 'Hindi'];

const defaultForm = {
  title: '', description: '', subject: 'Mathematics', board: 'CBSE',
  chapter: '', classId: '', sectionId: '', totalMarks: 100, dueDate: ''
};

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<AssignedClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Submission view
  const [viewingAssignment, setViewingAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [subLoading, setSubLoading] = useState(false);

  // Grading
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [gradeMarks, setGradeMarks] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [gradeError, setGradeError] = useState('');
  const [gradeSaving, setGradeSaving] = useState(false);

  function fetchAssignments() {
    setLoading(true);
    fetch('/api/teacher/assignments')
      .then(r => r.json())
      .then(d => { if (d.assignments) setAssignments(d.assignments); })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchAssignments();
    fetch('/api/teacher/classes')
      .then(r => r.json())
      .then(d => { if (d.classes) setClasses(d.classes); });
  }, []);

  function handleFormChange(field: string, value: string | number) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (field === 'classId') setForm(prev => ({ ...prev, [field]: value as string, sectionId: '' }));
  }

  const availableSections = classes.filter(c => c.classId === form.classId);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!form.title.trim()) return setFormError('Title is required.');
    if (!form.classId) return setFormError('Select a class.');
    if (!form.sectionId) return setFormError('Select a section.');
    if (!form.dueDate) return setFormError('Due date is required.');
    if (!form.totalMarks || form.totalMarks <= 0) return setFormError('Total marks must be > 0.');

    const selectedClass = classes.find(c => c.sectionId === form.sectionId);
    setSaving(true);
    const res = await fetch('/api/teacher/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        classId: form.classId,
        sectionId: form.sectionId,
        title: form.title,
        description: form.description,
        subject: form.subject,
        board: form.board,
        chapter: form.chapter,
        totalMarks: form.totalMarks,
        dueDate: form.dueDate,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setSaveSuccess(true);
      setShowCreate(false);
      setForm(defaultForm);
      fetchAssignments();
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      const d = await res.json();
      setFormError(d.error || 'Failed to create assignment.');
    }
  }

  async function openSubmissions(assignment: Assignment) {
    setViewingAssignment(assignment);
    setSubLoading(true);
    const res = await fetch(`/api/teacher/assignments/submissions?assignmentId=${assignment.id}`);
    const d = await res.json();
    setSubmissions(d.submissions || []);
    setSubLoading(false);
  }

  async function submitGrade(e: React.FormEvent) {
    e.preventDefault();
    setGradeError('');
    if (!gradingSubmission) return;
    const marks = parseFloat(gradeMarks);
    if (isNaN(marks) || marks < 0) return setGradeError('Marks must be >= 0.');
    if (viewingAssignment && marks > viewingAssignment.total_marks)
      return setGradeError(`Marks cannot exceed ${viewingAssignment.total_marks}.`);

    setGradeSaving(true);
    const res = await fetch('/api/teacher/assignments/submissions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId: gradingSubmission.id, marks, feedback: gradeFeedback }),
    });
    setGradeSaving(false);
    if (res.ok) {
      setSubmissions(prev => prev.map(s =>
        s.id === gradingSubmission.id
          ? { ...s, marks, feedback: gradeFeedback, status: 'GRADED' }
          : s
      ));
      setGradingSubmission(null);
      setGradeMarks('');
      setGradeFeedback('');
    } else {
      setGradeError('Failed to save grade.');
    }
  }

  const inputCls = 'w-full text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <RoleGuard allowedRoles={['TEACHER', 'PLATFORM_ADMIN']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex-1 flex">
          <Sidebar />
          <main className="flex flex-1 min-w-0 flex-col">
            <Header title="Assignments Manager" subtitle="Create and grade student assignments" />
            <div className="mx-auto w-full max-w-7xl p-6">

              {/* Success banner */}
              {saveSuccess && (
                <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-800 text-sm dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-200">
                  <CheckCircle className="w-4 h-4 shrink-0" /> Assignment created successfully.
                </div>
              )}

              <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Your Assignments</h2>
                <Button onClick={() => { setShowCreate(true); setFormError(''); }} leftIcon={<Plus className="w-4 h-4" />}>
                  Create Assignment
                </Button>
              </div>

              {/* Create Modal */}
              {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                  <Card className="w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Create New Assignment</h3>
                      <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <form onSubmit={handleCreate} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Title *</label>
                        <input className={inputCls} value={form.title} onChange={e => handleFormChange('title', e.target.value)} required />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
                        <textarea className={inputCls} rows={3} value={form.description} onChange={e => handleFormChange('description', e.target.value)} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Subject *</label>
                          <select className={inputCls} value={form.subject} onChange={e => handleFormChange('subject', e.target.value)}>
                            {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Board *</label>
                          <select className={inputCls} value={form.board} onChange={e => handleFormChange('board', e.target.value)}>
                            {BOARDS.map(b => <option key={b}>{b}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Chapter / Topic</label>
                        <input className={inputCls} value={form.chapter} onChange={e => handleFormChange('chapter', e.target.value)} placeholder="e.g. Polynomials" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Class *</label>
                          <select className={inputCls} value={form.classId} onChange={e => handleFormChange('classId', e.target.value)}>
                            <option value="">-- Select Class --</option>
                            {[...new Map(classes.map(c => [c.classId, c])).values()].map(c => (
                              <option key={c.classId} value={c.classId}>{c.className} ({c.schoolName})</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Section *</label>
                          <select className={inputCls} value={form.sectionId} onChange={e => handleFormChange('sectionId', e.target.value)} disabled={!form.classId}>
                            <option value="">-- Select Section --</option>
                            {availableSections.map(s => (
                              <option key={s.sectionId} value={s.sectionId}>{s.sectionName}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Total Marks *</label>
                          <input type="number" min={1} className={inputCls} value={form.totalMarks} onChange={e => handleFormChange('totalMarks', parseInt(e.target.value) || 0)} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Due Date *</label>
                          <input type="date" className={inputCls} value={form.dueDate} onChange={e => handleFormChange('dueDate', e.target.value)} />
                        </div>
                      </div>
                      {formError && <p className="text-sm text-rose-600">{formError}</p>}
                      {classes.length === 0 && (
                        <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl">
                          No classes assigned to you yet. Ask your admin to assign you to a class/section first.
                        </p>
                      )}
                      <div className="flex gap-3 pt-2">
                        <Button type="submit" isLoading={saving} disabled={saving}>Save Assignment</Button>
                        <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
                      </div>
                    </form>
                  </Card>
                </div>
              )}

              {/* Submissions Slideout */}
              {viewingAssignment && (
                <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/60 backdrop-blur-sm" onClick={() => setViewingAssignment(null)}>
                  <div className="bg-white dark:bg-slate-900 w-full max-w-xl h-full overflow-y-auto p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h3 className="font-bold text-lg">{viewingAssignment.title}</h3>
                        <p className="text-xs text-slate-500">{viewingAssignment.subject} · {viewingAssignment.total_marks} marks</p>
                      </div>
                      <button onClick={() => setViewingAssignment(null)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {subLoading ? (
                      <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
                    ) : submissions.length === 0 ? (
                      <p className="text-slate-500 text-sm text-center py-12">No submissions yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {submissions.map(sub => (
                          <Card key={sub.id} className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-slate-100">{sub.display_name}</p>
                                <p className="text-xs text-slate-400">Submitted {new Date(sub.submitted_at).toLocaleDateString()}</p>
                              </div>
                              <span className={`text-xs font-bold px-2 py-1 rounded-full ${sub.status === 'GRADED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                {sub.status}
                              </span>
                            </div>
                            <p className="text-sm bg-slate-50 dark:bg-slate-800 rounded-lg p-3 mb-3">{sub.answer_text}</p>
                            {sub.status === 'GRADED' ? (
                              <div className="text-sm text-emerald-700 dark:text-emerald-400">
                                <p><strong>Marks:</strong> {sub.marks} / {viewingAssignment.total_marks}</p>
                                {sub.feedback && <p><strong>Feedback:</strong> {sub.feedback}</p>}
                              </div>
                            ) : (
                              gradingSubmission?.id === sub.id ? (
                                <form onSubmit={submitGrade} className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="text-xs font-semibold text-slate-500">Marks (max {viewingAssignment.total_marks})</label>
                                      <input type="number" step="0.5" min={0} max={viewingAssignment.total_marks} className={inputCls + ' mt-1'} value={gradeMarks} onChange={e => setGradeMarks(e.target.value)} required />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-xs font-semibold text-slate-500">Feedback</label>
                                    <textarea className={inputCls + ' mt-1'} rows={2} value={gradeFeedback} onChange={e => setGradeFeedback(e.target.value)} />
                                  </div>
                                  {gradeError && <p className="text-xs text-rose-600">{gradeError}</p>}
                                  <div className="flex gap-2">
                                    <Button size="sm" type="submit" isLoading={gradeSaving}>Save Grade</Button>
                                    <Button size="sm" variant="ghost" type="button" onClick={() => setGradingSubmission(null)}>Cancel</Button>
                                  </div>
                                </form>
                              ) : (
                                <Button size="sm" variant="primary" onClick={() => { setGradingSubmission(sub); setGradeMarks(''); setGradeFeedback(''); setGradeError(''); }}>
                                  Grade Submission
                                </Button>
                              )
                            )}
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Assignment List */}
              {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
              ) : assignments.length === 0 ? (
                <Card className="p-12 text-center text-slate-500">
                  <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="font-semibold">No assignments yet.</p>
                  <p className="text-sm mt-1">Create your first assignment using the button above.</p>
                </Card>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left p-4">Title</th>
                        <th className="text-left p-4">Subject</th>
                        <th className="text-left p-4 hidden sm:table-cell">Class / Section</th>
                        <th className="text-left p-4 hidden md:table-cell">Due Date</th>
                        <th className="text-right p-4">Marks</th>
                        <th className="p-4"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map(a => (
                        <tr key={a.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-4 font-semibold text-slate-900 dark:text-slate-100">{a.title}</td>
                          <td className="p-4 text-slate-500">{a.subject}</td>
                          <td className="p-4 text-slate-500 hidden sm:table-cell">{a.className} / {a.sectionName}</td>
                          <td className="p-4 text-slate-500 hidden md:table-cell">{a.due_date ? new Date(a.due_date).toLocaleDateString() : '—'}</td>
                          <td className="p-4 text-right font-bold text-indigo-600 dark:text-indigo-400">{a.total_marks}</td>
                          <td className="p-4">
                            <Button size="sm" variant="ghost" onClick={() => openSubmissions(a)} leftIcon={<Eye className="w-3.5 h-3.5" />}>
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}