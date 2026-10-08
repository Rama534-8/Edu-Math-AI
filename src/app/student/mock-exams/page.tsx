'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth-context';
import { CLASS_9_CHAPTERS } from '@/lib/curriculum-data';
import {
  ClipboardList, Clock, BookOpen, History, ArrowRight,
  CheckCircle2, XCircle, Play, AlertTriangle, ChevronRight,
} from 'lucide-react';

interface AttemptRecord {
  id: string;
  board: string;
  exam_type: string;
  chapter_title?: string;
  status: string;
  started_at: string;
  submitted_at?: string;
  total_questions: number;
  total_marks: number;
  obtained_marks: number;
  percentage: number;
  result_status: string;
  duration_minutes: number;
  canResume: boolean;
  remainingSeconds: number;
}

export default function MockExamsPage() {
  const { studentProfile } = useAuth();
  const router = useRouter();
  const board = studentProfile?.board || 'CBSE';

  const [examType, setExamType] = React.useState<'FULL' | 'CHAPTER'>('FULL');
  const [selectedChapterId, setSelectedChapterId] = React.useState('');
  const [starting, setStarting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [history, setHistory] = React.useState<AttemptRecord[]>([]);
  const [historyLoading, setHistoryLoading] = React.useState(true);

  const boardChapters = CLASS_9_CHAPTERS.filter((c) => c.board === board);

  React.useEffect(() => {
    fetch('/api/mock-exam/history')
      .then((r) => r.json())
      .then((d) => setHistory(d.attempts || []))
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, []);

  const startExam = async () => {
    if (examType === 'CHAPTER' && !selectedChapterId) {
      setError('Please select a chapter.');
      return;
    }
    setError('');
    setStarting(true);
    try {
      const res = await fetch('/api/mock-exam/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examType, chapterId: selectedChapterId || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start exam');
      router.push(`/student/mock-exams/${data.attemptId}/take`);
    } catch (err: any) {
      setError(err.message);
      setStarting(false);
    }
  };

  const completedAttempts = history.filter((a) => a.status === 'SUBMITTED');
  const bestPct = completedAttempts.length > 0 ? Math.max(...completedAttempts.map((a) => a.percentage)) : null;
  const lastScore = completedAttempts.length > 0 ? completedAttempts[0].percentage : null;

  return (
    <RoleGuard allowedRoles={['STUDENT']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex-1 flex">
          <Sidebar />
          <main className="flex-1 flex flex-col min-w-0">
            <Header
              title="Mock Exams"
              subtitle={`Class 9 Mathematics • ${board === 'AP_STATE_BOARD' ? 'AP State Board' : 'CBSE'}`}
            />

            <div className="p-4 sm:p-6 max-w-5xl w-full mx-auto space-y-6">

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Completed', value: completedAttempts.length, icon: ClipboardList },
                  { label: 'Best Score', value: bestPct !== null ? `${bestPct}%` : '—', icon: CheckCircle2 },
                  { label: 'Last Score', value: lastScore !== null ? `${lastScore}%` : '—', icon: BookOpen },
                  { label: 'Duration', value: '30 mins', icon: Clock },
                ].map((s) => (
                  <Card key={s.label} className="p-4 flex items-center gap-3">
                    <s.icon className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500">{s.label}</p>
                      <p className="text-base font-black text-slate-900 dark:text-slate-100">{s.value}</p>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Exam Config Card */}
              <Card className="p-6">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-5 flex items-center gap-2">
                  <Play className="w-4 h-4 text-indigo-500" />
                  Start a New Mock Exam
                </h2>

                {/* Exam type tabs */}
                <div className="flex gap-2 mb-5">
                  {(['FULL', 'CHAPTER'] as const).map((t) => (
                    <button
                      key={t}
                      id={`exam-type-${t.toLowerCase()}`}
                      onClick={() => { setExamType(t); setSelectedChapterId(''); setError(''); }}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold border transition-all ${
                        examType === t
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300'
                      }`}
                    >
                      {t === 'FULL' ? '📋 Full Mock Exam' : '📖 Chapter-wise'}
                    </button>
                  ))}
                </div>

                {/* Chapter selector */}
                {examType === 'CHAPTER' && (
                  <div className="mb-5">
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
                      Select Chapter *
                    </label>
                    <select
                      id="chapter-select"
                      value={selectedChapterId}
                      onChange={(e) => setSelectedChapterId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">— Choose a chapter —</option>
                      {boardChapters.map((ch) => (
                        <option key={ch.id} value={ch.id}>Ch {ch.chapterNumber}: {ch.title}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Info */}
                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 mb-5 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <p><strong>Board:</strong> {board === 'AP_STATE_BOARD' ? 'AP State Board' : 'CBSE'} (from your profile)</p>
                  <p><strong>Questions:</strong> {examType === 'FULL' ? '~20 questions across all chapters' : '~10 questions from selected chapter'}</p>
                  <p><strong>Duration:</strong> 30 minutes</p>
                  <p><strong>Pass Mark:</strong> 40%</p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl mb-4 text-sm text-rose-600">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <Button
                  id="start-exam-btn"
                  className="w-full"
                  onClick={startExam}
                  isLoading={starting}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  {starting ? 'Generating Questions…' : 'Start Mock Exam'}
                </Button>
              </Card>

              {/* History */}
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Exam History
                </h2>

                {historyLoading && <p className="text-sm text-slate-400 py-4">Loading history…</p>}

                {!historyLoading && history.length === 0 && (
                  <Card className="p-6 text-center">
                    <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">No mock exam attempts yet. Take your first exam above!</p>
                  </Card>
                )}

                {!historyLoading && history.length > 0 && (
                  <div className="space-y-3">
                    {history.map((a) => (
                      <Card key={a.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <Badge variant={a.status === 'SUBMITTED' ? 'secondary' : 'warning'} size="sm">
                              {a.exam_type === 'FULL' ? 'Full Exam' : 'Chapter'}
                            </Badge>
                            {a.status === 'SUBMITTED' && (
                              <Badge variant={a.result_status === 'PASS' ? 'success' : 'danger'} size="sm">
                                {a.result_status}
                              </Badge>
                            )}
                            {a.status === 'IN_PROGRESS' && (
                              <Badge variant="warning" size="sm">In Progress</Badge>
                            )}
                          </div>
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                            {a.chapter_title || 'Full Mathematics Mock'} ({a.board === 'AP_STATE_BOARD' ? 'AP' : 'CBSE'})
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(a.started_at).toLocaleDateString()} •{' '}
                            {a.status === 'SUBMITTED'
                              ? `${a.percentage}% (${a.obtained_marks}/${a.total_marks})`
                              : a.canResume ? `${Math.floor(a.remainingSeconds / 60)}m remaining` : 'Expired'
                            }
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          {a.status === 'SUBMITTED' ? (
                            <Link href={`/student/mock-exams/${a.id}/result`}>
                              <Button size="sm" variant="outline" rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
                                View Result
                              </Button>
                            </Link>
                          ) : a.canResume ? (
                            <Link href={`/student/mock-exams/${a.id}/take`}>
                              <Button size="sm" rightIcon={<Play className="w-3.5 h-3.5" />}>Resume</Button>
                            </Link>
                          ) : (
                            <span className="text-xs text-slate-400">Expired</span>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
