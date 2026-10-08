'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ChapterHeatmap } from '@/components/student/ChapterHeatmap';
import { LearningInsightsPanel } from '@/components/student/LearningInsightsPanel';
import {
  Brain,
  Sparkles,
  TrendingUp,
  Target,
  Flame,
  Zap,
  BookOpen,
  PenTool,
  HelpCircle,
  Camera,
  Bot,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Award,
  ChevronRight,
  FileCheck,
  Clock,
} from 'lucide-react';
import { LeaderboardItem, StreakDay } from '@/types';

export default function StudentDashboardPage() {
  const { studentProfile, getBaselineSnapshot, getLatestComparableSnapshot, getAssessmentSnapshots, getLatestAssessmentSnapshot } = useAuth();
  
  const [aiPlan, setAiPlan] = React.useState<any>(null);
  const [generatingPlan, setGeneratingPlan] = React.useState(false);
  const [planError, setPlanError] = React.useState('');

  React.useEffect(() => {
    fetch('/api/ai/planner')
      .then(res => res.json())
      .then(data => {
        if (data.plan) {
          setAiPlan(data.plan);
        }
      })
      .catch(() => {});
  }, []);

  const generateAiPlan = async () => {
    setGeneratingPlan(true);
    setPlanError('');
    try {
      const res = await fetch('/api/ai/planner', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate plan');
      setAiPlan(data.plan);
    } catch (err: any) {
      setPlanError(err.message);
    } finally {
      setGeneratingPlan(false);
    }
  };

  const baseline = getBaselineSnapshot();
  const latestSnapshot = getLatestAssessmentSnapshot() || getLatestComparableSnapshot();
  const allSnapshots = getAssessmentSnapshots();

  const currentAccuracy = latestSnapshot?.accuracy ?? baseline?.accuracy ?? null;
  const recordedWeakTopics = latestSnapshot?.weakAreas?.length
    ? latestSnapshot.weakAreas
    : baseline?.weakAreas ?? [];
  const questionsSolved = studentProfile?.questionsSolved || 0;
  const studyMins = studentProfile?.totalStudyMinutes || 0;
  const xp = studentProfile?.xp || 0;
  const level = studentProfile?.level || 1;
  const streak = studentProfile?.streakDays || 0;

  const { getLeaderboard, getStreakCalendar } = useAuth();
  const leaderboard = getLeaderboard();
  const myRank = leaderboard.find((l: LeaderboardItem) => l.id === studentProfile?.uid)?.rank || '-';
  const calendar = getStreakCalendar();
  const todayActive = calendar[calendar.length - 1]?.isActive;

  const currentScoreChange = latestSnapshot && baseline
    ? latestSnapshot.percentage - baseline.percentage
    : 0;
  const passedAssessments = allSnapshots.filter((snapshot) => snapshot.resultStatus === 'PASS').length;
  const failedAssessments = allSnapshots.filter((snapshot) => snapshot.resultStatus === 'FAIL').length;
  const retestsCompleted = allSnapshots.filter((snapshot) => snapshot.isRetest).length;
  const bestScore = allSnapshots.reduce((best, snapshot) => Math.max(best, snapshot.percentage), 0);
  const latestWeakChapters = latestSnapshot?.weakChapters?.length
    ? latestSnapshot.weakChapters
    : latestSnapshot?.weakAreas ?? [];
  const previousSnapshot = [...allSnapshots]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .find((snapshot) => snapshot.id !== latestSnapshot?.id) || null;
  const improvementFromPrevious = latestSnapshot && previousSnapshot
    ? latestSnapshot.percentage - previousSnapshot.percentage
    : 0;

  return (
    <RoleGuard allowedRoles={['STUDENT']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />

        <div className="flex-1 flex">
          <Sidebar />

          <main className="flex-1 flex flex-col min-w-0">
            <Header
              title={`Welcome back, ${studentProfile?.displayName || 'Student'}! 👋`}
              subtitle={`Class 9 • ${studentProfile?.board || 'CBSE'} (${studentProfile?.medium === 'TELUGU' ? 'తెలుగు' : 'English'})`}
            />

            <div className="p-6 space-y-8 max-w-7xl w-full mx-auto">
              {/* Top Banner: Quick Improvement & Action Highlight */}
              <Card className="p-6 bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white shadow-xl relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Class 9 Active Diagnostic Cycle
                    </div>
                    <h2 className="text-2xl font-black tracking-tight">
                      {latestSnapshot
                        ? `Learning Growth: +${currentScoreChange} Percentage Points`
                        : baseline
                        ? 'Baseline Established: Ready for Targeted Practice'
                        : 'Welcome! Take Your Baseline Diagnostic Test'}
                    </h2>
                    <p className="text-xs text-slate-300 max-w-xl">
                      {recordedWeakTopics.length > 0
                        ? `Focus on your recorded weak areas: ${recordedWeakTopics.slice(0, 3).join(', ')}.`
                        : 'Complete an assessment to get recommendations based on your results.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    {!baseline ? (
                      <Link href="/student/baseline">
                        <Button
                          size="sm"
                          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-none"
                          leftIcon={<Sparkles className="w-3.5 h-3.5 text-slate-950" />}
                        >
                          Start Diagnostic Assessment
                        </Button>
                      </Link>
                    ) : (
                      <>
                        <Link href="/student/mistake-detective">
                          <Button
                            size="sm"
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-none"
                            leftIcon={<Sparkles className="w-3.5 h-3.5 text-slate-950" />}
                          >
                            AI Mistake Detective
                          </Button>
                        </Link>
                        <Link href="/student/learn">
                          <Button
                            size="sm"
                            className="bg-white text-indigo-900 hover:bg-slate-100 font-bold border-none"
                            leftIcon={<BookOpen className="w-3.5 h-3.5 text-indigo-900" />}
                          >
                            Continue Learning
                          </Button>
                        </Link>
                        <Link href="/student/before-after">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="border border-white/30 text-white hover:bg-white/10"
                            leftIcon={<TrendingUp className="w-3.5 h-3.5" />}
                          >
                            Before & After
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </Card>

              <Card className="p-5 bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 text-white">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200">Result / Performance</span>
                  <Award className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-3xl font-black mb-1">{latestSnapshot ? `${latestSnapshot.percentage}%` : 'Not assessed'}</div>
                <div className="flex items-center gap-2 text-xs text-slate-200 mb-3">
                  <span className={`inline-flex rounded-full px-2 py-1 font-bold ${latestSnapshot?.resultStatus === 'PASS' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                    {latestSnapshot?.resultStatus || 'PENDING'}
                  </span>
                  <span>{latestSnapshot ? `${latestSnapshot.score}/${latestSnapshot.maxScore}` : 'No attempt yet'}</span>
                </div>
                <div className="space-y-2 text-[11px] text-slate-300">
                  <div>Passed: {passedAssessments}</div>
                  <div>Failed: {failedAssessments}</div>
                  <div>Retests: {retestsCompleted}</div>
                  <div>Best score: {bestScore}%</div>
                </div>
              </Card>

              {/* 5 Core Performance KPI Cards (Adjusted grid) */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <Card className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-500">Overall Accuracy</span>
                    <Target className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-1">
                    {currentAccuracy === null ? 'Not tested' : `${currentAccuracy}%`}
                  </div>
                  {currentAccuracy !== null && (
                    <ProgressBar value={currentAccuracy} size="sm" showPercentage={false} />
                  )}
                </Card>

                <Card className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-500">Questions Solved</span>
                    <PenTool className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-1">
                    {questionsSolved}
                  </div>
                </Card>

                <Card className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-500">Total Study Time</span>
                    <Clock className="w-4 h-4 text-sky-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-1">
                    {Math.round(studyMins / 60)}h {studyMins % 60}m
                  </div>
                  <span className="text-[11px] text-slate-400">Class 9 CBSE / AP</span>
                </Card>

                <Card className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-500">Leaderboard Rank</span>
                    <Award className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-1">
                    #{myRank}
                  </div>
                  <Link href="/student/leaderboard">
                    <span className="text-[11px] text-indigo-600 hover:underline font-semibold">View Leaderboard</span>
                  </Link>
                </Card>

                <Card className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-500">Learning Streak</span>
                    <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                  </div>
                  <div className="text-2xl font-black text-orange-600 mb-1">
                    {streak} Days
                  </div>
                  {todayActive ? (
                    <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Today: Completed
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Today: Incomplete
                    </span>
                  )}
                  
                  {/* Mini Calendar */}
                  <div className="flex gap-1 mt-3 justify-between">
                    {calendar.map((day: StreakDay) => (
                      <div key={day.date} className="flex flex-col items-center">
                        <span className="text-[8px] text-slate-400 uppercase">{day.dayName.charAt(0)}</span>
                        <div className={`w-3 h-3 rounded-full mt-1 ${day.isActive ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-800'}`} />
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Quick Action Dock */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Quick Learning Actions
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  {[
                    { label: 'Learn', path: '/student/learn', icon: BookOpen, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50' },
                    { label: 'Practice', path: '/student/practice', icon: PenTool, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/50' },
                    { label: 'Quizzes', path: '/student/quizzes', icon: HelpCircle, color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/50' },
                    { label: 'Rankings', path: '/student/leaderboard', icon: Award, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50' },
                    { label: 'AI Tutor', path: '/student/ai-tutor', icon: Bot, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50' },
                    { label: 'AI Solver', path: '/student/ai-solver', icon: Camera, color: 'text-pink-600 bg-pink-50 dark:bg-pink-950/50' },
                    { label: 'Revision', path: '/student/revision', icon: RotateCcw, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50' },
                    { label: 'Before-After', path: '/student/before-after', icon: TrendingUp, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/50' },
                  ].map((act) => {
                    const Icon = act.icon;
                    return (
                      <Link key={act.label} href={act.path}>
                        <Card hoverEffect className="p-3 text-center flex flex-col items-center justify-center gap-2 cursor-pointer">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${act.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {act.label}
                          </span>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <ChapterHeatmap />

              {/* Your Learning Insights — weakness analysis + personalised learning path */}
              <LearningInsightsPanel />

              {/* AI Study Plan Section */}
              <Card className="p-6 border-indigo-100 dark:border-indigo-900/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Your AI Study Plan
                    </h3>
                  </div>
                  <Button 
                    size="sm" 
                    variant={aiPlan ? "outline" : "primary"}
                    onClick={generateAiPlan} 
                    isLoading={generatingPlan}
                    leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                  >
                    {aiPlan ? "Regenerate Plan" : "Generate Today's Plan"}
                  </Button>
                </div>
                
                {planError && <p className="text-sm text-rose-600 mb-4">{planError}</p>}
                
                {aiPlan ? (
                  <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-semibold text-slate-500 mb-1">{aiPlan.date} • {aiPlan.estimatedMinutes} mins</p>
                      <p className="text-sm font-bold text-indigo-700 dark:text-indigo-400">"{aiPlan.goal}"</p>
                    </div>
                    
                    <div className="space-y-3">
                      {aiPlan.activities?.map((act: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between bg-white dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="info" size="sm">{act.type}</Badge>
                              <span className="text-xs font-semibold text-slate-500">{act.minutes} mins</span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{act.chapterTitle}</h4>
                            <p className="text-xs text-slate-500">{act.topicTitle}</p>
                          </div>
                          <Link href="/student/learn">
                            <Button size="sm" variant="ghost" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>Start</Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-slate-500 mb-3">No study plan for today. Let AI create a personalized schedule based on your weak areas.</p>
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Recommended next steps
                </h3>
                {recordedWeakTopics.length > 0 ? (
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Review {recordedWeakTopics[0]}, then try a practice set.
                    </p>
                    <Link href="/student/practice">
                      <Button size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                        Practice now
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">
                    Complete an assessment to receive recommendations based on your results.
                  </p>
                )}
              </Card>

                  {/* Level Progress & XP — 1000 XP per level matches evaluate-quiz + auth-context */}
                  <Card className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border-purple-100 dark:border-purple-900/40">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-purple-600" />
                        <h4 className="text-sm font-bold text-purple-950 dark:text-purple-200">
                          Level {level} Explorer
                        </h4>
                      </div>
                      <Badge variant="purple" size="sm">
                        {xp} XP
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">
                      {1000 - (xp % 1000)} XP to reach Level {level + 1}
                    </p>
                    <ProgressBar
                      value={xp % 1000}
                      max={1000}
                      size="sm"
                      color="indigo"
                      showPercentage={false}
                    />
                    <div className="mt-4 pt-3 border-t border-purple-200/60 dark:border-purple-800/60">
                      <Link
                        href="/student/achievements"
                        className="text-xs font-bold text-purple-700 dark:text-purple-300 hover:underline flex items-center justify-between"
                      >
                        <span>View Badges & Challenges</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </Card>
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
