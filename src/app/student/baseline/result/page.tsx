'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Brain,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Award,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function BaselineResultPage() {
  const { getLatestAssessmentSnapshot } = useAuth();
  const snapshot = getLatestAssessmentSnapshot();
  const confettiFiredRef = useRef(false);

  useEffect(() => {
    if (snapshot && !confettiFiredRef.current) {
      confettiFiredRef.current = true;
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        console.log(e);
      }
    }
  }, [snapshot]);

  if (!snapshot) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <Brain className="w-10 h-10 text-indigo-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 mb-2">No Assessment Result Found</h3>
          <p className="text-xs text-slate-500 mb-6">Complete an assessment to create your first performance snapshot.</p>
          <Link href="/student/baseline">
            <Button size="sm">Start Baseline Diagnostic</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    return `${mins}m ${secs % 60}s`;
  };
  const isBaselineAssessment = snapshot.type === 'BASELINE' && !snapshot.isRetest;
  const isRetestAssessment = snapshot.isRetest || snapshot.type === 'RETEST';
  const isExamAssessment = snapshot.type === 'MOCK_EXAM';
  const xpAwarded = snapshot.correctCount * 15 + (isBaselineAssessment ? 100 : 50);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Celebration Card */}
        <Card className="p-8 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-950 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold mb-3">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                {snapshot.isRetest
                  ? `Retest Attempt ${snapshot.attemptNumber ?? 1}`
                  : isBaselineAssessment ? 'Immutable Baseline Diagnostic Record' : isExamAssessment ? 'Timed Exam Attempt' : 'Assessment Attempt'}
              </div>
              <h1 className="text-3xl font-black tracking-tight">
                {isRetestAssessment
                  ? 'Retest Completed!'
                  : isBaselineAssessment ? 'Baseline Assessment Completed!' : isExamAssessment ? 'Timed Assessment Completed!' : 'Quiz Completed!'}
              </h1>
              <p className="text-xs text-slate-300 mt-1 max-w-md">
                {isRetestAssessment
                  ? 'Your weak-topic retest result has been saved to your assessment history.'
                  : isBaselineAssessment
                    ? 'We have established your verified starting math baseline for Class 9.'
                    : isExamAssessment
                      ? 'Your timed assessment result has been saved to your assessment history.'
                      : 'Your evaluated quiz result has been saved to your assessment history.'}
              </p>
            </div>

            <div className="text-center md:text-right">
              <Badge variant={snapshot.resultStatus === 'PASS' ? 'success' : 'danger'} size="sm">
                {snapshot.resultStatus ?? 'RESULT UNAVAILABLE'}
              </Badge>
              <span className="text-xs text-slate-400 block my-2">
                {isRetestAssessment ? 'Retest Score' : isBaselineAssessment ? 'Starting Score' : isExamAssessment ? 'Exam Score' : 'Quiz Score'}
              </span>
              <div className="text-4xl font-black text-indigo-300">
                {snapshot.score} <span className="text-lg text-slate-400 font-normal">/ {snapshot.maxScore}</span>
              </div>
              <span className="text-xs font-semibold text-emerald-400">
                {snapshot.percentage}% Marks • {snapshot.accuracy}% Accuracy
              </span>
            </div>
          </div>
        </Card>

        {/* Core Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <Card className="p-4 text-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1.5" />
            <span className="text-xs text-slate-500 block">Total Questions</span>
            <span className="text-xl font-bold text-slate-800 dark:text-slate-200">{snapshot.totalQuestions}</span>
          </Card>

          <Card className="p-4 text-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1.5" />
            <span className="text-xs text-slate-500 block">Correct Answers</span>
            <span className="text-xl font-bold text-emerald-600">{snapshot.correctCount}</span>
          </Card>

          <Card className="p-4 text-center">
            <XCircle className="w-5 h-5 text-rose-500 mx-auto mb-1.5" />
            <span className="text-xs text-slate-500 block">Incorrect Answers</span>
            <span className="text-xl font-bold text-rose-600">{snapshot.incorrectCount}</span>
          </Card>

          <Card className="p-4 text-center">
            <Clock className="w-5 h-5 text-indigo-500 mx-auto mb-1.5" />
            <span className="text-xs text-slate-500 block">Time Taken</span>
            <span className="text-xl font-bold text-slate-800 dark:text-slate-200">
              {formatTime(snapshot.timeSpentSeconds)}
            </span>
          </Card>

          <Card className="p-4 text-center">
            <Award className="w-5 h-5 text-amber-500 mx-auto mb-1.5" />
            <span className="text-xs text-slate-500 block">XP Awarded</span>
              <span className="text-xl font-bold text-amber-600">+{xpAwarded} XP</span>
          </Card>
        </div>

        {/* Diagnostic Breakdown: Strong vs Needs Practice */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strong Areas */}
          <Card className="p-6 border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/20">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold text-xs">
                ✓
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Strong Foundation Areas
              </h3>
            </div>
            {snapshot.strongAreas.length > 0 ? (
              <ul className="space-y-2 text-xs">
                {snapshot.strongAreas.map((topic, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span>{topic}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500">
                Foundational concepts will rapidly improve with AI Tutor practice!
              </p>
            )}
          </Card>

          {/* Topics Needing Practice */}
          <Card className="p-6 border-amber-200 dark:border-amber-900/40 bg-amber-50/20">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 flex items-center justify-center font-bold text-xs">
                !
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Priority Topics Needing Practice
              </h3>
            </div>
            <ul className="space-y-2 text-xs">
              {snapshot.weakAreas.map((topic, idx) => (
                <li key={idx} className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  <span>{topic}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Identified Mistake Patterns */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Detected Mathematical Mistake Patterns
            </h3>
            <Badge variant="warning" size="sm">
              AI Detective Ready
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            {isRetestAssessment
              ? 'These mistake patterns were recorded in your retest answers:'
              : isBaselineAssessment
                ? 'These mistake patterns were recorded in your baseline answers:'
                : isExamAssessment
                  ? 'These mistake patterns were recorded in your timed assessment answers:'
                  : 'These mistake patterns were recorded in your quiz answers:'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {snapshot.commonMistakes.slice(0, 3).map((mKey, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
              >
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  {mKey.replace('_', ' ')}
                </span>
                <span className="text-[11px] text-slate-500">
                  {snapshot.mistakeBreakdown[mKey]} instance(s) detected
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Next Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 gap-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Ready to start your targeted learning journey?
            </h4>
            <p className="text-xs text-slate-500">
              {snapshot.recommendedNextAction || 'Practice weak topics, solve doubts with AI Tutor, and prepare for your measurable retest.'}
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {snapshot.resultStatus === 'FAIL' && snapshot.retestAvailable && (
              <Link href="/student/baseline?retest=1" className="w-full sm:w-auto">
                <Button variant="outline" size="sm" className="w-full">
                  Retest Weak Topics
                </Button>
              </Link>
            )}
            <Link href="/student/mistake-detective" className="w-full sm:w-auto">
              <Button variant="outline" size="sm" className="w-full">
                Try Mistake Detective
              </Button>
            </Link>
            <Link href="/student/dashboard" className="w-full sm:w-auto">
              <Button size="sm" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
