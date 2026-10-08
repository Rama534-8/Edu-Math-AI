'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { BoardType, MediumType } from '@/types';
import {
  GraduationCap,
  Target,
  Sparkles,
  ArrowRight,
  Languages,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';

export default function StudentOnboardingPage() {
  const router = useRouter();
  const { studentProfile, completeOnboarding } = useAuth();

  const [board, setBoard] = useState<BoardType>('CBSE');
  const [medium, setMedium] = useState<MediumType>('ENGLISH');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([
    'Master Class 9 Polynomials & Algebra',
    'Score 90%+ in Mathematics Annual Exam',
  ]);

  const availableGoals = [
    'Master Class 9 Polynomials & Algebra',
    'Score 90%+ in Mathematics Annual Exam',
    'Eliminate Sign & Arithmetic Calculation Errors',
    'Improve Speed on Geometry & Coordinate Geometry',
    'Prepare for NTSE / Olympiad Math Foundation',
    'Learn Math in Telugu Medium with Step-by-Step AI',
  ];

  const toggleGoal = (goal: string) => {
    if (selectedGoals.includes(goal)) {
      setSelectedGoals(selectedGoals.filter((g) => g !== goal));
    } else {
      setSelectedGoals([...selectedGoals, goal]);
    }
  };

  const handleStartBaseline = () => {
    completeOnboarding(board, medium, selectedGoals);
    router.push('/student/baseline');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-2xl mx-auto w-full">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
              1
            </span>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
              Profile Setup
            </span>
          </div>
          <div className="w-16 h-0.5 bg-slate-200 dark:bg-slate-800" />
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 font-bold text-xs flex items-center justify-center">
              2
            </span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Baseline Diagnostic
            </span>
          </div>
        </div>

        <Card className="p-8 shadow-xl">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 mx-auto flex items-center justify-center mb-3">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              Welcome to EduMathAI, {studentProfile?.displayName || 'Student'}!
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Personalize your Class 9 curriculum and goals. You will then start the baseline diagnostic assessment.
            </p>
          </div>

          <div className="space-y-6">
            {/* 1. Board Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-500" /> 1. Select Educational Board (Class 9)
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setBoard('CBSE')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    board === 'CBSE'
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      CBSE Board
                    </span>
                    {board === 'CBSE' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                  </div>
                  <span className="text-xs text-slate-500">NCERT Standard Curriculum</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBoard('AP_STATE_BOARD')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    board === 'AP_STATE_BOARD'
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      AP State Board
                    </span>
                    {board === 'AP_STATE_BOARD' && (
                      <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    )}
                  </div>
                  <span className="text-xs text-slate-500">SCERT Andhra Pradesh Syllabus</span>
                </button>
              </div>
            </div>

            {/* 2. Medium Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                <Languages className="w-4 h-4 text-purple-500" /> 2. Instruction Medium
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setMedium('ENGLISH')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    medium === 'ENGLISH'
                      ? 'border-purple-600 bg-purple-50/60 dark:bg-purple-950/40 ring-2 ring-purple-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      English Medium
                    </span>
                    {medium === 'ENGLISH' && (
                      <CheckCircle2 className="w-4 h-4 text-purple-600" />
                    )}
                  </div>
                  <span className="text-xs text-slate-500">Full English explanations</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMedium('TELUGU')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    medium === 'TELUGU'
                      ? 'border-purple-600 bg-purple-50/60 dark:bg-purple-950/40 ring-2 ring-purple-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      తెలుగు మాధ్యమం (Telugu)
                    </span>
                    {medium === 'TELUGU' && (
                      <CheckCircle2 className="w-4 h-4 text-purple-600" />
                    )}
                  </div>
                  <span className="text-xs text-slate-500">తెలుగు వివరణలతో గణితం</span>
                </button>
              </div>
            </div>

            {/* 3. Learning Goals */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-emerald-500" /> 3. Select Your Math Goals
              </label>
              <div className="space-y-2">
                {availableGoals.map((goal) => {
                  const isSelected = selectedGoals.includes(goal);
                  return (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => toggleGoal(goal)}
                      className={`w-full p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span>{goal}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                onClick={handleStartBaseline}
                className="w-full py-3.5 text-sm"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Save Profile & Start Baseline Assessment
              </Button>
              <p className="text-[11px] text-center text-slate-400 mt-2">
                *The diagnostic takes ~15 minutes and establishes your starting score snapshot.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
