'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { SAMPLE_QUESTIONS_BANK, BASELINE_QUIZ_METADATA, COMPARABLE_POST_ASSESSMENT_METADATA } from '@/lib/curriculum-data';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { MathRenderer, MixedMathText } from '@/components/ui/MathRenderer';
import { Clock, Flag, ChevronLeft, ChevronRight, CheckCircle, Brain } from 'lucide-react';
import { StudentAnswerSubmission } from '@/types';

export default function ActiveQuizPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = (params?.id as string) || 'quiz-ch1';
  const { saveAssessmentSnapshot } = useAuth();

  const isComparable = quizId === 'comparable-post-retest-class9';
  const isExam = quizId.startsWith('exam-');
  const questions = SAMPLE_QUESTIONS_BANK;
  const totalQuestions = questions.length;
  const durationSeconds = BASELINE_QUIZ_METADATA.durationMinutes * 60;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(durationSeconds);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const submitHandlerRef = useRef<(() => Promise<void>) | null>(null);
  const submissionStartedRef = useRef(false);

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
  const isMarked = !!markedForReview[currentQ.id];

  async function handleSubmit() {
    if (submissionStartedRef.current) return;
    submissionStartedRef.current = true;
    setIsSubmitting(true);
    setSubmissionError('');
    const submissions: StudentAnswerSubmission[] = questions.map((q) => ({
      questionId: q.id,
      studentAnswer: answers[q.id] || '',
      timeSpentSeconds: Math.round((durationSeconds - timeRemainingSeconds) / totalQuestions),
      markedForReview: !!markedForReview[q.id],
    }));

    const targetMeta = isComparable
      ? COMPARABLE_POST_ASSESSMENT_METADATA
      : { ...BASELINE_QUIZ_METADATA, id: quizId, title: isExam ? 'Class 9 Mathematics Timed Assessment' : `Class 9 Quiz (${quizId})` };

    try {
      const response = await fetch('/api/evaluate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ quizId: targetMeta.id, submissions }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.snapshot) {
        throw new Error(result?.error || 'The quiz could not be evaluated. Please try again.');
      }
      await saveAssessmentSnapshot(result.snapshot);
      router.push(isComparable ? '/student/before-after' : '/student/baseline/result');
    } catch (error) {
      submissionStartedRef.current = false;
      setSubmissionError(error instanceof Error ? error.message : 'The quiz could not be saved. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    submitHandlerRef.current = handleSubmit;
  });

  useEffect(() => {
    if (timeRemainingSeconds === 0) void submitHandlerRef.current?.();
  }, [timeRemainingSeconds]);

  const answeredCount = Object.values(answers).filter((a) => a.trim() !== '').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {submissionError && <div className="mx-auto mt-4 w-full max-w-3xl px-4 text-sm text-rose-700 dark:text-rose-300" role="alert">{submissionError}</div>}
      {/* Test Header */}
      <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {isComparable ? 'Comparable Mastery Retest' : isExam ? 'Class 9 Timed Assessment' : 'Class 9 Timed Quiz'}
            </h2>
            <span className="text-[11px] text-slate-500">
              Question {currentIndex + 1} of {totalQuestions} • {answeredCount} Answered
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold">
            <Clock className="w-4 h-4 text-indigo-500" />
            <span>{formatTime(timeRemainingSeconds)}</span>
          </div>
          <Button size="sm" variant="primary" onClick={() => setIsSubmitModalOpen(true)}>
            Submit Quiz
          </Button>
        </div>
      </header>

      {/* Test Canvas */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 flex flex-col justify-between">
          <Card className="p-6 sm:p-8 flex-1 flex flex-col justify-between shadow-md">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                <div className="flex items-center gap-2">
                  <Badge variant="primary" size="md">
                    Question {currentIndex + 1}
                  </Badge>
                  <Badge variant="secondary" size="sm">
                    {currentQ.type}
                  </Badge>
                </div>

                <button
                  onClick={() =>
                    setMarkedForReview((prev) => ({
                      ...prev,
                      [currentQ.id]: !prev[currentQ.id],
                    }))
                  }
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                    isMarked
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>{isMarked ? 'Marked' : 'Mark for Review'}</span>
                </button>
              </div>

              <div className="space-y-3 mb-8">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                  <MixedMathText text={currentQ.questionText} />
                </h3>
                {currentQ.latex && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-center border border-slate-200 dark:border-slate-800">
                    <MathRenderer math={currentQ.latex} inline={false} />
                  </div>
                )}
              </div>

              {/* Input */}
              {currentQ.type === 'MCQ' || currentQ.type === 'TRUE_FALSE' ? (
                <div className="space-y-2.5">
                  {currentQ.options?.map((opt) => {
                    const isSelected = currentAnswer === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setAnswers((prev) => ({ ...prev, [currentQ.id]: opt.id }))}
                        className={`w-full p-4 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-100 font-semibold'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <span>{opt.text}</span>
                        {isSelected && <CheckCircle className="w-5 h-5 text-indigo-600" />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-500">
                    Your final answer:
                  </label>
                  <input
                    type="text"
                    value={currentAnswer}
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [currentQ.id]: e.target.value }))
                    }
                    placeholder="e.g. 5, 115, 6..."
                    className="w-full text-base font-mono p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              )}
            </div>

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
              {currentIndex < totalQuestions - 1 ? (
                <Button size="sm" onClick={() => setCurrentIndex((prev) => prev + 1)} rightIcon={<ChevronRight className="w-4 h-4" />}>
                  Next
                </Button>
              ) : (
                <Button size="sm" variant="primary" onClick={() => setIsSubmitModalOpen(true)}>
                  Submit
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* Palette */}
        <Card className="p-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
            Question Palette
          </h4>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => {
              const isAns = answers[q.id]?.trim() !== '';
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-10 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    isCurrent
                      ? 'ring-2 ring-indigo-500'
                      : isAns
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Submit Quiz?"
      >
        <div className="space-y-4 text-xs">
          <p>
            You have answered <strong>{answeredCount}</strong> of <strong>{totalQuestions}</strong> questions.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" size="sm" onClick={() => setIsSubmitModalOpen(false)}>
              Resume
            </Button>
            <Button variant="primary" size="sm" isLoading={isSubmitting} onClick={handleSubmit}>
              Confirm Submit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
