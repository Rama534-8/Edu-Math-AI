'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Clock, ChevronLeft, ChevronRight, Flag, Send, AlertTriangle, CheckCircle2,
} from 'lucide-react';

interface ClientQuestion {
  id: string;
  chapterId: string;
  topicId: string;
  type: string;
  questionText: string;
  options: { id: string; text: string }[];
  marks: number;
}

interface QuestionState {
  selectedAnswer: string;
  markedForReview: boolean;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function TakeExamPage() {
  const params = useParams();
  const attemptId = params?.attemptId as string;
  const router = useRouter();

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [questions, setQuestions] = React.useState<ClientQuestion[]>([]);
  const [states, setStates] = React.useState<Record<string, QuestionState>>({});
  const [currentIdx, setCurrentIdx] = React.useState(0);
  const [remainingSeconds, setRemainingSeconds] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [examInfo, setExamInfo] = React.useState<{ board: string; examType: string; chapterTitle?: string } | null>(null);
  const autoSubmitted = React.useRef(false);
  const saveTimeout = React.useRef<NodeJS.Timeout | null>(null);

  // Load exam state on mount (restores timer correctly from server)
  React.useEffect(() => {
    if (!attemptId) return;
    fetch(`/api/mock-exam/${attemptId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        if (data.status === 'SUBMITTED') {
          router.replace(`/student/mock-exams/${attemptId}/result`);
          return;
        }
        setQuestions(data.questions || []);
        setRemainingSeconds(data.remainingSeconds || data.durationMinutes * 60);
        setExamInfo({ board: data.board, examType: data.examType, chapterTitle: data.chapterTitle });

        // Restore saved answers
        const init: Record<string, QuestionState> = {};
        for (const q of data.questions || []) {
          const saved = data.savedAnswers?.[q.id];
          init[q.id] = {
            selectedAnswer: saved?.selectedAnswer || '',
            markedForReview: saved?.markedForReview || false,
          };
        }
        setStates(init);
      })
      .catch(() => setError('Failed to load exam. Please try again.'))
      .finally(() => setLoading(false));
  }, [attemptId, router]);

  // Countdown timer
  React.useEffect(() => {
    if (loading || remainingSeconds <= 0) return;
    const interval = setInterval(() => {
      setRemainingSeconds((s) => {
        if (s <= 1) {
          clearInterval(interval);
          if (!autoSubmitted.current) {
            autoSubmitted.current = true;
            submitExam(true);
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
   
  }, [loading]);

  const updateState = (questionId: string, patch: Partial<QuestionState>) => {
    setStates((prev) => ({ ...prev, [questionId]: { ...prev[questionId], ...patch } }));
    // Debounced auto-save
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      const updated = { ...states[questionId], ...patch };
      await fetch(`/api/mock-exam/${attemptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          selectedAnswer: updated.selectedAnswer || '',
          markedForReview: updated.markedForReview || false,
        }),
      }).catch(() => {});
    }, 800);
  };

  async function submitExam(auto = false) {
    if (submitting) return;
    setSubmitting(true);
    setShowConfirm(false);
    try {
      // Build answers map
      const answersMap: Record<string, string> = {};
      for (const [qId, st] of Object.entries(states)) {
        answersMap[qId] = st.selectedAnswer;
      }
      const res = await fetch(`/api/mock-exam/${attemptId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answersMap }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      router.push(`/student/mock-exams/${attemptId}/result`);
    } catch (err: any) {
      setError(err.message || 'Submission failed. Please try again.');
      setSubmitting(false);
    }
  }

  const q = questions[currentIdx];
  const answeredCount = Object.values(states).filter((s) => s.selectedAnswer).length;
  const markedCount = Object.values(states).filter((s) => s.markedForReview).length;
  const isLow = remainingSeconds <= 300 && remainingSeconds > 0;

  if (loading) {
    return (
      <RoleGuard allowedRoles={['STUDENT']}>
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <p className="text-slate-500 animate-pulse">Loading your exam…</p>
        </div>
      </RoleGuard>
    );
  }

  if (error) {
    return (
      <RoleGuard allowedRoles={['STUDENT']}>
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
          <Card className="p-8 max-w-md w-full text-center">
            <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">Exam Error</h2>
            <p className="text-sm text-slate-500 mb-6">{error}</p>
            <Button onClick={() => router.push('/student/mock-exams')}>Back to Exams</Button>
          </Card>
        </div>
      </RoleGuard>
    );
  }

  if (questions.length === 0) {
    return (
      <RoleGuard allowedRoles={['STUDENT']}>
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
          <Card className="p-8 max-w-md w-full text-center">
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-base font-bold mb-2">No Questions Available</h2>
            <p className="text-sm text-slate-500 mb-6">We couldn't load questions. Please try starting a new exam.</p>
            <Button onClick={() => router.push('/student/mock-exams')}>Back to Exams</Button>
          </Card>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={['STUDENT']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">

        {/* Top exam bar */}
        <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Badge variant="primary" size="sm">
                {examInfo?.examType === 'FULL' ? 'Full Mock' : 'Chapter Exam'}
              </Badge>
              <span className="text-xs font-semibold text-slate-500 truncate hidden sm:block">
                {examInfo?.chapterTitle || `${examInfo?.board === 'AP_STATE_BOARD' ? 'AP' : 'CBSE'} Class 9 Mathematics`}
              </span>
            </div>

            {/* Timer */}
            <div
              className={`flex items-center gap-2 font-mono font-black text-lg px-4 py-1.5 rounded-xl ${
                isLow
                  ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100'
              }`}
              role="timer"
              aria-label={`Time remaining: ${formatTime(remainingSeconds)}`}
            >
              <Clock className="w-4 h-4" />
              {formatTime(remainingSeconds)}
            </div>

            <Button
              size="sm"
              id="submit-exam-btn"
              onClick={() => setShowConfirm(true)}
              isLoading={submitting}
              rightIcon={<Send className="w-3.5 h-3.5" />}
            >
              Submit
            </Button>
          </div>
        </header>

        <div className="flex-1 flex max-w-6xl w-full mx-auto px-4 py-6 gap-6">

          {/* Main question panel */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            <Card className="p-6 flex-1">
              {/* Question header */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-500">
                  Question {currentIdx + 1} of {questions.length} • {q.marks} mark{q.marks !== 1 ? 's' : ''}
                </span>
                <button
                  id={`mark-review-${q.id}`}
                  onClick={() => updateState(q.id, { markedForReview: !states[q.id]?.markedForReview })}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                    states[q.id]?.markedForReview
                      ? 'bg-amber-100 border-amber-300 text-amber-700 dark:bg-amber-900/40 dark:border-amber-700 dark:text-amber-400'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-amber-300'
                  }`}
                  aria-pressed={states[q.id]?.markedForReview || false}
                >
                  <Flag className="w-3.5 h-3.5" />
                  {states[q.id]?.markedForReview ? 'Marked' : 'Mark for Review'}
                </button>
              </div>

              {/* Question text */}
              <p className="text-base font-semibold text-slate-900 dark:text-slate-100 leading-relaxed mb-6">
                {q.questionText}
              </p>

              {/* Options */}
              {q.type === 'MCQ' && q.options && (
                <div className="space-y-3" role="radiogroup" aria-label="Answer options">
                  {q.options.map((opt) => {
                    const selected = states[q.id]?.selectedAnswer === opt.id;
                    return (
                      <button
                        key={opt.id}
                        id={`opt-${q.id}-${opt.id}`}
                        role="radio"
                        aria-checked={selected}
                        onClick={() => updateState(q.id, { selectedAnswer: opt.id })}
                        className={`w-full text-left flex items-start gap-3 p-4 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          selected
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-300'
                        }`}
                      >
                        <span className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-black ${
                          selected ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-slate-300'
                        }`}>
                          {opt.id.replace('opt-', '').toUpperCase()}
                        </span>
                        <span className="text-sm text-slate-800 dark:text-slate-200">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Numerical / Short answer */}
              {(q.type === 'NUMERICAL' || q.type === 'SHORT_ANSWER') && (
                <div>
                  <label htmlFor={`num-ans-${q.id}`} className="block text-xs font-bold text-slate-500 mb-2">
                    Your Answer
                  </label>
                  <input
                    id={`num-ans-${q.id}`}
                    type="text"
                    value={states[q.id]?.selectedAnswer || ''}
                    onChange={(e) => updateState(q.id, { selectedAnswer: e.target.value })}
                    placeholder="Type your answer here"
                    className="w-full max-w-xs px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                disabled={currentIdx === 0}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
                id="prev-btn"
              >
                Previous
              </Button>

              <span className="text-xs text-slate-500 font-semibold">
                {answeredCount}/{questions.length} answered
                {markedCount > 0 && ` · ${markedCount} flagged`}
              </span>

              {currentIdx < questions.length - 1 ? (
                <Button
                  size="sm"
                  onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                  id="next-btn"
                >
                  Next
                </Button>
              ) : (
                <Button
                  size="sm"
                  id="finish-btn"
                  onClick={() => setShowConfirm(true)}
                  rightIcon={<Send className="w-4 h-4" />}
                >
                  Finish
                </Button>
              )}
            </div>
          </div>

          {/* Question navigation panel */}
          <aside className="hidden lg:flex w-56 flex-col gap-4">
            <Card className="p-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Questions</h3>
              <div className="grid grid-cols-5 gap-1.5">
                {questions.map((qq, i) => {
                  const st = states[qq.id];
                  const answered = !!st?.selectedAnswer;
                  const reviewing = !!st?.markedForReview;
                  const isCurrent = i === currentIdx;
                  return (
                    <button
                      key={qq.id}
                      id={`qnav-${i + 1}`}
                      onClick={() => setCurrentIdx(i)}
                      aria-label={`Question ${i + 1}${answered ? ' answered' : ' unanswered'}${reviewing ? ' marked for review' : ''}`}
                      className={`w-8 h-8 rounded-lg text-xs font-black transition-all border-2 ${
                        isCurrent
                          ? 'border-indigo-500 bg-indigo-500 text-white'
                          : reviewing
                          ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                          : answered
                          ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-indigo-300'
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-3 space-y-1.5 text-[10px] text-slate-500">
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-indigo-500" aria-hidden />Current</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-400" aria-hidden />Answered</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-100 border border-amber-400" aria-hidden />Flagged</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-slate-200 dark:border-slate-700" aria-hidden />Unanswered</div>
              </div>
            </Card>
          </aside>
        </div>

        {/* Confirm submit dialog */}
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal aria-labelledby="confirm-title">
            <Card className="p-8 max-w-md w-full">
              <h2 id="confirm-title" className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3">
                Submit Exam?
              </h2>
              <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400 mb-6">
                <p>✅ Answered: <strong>{answeredCount}</strong> of {questions.length}</p>
                <p>❓ Unanswered: <strong>{questions.length - answeredCount}</strong></p>
                {markedCount > 0 && <p>🚩 Flagged for review: <strong>{markedCount}</strong></p>}
                <p className="text-xs text-slate-400 mt-2">You cannot change answers after submission.</p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowConfirm(false)}
                  id="cancel-submit-btn"
                >
                  Continue Exam
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => submitExam()}
                  isLoading={submitting}
                  id="confirm-submit-btn"
                  rightIcon={<Send className="w-3.5 h-3.5" />}
                >
                  Submit Now
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Submission loading overlay */}
        {submitting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 flex-col gap-4">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            <p className="text-white font-bold">Submitting your exam…</p>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
