'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  BASELINE_QUIZ_METADATA,
  SAMPLE_QUESTIONS_BANK,
} from '@/lib/curriculum-data';
import {

  generateRetestQuestionsFromWeakTopics,
} from '@/lib/deterministic-evaluator';
import { MathRenderer, MixedMathText } from '@/components/ui/MathRenderer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  ShieldAlert,
  Brain,
} from 'lucide-react';
import { StudentAnswerSubmission } from '@/types';

function BaselineAssessmentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { studentProfile, saveAssessmentSnapshot, getAssessmentSnapshots } = useAuth();

  const failedAttempt = getAssessmentSnapshots()
    .filter((snapshot) => snapshot.resultStatus === 'FAIL')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || null;
  const isRetestMode = searchParams.get('retest') === '1';
  const questions = isRetestMode && failedAttempt
    ? generateRetestQuestionsFromWeakTopics(failedAttempt, SAMPLE_QUESTIONS_BANK, 5)
    : SAMPLE_QUESTIONS_BANK;
  const totalQuestions = questions.length || 1;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(20 * 60); // 20 mins
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const submitAssessmentRef = useRef<(() => Promise<void>) | null>(null);
  const submissionStartedRef = useRef(false);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentQ = questions[currentIndex];
  const currentAnswer = answers[currentQ.id] || '';
  const isCurrentMarked = !!markedForReview[currentQ.id];

  const handleSelectOption = (optId: string) => {
    setAnswers((prev) => ({ ...prev, [currentQ.id]: optId }));
  };

  const handleTextAnswerChange = (val: string) => {
    setAnswers((prev) => ({ ...prev, [currentQ.id]: val }));
  };

  const toggleMarkForReview = () => {
    setMarkedForReview((prev) => ({
      ...prev,
      [currentQ.id]: !prev[currentQ.id],
    }));
  };

  const answeredCount = Object.values(answers).filter((a) => a.trim() !== '').length;

  async function handleSubmitAssessment() {
    if (submissionStartedRef.current) return;
    submissionStartedRef.current = true;
    setIsSubmitting(true);
    setSubmissionError('');
    const submissions: StudentAnswerSubmission[] = questions.map((q) => ({
      questionId: q.id,
      studentAnswer: answers[q.id] || '',
      timeSpentSeconds: Math.round((20 * 60 - timeRemainingSeconds) / totalQuestions),
      markedForReview: !!markedForReview[q.id],
    }));

    const previousAttempt = isRetestMode ? failedAttempt : null;
    const nextAttemptNumber = previousAttempt ? (previousAttempt.attemptNumber ?? 1) + 1 : 1;

    try {
      const response = await fetch('/api/evaluate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          quizId: isRetestMode ? 'retest-weaker-topics' : BASELINE_QUIZ_METADATA.id,
          submissions,
          previousAttemptId: previousAttempt?.id || null,
          attemptNumber: nextAttemptNumber,
          isRetest: isRetestMode,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.snapshot) {
        throw new Error(result?.error || 'The assessment could not be evaluated. Please try again.');
      }
      await saveAssessmentSnapshot(result.snapshot);
      router.push('/student/baseline/result');
    } catch (error) {
      submissionStartedRef.current = false;
      setSubmissionError(error instanceof Error ? error.message : 'The assessment could not be saved. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    submitAssessmentRef.current = handleSubmitAssessment;
  });

  useEffect(() => {
    if (timeRemainingSeconds === 0) {
      void submitAssessmentRef.current?.();
    }
  }, [timeRemainingSeconds]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {submissionError && (
        <div className="mx-auto mt-4 w-full max-w-3xl px-4 text-sm text-rose-700 dark:text-rose-300" role="alert">
          {submissionError}
        </div>
      )}
      {/* Test Header */}
      <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {isRetestMode ? 'Weak Topic Retest' : 'Class 9 Mathematics Baseline Diagnostic'}
              <Badge variant="purple" size="sm">
                {isRetestMode ? 'Retest' : 'Immutable Snapshot'}
              </Badge>
            </h2>
            <span className="text-[11px] text-slate-500">
              Question {currentIndex + 1} of {totalQuestions} • {answeredCount} Answered
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Timer Display */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
            <Clock className="w-4 h-4 text-indigo-500" />
            <span>{formatTime(timeRemainingSeconds)}</span>
          </div>

          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsSubmitModalOpen(true)}
          >
            Submit Test
          </Button>
        </div>
      </header>

      {/* Main Test Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Active Question Area (3 Cols) */}
        <div className="lg:col-span-3 flex flex-col justify-between">
          <Card className="p-6 sm:p-8 flex-1 flex flex-col justify-between shadow-md">
            <div>
              {/* Question Meta Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                <div className="flex items-center gap-2">
                  <Badge variant="primary" size="md">
                    Question {currentIndex + 1}
                  </Badge>
                  <Badge variant="secondary" size="sm">
                    {currentQ.type}
                  </Badge>
                  <Badge
                    variant={
                      currentQ.difficulty === 'EASY'
                        ? 'success'
                        : currentQ.difficulty === 'MEDIUM'
                        ? 'warning'
                        : 'danger'
                    }
                    size="sm"
                  >
                    {currentQ.difficulty}
                  </Badge>
                </div>

                <button
                  onClick={toggleMarkForReview}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    isCurrentMarked
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>{isCurrentMarked ? 'Marked for Review' : 'Mark for Review'}</span>
                </button>
              </div>

              {/* Question Text */}
              <div className="space-y-3 mb-8">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                  <MixedMathText text={currentQ.questionText} />
                </h3>
                {studentProfile?.medium === 'TELUGU' && currentQ.questionTextTelugu && (
                  <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                    {currentQ.questionTextTelugu}
                  </p>
                )}
                {currentQ.latex && (
                  <div className="p-4 my-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                    <MathRenderer math={currentQ.latex} inline={false} />
                  </div>
                )}
              </div>

              {/* Question Input Section */}
              <div className="space-y-3">
                {currentQ.type === 'MCQ' || currentQ.type === 'TRUE_FALSE' ? (
                  <div className="space-y-2.5">
                    {currentQ.options?.map((opt) => {
                      const isSelected = currentAnswer === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleSelectOption(opt.id)}
                          className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between text-sm cursor-pointer ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 ring-2 ring-indigo-500/20 font-semibold text-indigo-950 dark:text-indigo-100'
                              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                isSelected
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                              }`}
                            >
                              {opt.id.replace('opt-', '').toUpperCase()}
                            </span>
                            <span>{opt.text}</span>
                          </div>
                          {isSelected && <CheckCircle className="w-5 h-5 text-indigo-600" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-500">
                      Enter your final numerical or short answer value:
                    </label>
                    <input
                      type="text"
                      value={currentAnswer}
                      onChange={(e) => handleTextAnswerChange(e.target.value)}
                      placeholder="e.g. 5, 115, 12..."
                      className="w-full text-base font-mono p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Nav Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800 mt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => prev - 1)}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
              >
                Previous
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleTextAnswerChange('')}
                  className="text-xs text-slate-400"
                >
                  Clear Answer
                </Button>
                {currentIndex < totalQuestions - 1 ? (
                  <Button
                    size="sm"
                    onClick={() => setCurrentIndex((prev) => prev + 1)}
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                  >
                    Next Question
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsSubmitModalOpen(true)}
                  >
                    Finish Assessment
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Question Navigation Palette (1 Col) */}
        <div className="space-y-6">
          <Card className="p-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
              Question Palette
            </h4>

            {/* Grid of question buttons */}
            <div className="grid grid-cols-5 gap-2 mb-6">
              {questions.map((q, idx) => {
                const isAns = answers[q.id]?.trim() !== '';
                const isMarked = markedForReview[q.id];
                const isCurrent = idx === currentIndex;

                let btnStyle =
                  'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700';

                if (isCurrent) {
                  btnStyle = 'ring-2 ring-indigo-500 font-black';
                }
                if (isAns) {
                  btnStyle += ' bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300';
                }
                if (isMarked) {
                  btnStyle += ' bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 rounded-xl border text-xs font-bold transition-all cursor-pointer ${btnStyle}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="space-y-2 text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-emerald-500" />
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-amber-500" />
                <span>Marked for Review ({Object.values(markedForReview).filter(Boolean).length})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-slate-300 dark:bg-slate-700" />
                <span>Unanswered ({totalQuestions - answeredCount})</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title={isRetestMode ? 'Submit Weak Topic Retest?' : 'Submit Baseline Assessment?'}
      >
        <div className="space-y-4">\n          {submissionError && <p className="text-xs text-rose-700 dark:text-rose-300" role="alert">{submissionError}</p>}\n          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            You have answered <strong>{answeredCount}</strong> out of{' '}
            <strong>{totalQuestions}</strong> questions.
          </p>

          <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-xs text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <span className="font-bold block mb-1">
              {isRetestMode ? 'Weak Topic Retest:' : '🔒 Immutable Baseline Snapshot:'}
            </span>
            {isRetestMode
              ? 'Your score will be checked against the saved failed attempt and recorded in your assessment history.'
              : 'Your score and mistake patterns will be calculated on the server and saved permanently to track future Before & After learning gains.'}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSubmitModalOpen(false)}
            >
              Continue Test
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleSubmitAssessment}
            >
              Confirm & Evaluate
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function BaselineAssessmentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
          <div className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Loading baseline assessment...
          </div>
        </div>
      }
    >
      <BaselineAssessmentPageContent />
    </Suspense>
  );
}
