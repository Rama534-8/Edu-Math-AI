'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MathRenderer, MixedMathText } from '@/components/ui/MathRenderer';
import { SAMPLE_QUESTIONS_BANK, CLASS_9_CHAPTERS } from '@/lib/curriculum-data';
import { useAuth } from '@/lib/auth-context';
import {
  PenTool,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Sparkles,
  RotateCcw,
  ArrowRight,
  Filter,
  Bot,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function PracticePage() {
  const { addXP, recordActivity, getLatestAssessmentSnapshot, getBaselineSnapshot } = useAuth();
  const [selectedDifficulty, setSelectedDifficulty] = useState<'ALL' | 'EASY' | 'MEDIUM' | 'HARD'>('ALL');
  const [practiceMode, setPracticeMode] = useState<'MIXED' | 'TOPIC' | 'MISTAKES' | 'DAILY'>('MIXED');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('ALL');
  const [qIndex, setQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionAttempted, setSessionAttempted] = useState(0);

  const latestSnapshot = getLatestAssessmentSnapshot() ?? getBaselineSnapshot();
  const weakTopicIds = React.useMemo(
    () =>
      new Set(
        (latestSnapshot?.topicPerformance ?? [])
          .filter((t) => t.accuracy < 70)
          .map((t) => t.topicId)
      ),
    [latestSnapshot]
  );
  const mistakeQuestionIds = React.useMemo(
    () =>
      new Set(
        (latestSnapshot?.evaluatedQuestions ?? [])
          .filter((q) => !q.isCorrect)
          .map((q) => q.questionId)
      ),
    [latestSnapshot]
  );

  const filteredQuestions = React.useMemo(() => {
    let base = [...SAMPLE_QUESTIONS_BANK];

    if (practiceMode === 'TOPIC') {
      if (selectedChapterId !== 'ALL') {
        base = base.filter((q) => q.chapterId === selectedChapterId);
      } else if (weakTopicIds.size > 0) {
        // Default topic drill to current weak topics so the mode is useful immediately.
        base = base.filter((q) => weakTopicIds.has(q.topicId));
        if (base.length === 0) base = [...SAMPLE_QUESTIONS_BANK];
      }
    } else if (practiceMode === 'MISTAKES') {
      if (mistakeQuestionIds.size > 0) {
        base = base.filter((q) => mistakeQuestionIds.has(q.id));
      } else if (weakTopicIds.size > 0) {
        base = base.filter((q) => weakTopicIds.has(q.topicId));
      }
      if (base.length === 0) base = [...SAMPLE_QUESTIONS_BANK];
    } else if (practiceMode === 'DAILY') {
      // Deterministic daily rotation so every student gets the same 5-a-day challenge.
      const today = new Date();
      const startOfYear = new Date(today.getFullYear(), 0, 0);
      const dayOfYear = Math.floor((today.getTime() - startOfYear.getTime()) / 86400000);
      const start = dayOfYear % SAMPLE_QUESTIONS_BANK.length;
      const rotated = [...SAMPLE_QUESTIONS_BANK.slice(start), ...SAMPLE_QUESTIONS_BANK.slice(0, start)];
      base = rotated.slice(0, 5);
    }

    if (selectedDifficulty !== 'ALL') {
      const byDifficulty = base.filter((q) => q.difficulty === selectedDifficulty);
      // Never strand the learner on an empty list after combining mode + difficulty.
      if (byDifficulty.length > 0) return byDifficulty;
    }
    return base;
  }, [practiceMode, selectedChapterId, selectedDifficulty, weakTopicIds, mistakeQuestionIds]);

  // Keep the cursor inside the list whenever the filter signature changes.
  React.useEffect(() => {
    setQIndex(0);
    setSelectedAnswer('');
    setIsAnswerChecked(false);
    setIsCorrect(false);
    setShowHint(false);
  }, [practiceMode, selectedDifficulty, selectedChapterId]);

  const safeIndex = filteredQuestions.length > 0 ? qIndex % filteredQuestions.length : 0;
  const currentQ = filteredQuestions[safeIndex] ?? SAMPLE_QUESTIONS_BANK[0];

  const isChoice = currentQ.type === 'MCQ' || currentQ.type === 'TRUE_FALSE';
  const normalize = (v: string) => v.trim().toLowerCase().replace(/\s+/g, ' ');
  const handleCheckAnswer = () => {
    if (!selectedAnswer.trim() || isAnswerChecked) return;
    const correct = isChoice
      ? selectedAnswer === currentQ.correctAnswer
      : normalize(selectedAnswer) === normalize(currentQ.correctAnswer);
    setIsCorrect(correct);
    setIsAnswerChecked(true);
    setSessionAttempted((c) => c + 1);
    if (correct) setSessionCorrect((c) => c + 1);

    if (correct) {
      addXP(15);
      recordActivity('PRACTICE');
      try {
        confetti({ particleCount: 50, spread: 60 });
      } catch (e) {
        console.log(e);
      }
    }
  };

  const handleNext = () => {
    setIsAnswerChecked(false);
    setSelectedAnswer('');
    setShowHint(false);
    setQIndex((prev) => (filteredQuestions.length > 0 ? (prev + 1) % filteredQuestions.length : 0));
  };

  const handleModeChange = (mode: 'MIXED' | 'TOPIC' | 'MISTAKES' | 'DAILY') => {
    setPracticeMode(mode);
    // qIndex reset is handled by the filter-signature effect.
  };

  return (
    <RoleGuard allowedRoles={['STUDENT']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />

        <div className="flex-1 flex">
          <Sidebar />

          <main className="flex-1 flex flex-col min-w-0">
            <Header
              title="Class 9 Mathematics Practice Engine"
              subtitle="Adaptive Practice, Topic Drills, and Instant Pedagogical Guidance"
            />

            <div className="p-6 max-w-5xl w-full mx-auto space-y-6">
              {/* Practice Mode & Filter Selector */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                {/* Modes */}
                <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
                  {[
                    { key: 'MIXED', label: 'Mixed Practice' },
                    { key: 'TOPIC', label: 'Topic Drill' },
                    { key: 'MISTAKES', label: 'Previous Mistakes' },
                    { key: 'DAILY', label: 'Daily Challenge' },
                  ].map((m) => (
                    <button
                      key={m.key}
                      onClick={() => handleModeChange(m.key as 'MIXED' | 'TOPIC' | 'MISTAKES' | 'DAILY')}
                      className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                        practiceMode === m.key
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Difficulty Filter */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 font-semibold whitespace-nowrap">
                    {sessionAttempted > 0
                      ? `Session: ${sessionCorrect}/${sessionAttempted} correct`
                      : `${filteredQuestions.length} questions`}
                  </span>
                  {practiceMode === 'TOPIC' && (
                    <select
                      value={selectedChapterId}
                      onChange={(e) => setSelectedChapterId(e.target.value)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 max-w-[180px]"
                      aria-label="Filter by chapter"
                    >
                      <option value="ALL">All chapters (weak topics first)</option>
                      {CLASS_9_CHAPTERS.map((ch) => (
                        <option key={ch.id} value={ch.id}>
                          {ch.title}
                        </option>
                      ))}
                    </select>
                  )}
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value as 'ALL' | 'EASY' | 'MEDIUM' | 'HARD')}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300"
                  >
                    <option value="ALL">All Difficulties</option>
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
              </div>

              {/* Mode explainer */}
              <div className="text-xs text-slate-500 dark:text-slate-400 -mt-3 px-1">
                {practiceMode === 'MIXED' && 'Mixed Practice cycles through the full Class 9 question bank.'}
                {practiceMode === 'TOPIC' &&
                  (weakTopicIds.size > 0
                    ? `Topic Drill is focused on your ${weakTopicIds.size} weak topic${weakTopicIds.size === 1 ? '' : 's'} from your latest assessment. Pick a chapter to override.`
                    : 'Topic Drill: pick a chapter to focus your practice.')}
                {practiceMode === 'MISTAKES' &&
                  (mistakeQuestionIds.size > 0
                    ? `Previous Mistakes replays the ${mistakeQuestionIds.size} question${mistakeQuestionIds.size === 1 ? '' : 's'} you got wrong last time.`
                    : 'Previous Mistakes replays your weak topics until you have a graded assessment to learn from.')}
                {practiceMode === 'DAILY' && 'Daily Challenge is a deterministic 5-question rotation that changes every day.'}
              </div>

              {/* Active Practice Question Card */}
              <Card className="p-6 sm:p-8 space-y-6 shadow-lg">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Badge variant="primary" size="md">
                      Question {safeIndex + 1} of {filteredQuestions.length}
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
                    <Badge variant="secondary" size="sm">
                      {currentQ.type}
                    </Badge>
                  </div>

                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Lightbulb className="w-4 h-4" />
                    <span>{showHint ? 'Hide Hint' : 'Need a Hint?'}</span>
                  </button>
                </div>

                {/* Hint Pill */}
                {showHint && (
                  <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 animate-in fade-in">
                    <strong>💡 AI Pedagogical Hint:</strong> {currentQ.hint1}
                  </div>
                )}

                {/* Question Text */}
                <div className="space-y-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                    <MixedMathText text={currentQ.questionText} />
                  </h3>
                  {currentQ.questionTextTelugu && (
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                      {currentQ.questionTextTelugu}
                    </p>
                  )}
                  {currentQ.latex && (
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl text-center my-3 border border-slate-200 dark:border-slate-800">
                      <MathRenderer math={currentQ.latex} inline={false} />
                    </div>
                  )}
                </div>

                {/* Input Options */}
                {currentQ.type === 'MCQ' || currentQ.type === 'TRUE_FALSE' ? (
                  <div className="space-y-2.5">
                    {currentQ.options?.map((opt) => {
                      const isSelected = selectedAnswer === opt.id;
                      return (
                        <button
                          key={opt.id}
                          disabled={isAnswerChecked}
                          onClick={() => setSelectedAnswer(opt.id)}
                          className={`w-full p-4 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 ring-2 ring-indigo-500/20 text-indigo-950 dark:text-indigo-100'
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
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-500">
                      Enter numerical value or simplified answer:
                    </label>
                    <input
                      type="text"
                      disabled={isAnswerChecked}
                      value={selectedAnswer}
                      onChange={(e) => setSelectedAnswer(e.target.value)}
                      placeholder="e.g. 5, 115, 6..."
                      className="w-full text-base font-mono p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}

                {/* Feedback Box if Checked */}
                {isAnswerChecked && (
                  <div
                    className={`p-5 rounded-2xl border text-xs space-y-3 animate-in fade-in ${
                      isCorrect
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                        : 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        {isCorrect ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            <span>Correct! Excellent mathematical reasoning!</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-rose-600" />
                            <span>Incorrect Answer</span>
                          </>
                        )}
                      </div>
                      {isCorrect && (
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          +15 XP Earned
                        </span>
                      )}
                    </div>

                    <p className="leading-relaxed">
                      <strong>Explanation:</strong> {currentQ.correctAnswerExplanation}
                    </p>

                    {!isCorrect && (
                      <div className="pt-2 border-t border-rose-200 dark:border-rose-800 flex items-center justify-between">
                        <span className="text-slate-600 dark:text-slate-400">
                          Want to diagnose why you made this error?
                        </span>
                        <Link href="/student/mistake-detective">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs border-amber-400 text-amber-800 dark:text-amber-300 bg-amber-50/50"
                            leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                          >
                            Open in Mistake Detective
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions Bottom Bar */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Link href="/student/ai-tutor">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-indigo-600"
                      leftIcon={<Bot className="w-3.5 h-3.5" />}
                    >
                      Ask AI Tutor about this question
                    </Button>
                  </Link>

                  <div className="flex items-center gap-2">
                    {!isAnswerChecked ? (
                      <Button
                        size="sm"
                        disabled={!selectedAnswer.trim()}
                        onClick={handleCheckAnswer}
                      >
                        Check Answer
                      </Button>
                    ) : (
                      <Button size="sm" onClick={handleNext} rightIcon={<ArrowRight className="w-4 h-4" />}>
                        Next Question
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
