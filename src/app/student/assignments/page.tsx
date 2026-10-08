'use client';
import React, { useEffect, useState } from 'react';
import { ClipboardList, CheckCircle2, Clock, Award, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Navbar } from '@/components/layout/Navbar';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Assignment {
  id: string;
  title: string;
  subject: string;
  description: string | null;
  total_marks: number;
  due_date: string | null;
  status: string | null;   // from submission join
  marks: number | null;
  feedback: string | null;
}

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<Record<string, boolean>>({});

  function fetchAssignments() {
    setLoading(true);
    fetch('/api/student/assignments')
      .then(r => r.json())
      .then(d => { if (d.assignments) setAssignments(d.assignments); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchAssignments(); }, []);

  async function handleSubmit(assignmentId: string) {
    const answer = answers[assignmentId]?.trim();
    if (!answer) return setErrors(prev => ({ ...prev, [assignmentId]: 'Please write your answer before submitting.' }));
    setErrors(prev => ({ ...prev, [assignmentId]: '' }));
    setSubmitting(assignmentId);
    try {
      const res = await fetch('/api/student/assignments/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId, answerText: answer }),
      });
      const d = await res.json();
      if (res.ok) {
        setSuccess(prev => ({ ...prev, [assignmentId]: true }));
        fetchAssignments();
      } else {
        setErrors(prev => ({ ...prev, [assignmentId]: d.error || 'Submission failed.' }));
      }
    } catch {
      setErrors(prev => ({ ...prev, [assignmentId]: 'Network error. Please try again.' }));
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <RoleGuard allowedRoles={['STUDENT']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex-1 flex">
          <Sidebar />
          <main className="flex flex-1 min-w-0 flex-col">
            <Header title="My Assignments" subtitle="Complete homework assigned by your teacher" />
            <div className="mx-auto w-full max-w-4xl p-6 space-y-5">
              {loading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
              ) : assignments.length === 0 ? (
                <Card className="p-12 text-center">
                  <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-30 text-slate-400" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">No assignments yet.</p>
                  <p className="text-sm text-slate-500 mt-1">Your teacher has not posted any assignments for your class yet.</p>
                </Card>
              ) : (
                assignments.map(a => (
                  <Card key={a.id} className="p-6">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">{a.title}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{a.subject}{a.due_date ? ` · Due ${new Date(a.due_date).toLocaleDateString()}` : ''} · {a.total_marks} marks</p>
                      </div>
                      {a.status === 'GRADED' && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 px-2.5 py-1 rounded-full">
                          <Award className="w-3.5 h-3.5" /> Graded
                        </span>
                      )}
                      {a.status === 'PENDING' && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 px-2.5 py-1 rounded-full">
                          <Clock className="w-3.5 h-3.5" /> Submitted
                        </span>
                      )}
                      {!a.status && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 px-2.5 py-1 rounded-full">
                          Pending Submission
                        </span>
                      )}
                    </div>

                    {a.description && <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{a.description}</p>}

                    {a.status === 'GRADED' ? (
                      <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 p-4 space-y-1">
                        <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
                          Score: {a.marks} / {a.total_marks}
                        </p>
                        {a.feedback && (
                          <p className="text-sm text-emerald-700 dark:text-emerald-300">
                            <span className="font-semibold">Teacher feedback:</span> {a.feedback}
                          </p>
                        )}
                      </div>
                    ) : a.status === 'PENDING' ? (
                      <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        Your submission is under review.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <label className="block text-xs font-semibold text-slate-500">Your Answer</label>
                        <textarea
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-28"
                          placeholder="Write your answer here..."
                          value={answers[a.id] || ''}
                          onChange={e => setAnswers(prev => ({ ...prev, [a.id]: e.target.value }))}
                        />
                        {errors[a.id] && <p className="text-xs text-rose-600">{errors[a.id]}</p>}
                        {success[a.id] && <p className="text-xs text-emerald-600">Submitted successfully!</p>}
                        <Button
                          size="sm"
                          onClick={() => handleSubmit(a.id)}
                          isLoading={submitting === a.id}
                          disabled={!!submitting}
                        >
                          Submit Assignment
                        </Button>
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}