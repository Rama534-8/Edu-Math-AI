'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MathRenderer, MixedMathText } from '@/components/ui/MathRenderer';
import { analyzeMistakeWithAI } from '@/lib/ai-service';
import { MistakeAnalysisResult, Question } from '@/types';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  ArrowRight,
  BookOpen,
  Send,
  CheckCircle,
  Lightbulb,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function MistakeDetectivePage() {
  const [questionText, setQuestionText] = useState('Solve for x: 2x + 5 = 15');
  const [studentWorking, setStudentWorking] = useState('2x = 20, x = 10');
  const [correctAnswer, setCorrectAnswer] = useState('x = 5');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<MistakeAnalysisResult | null>(null);

  // Similar practice interactive state
  const [retestAnswer, setRetestAnswer] = useState('');
  const [retestFeedback, setRetestFeedback] = useState<string | null>(null);

  const predefinedExamples = [
    {
      label: 'Sign Transposition Error (2x + 5 = 15)',
      q: 'Solve for x: 2x + 5 = 15',
      ans: '2x = 20, so x = 10',
      correct: 'x = 5',
    },
    {
      label: 'Supplementary Angles Confusion (Linear Pair 65°)',
      q: 'Two angles form a linear pair. If one is 65°, find the other.',
      ans: '25° (subtracted 65 from 90°)',
      correct: '115°',
    },
    {
      label: 'Algebraic Identity Cross-Term Omission',
      q: 'Expand: (x + 3)²',
      ans: 'x² + 9 (missed 2ab term)',
      correct: 'x² + 6x + 9',
    },
  ];

  const handleRunAnalysis = async (q?: string, a?: string, c?: string) => {
    const targetQ = q || questionText;
    const targetAns = a || studentWorking;
    const targetCorr = c || correctAnswer;

    setIsLoading(true);
    setRetestFeedback(null);
    setRetestAnswer('');

    try {
      const result = await analyzeMistakeWithAI({
        questionText: targetQ,
        studentAnswer: targetAns,
        correctAnswer: targetCorr,
      });
      setAnalysisResult(result);
    } catch (e) {
      console.error(e);
      setAnalysisResult(null);
      alert(e instanceof Error ? e.message : 'Mistake Detective AI is temporarily unavailable. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyRetest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!analysisResult?.similarPracticeQuestion) return;
    const isCorrect =
      retestAnswer.trim().toLowerCase() ===
      analysisResult.similarPracticeQuestion.correctAnswer.toLowerCase();

    if (isCorrect) {
      setRetestFeedback('CORRECT');
      try {
        confetti({ particleCount: 60, spread: 60 });
      } catch (err) {
        console.log(err);
      }
    } else {
      setRetestFeedback('INCORRECT');
    }
  };

  return (
    <RoleGuard allowedRoles={['STUDENT']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />

        <div className="flex-1 flex">
          <Sidebar />

          <main className="flex-1 flex flex-col min-w-0">
            <Header
              title="AI Mistake Detective ⭐⭐⭐"
              subtitle="Identify why errors occurred, understand the underlying concept, and retest with similar practice"
            />

            <div className="p-6 max-w-6xl w-full mx-auto space-y-6">
              {/* Feature Intro Banner */}
              <Card className="p-6 bg-gradient-to-r from-amber-900/40 via-purple-950/40 to-slate-900 border-amber-500/30">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-lg font-bold text-white">
                        Evidence-Based Mathematical Error Diagnosis
                      </h2>
                      <Badge variant="warning" size="sm">
                        Class 9 Engine
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                      Instead of simply marking your answer wrong, the Mistake Detective classifies your slip-up into one of 10 mathematical categories, analyzes your cognitive reasoning, shows the correct algebraic step, and prompts an immediate similar retest!
                    </p>
                  </div>
                </div>
              </Card>

              {/* Quick Preset Selector */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Try Sample Competition Scenarios:
                </span>
                <div className="flex flex-wrap gap-2">
                  {predefinedExamples.map((ex, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setQuestionText(ex.q);
                        setStudentWorking(ex.ans);
                        setCorrectAnswer(ex.correct);
                        handleRunAnalysis(ex.q, ex.ans, ex.correct);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                      ⚡ {ex.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-500" />
                    1. Mathematical Question & Working
                  </h3>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Question Text
                    </label>
                    <input
                      type="text"
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      placeholder="e.g. Solve for x: 2x + 5 = 15"
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Student’s Answer / Submitted Working
                    </label>
                    <textarea
                      rows={3}
                      value={studentWorking}
                      onChange={(e) => setStudentWorking(e.target.value)}
                      placeholder="e.g. 2x = 20, x = 10 (added 5 instead of subtracting)"
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <Button
                    onClick={() => handleRunAnalysis()}
                    isLoading={isLoading}
                    className="w-full"
                    leftIcon={<Sparkles className="w-4 h-4" />}
                  >
                    Analyze Mistake with AI
                  </Button>
                </Card>

                {/* Classification Categories Legend */}
                <Card className="p-6">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-purple-500" />
                    10 Mathematical Mistake Categories
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    {[
                      { code: 'SIGN_ERROR', label: 'Sign & Transposition Error' },
                      { code: 'CALCULATION_ERROR', label: 'Arithmetic Carry/Borrow Error' },
                      { code: 'FORMULA_ERROR', label: 'Identity / Formula Misapplication' },
                      { code: 'CONCEPT_ERROR', label: 'Fundamental Conceptual Gap' },
                      { code: 'READING_ERROR', label: 'Misread Question Constraints' },
                      { code: 'UNIT_ERROR', label: 'Missing / Incorrect Units (cm, m²)' },
                      { code: 'LOGIC_ERROR', label: 'Flawed Deductive Proof Step' },
                      { code: 'CARELESS_ERROR', label: 'Transcription Slip' },
                      { code: 'TIMEOUT', label: 'Unfinished / Time Limit Exceeded' },
                      { code: 'UNKNOWN', label: 'Insufficient Evidence' },
                    ].map((cat) => (
                      <div
                        key={cat.code}
                        className={`p-2 rounded-lg border text-xs ${
                          analysisResult?.mistakeCategory === cat.code
                            ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-amber-400 font-bold'
                            : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {cat.label}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Analysis Result Card */}
              {analysisResult && (
                <Card className="p-6 sm:p-8 border-amber-300 dark:border-amber-800 shadow-xl space-y-6 animate-in fade-in zoom-in-95">
                  {/* Category Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 flex items-center justify-center font-bold">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Detected Mistake Category
                        </span>
                        <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                          {analysisResult.categoryLabel} ({analysisResult.mistakeCategory})
                        </h3>
                      </div>
                    </div>
                    <Badge variant="warning" size="md">
                      AI Diagnostic Verified
                    </Badge>
                  </div>

                  {/* 4 Detail Columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    {/* What went wrong & Why */}
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900">
                        <span className="font-bold text-rose-800 dark:text-rose-300 block mb-1">
                          ❌ 1. What Went Wrong:
                        </span>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                          <MixedMathText text={analysisResult.whatWentWrong} />
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                        <span className="font-bold text-amber-800 dark:text-amber-300 block mb-1">
                          🧠 2. Why It Happened (Cognitive Insight):
                        </span>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                          <MixedMathText text={analysisResult.whyItHappened} />
                        </p>
                      </div>
                    </div>

                    {/* Correct Approach & Concept */}
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                        <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                          ✅ 3. Correct Mathematical Method:
                        </span>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-2">
                          <MixedMathText text={analysisResult.correctApproach} />
                        </p>
                        {analysisResult.workedCorrectionSteps?.length > 0 && (
                          <div className="space-y-1 font-mono text-[11px] text-emerald-950 dark:text-emerald-200 pt-2 border-t border-emerald-200 dark:border-emerald-800">
                            {analysisResult.workedCorrectionSteps.map((st, sIdx) => (
                              <div key={sIdx}>• {st}</div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900">
                        <span className="font-bold text-indigo-800 dark:text-indigo-300 block mb-1">
                          📖 4. Concept to Revise:
                        </span>
                        <p className="text-slate-700 dark:text-slate-300 font-semibold">
                          {analysisResult.conceptToRevise}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Immediate Retest Question Section */}
                  {analysisResult.similarPracticeQuestion && (
                    <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <RotateCcw className="w-4 h-4 text-indigo-500" />
                          5. Retest Now (Solve this similar question to verify mastery):
                        </h4>
                        <Badge variant="primary" size="sm">
                          Instant Feedback
                        </Badge>
                      </div>

                      <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4">
                        <div className="text-sm font-semibold">
                          <MixedMathText
                            text={analysisResult.similarPracticeQuestion.questionText}
                          />
                        </div>

                        {analysisResult.similarPracticeQuestion.latex && (
                          <div className="p-3 bg-slate-950 rounded-xl text-center">
                            <MathRenderer
                              math={analysisResult.similarPracticeQuestion.latex}
                              inline={false}
                            />
                          </div>
                        )}

                        <form onSubmit={handleVerifyRetest} className="flex flex-col sm:flex-row gap-3">
                          <input
                            type="text"
                            value={retestAnswer}
                            onChange={(e) => setRetestAnswer(e.target.value)}
                            placeholder="Type your final answer..."
                            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <Button type="submit" size="sm" variant="primary">
                            Check My Retest
                          </Button>
                        </form>

                        {/* Retest Feedback Banner */}
                        {retestFeedback === 'CORRECT' && (
                          <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-600 text-emerald-300 text-xs flex items-center justify-between animate-in fade-in">
                            <span className="flex items-center gap-2 font-bold">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              Spot on! You avoided the mistake and mastered this step!
                            </span>
                            <span className="font-bold text-amber-300">+25 XP</span>
                          </div>
                        )}

                        {retestFeedback === 'INCORRECT' && (
                          <div className="p-3 rounded-xl bg-rose-950 border border-rose-600 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
                            <AlertTriangle className="w-4 h-4 text-rose-400" />
                            <span>
                              Not quite. Expected {analysisResult.similarPracticeQuestion.correctAnswer}. Remember: apply inverse signs when transposing!
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
