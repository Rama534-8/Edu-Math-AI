'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Sparkles, Target } from 'lucide-react';

interface DailyGoal {
  id: string;
  target_minutes: number;
  completed_minutes: number;
  goal_date: string;
}

function DailyGoalsPanel() {
  const [goal, setGoal] = useState<DailyGoal | null>(null);
  const [goalLoading, setGoalLoading] = useState(true);
  const [targetInput, setTargetInput] = useState('30');
  const [addMinutes, setAddMinutes] = useState('15');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/student/daily-goals')
      .then(r => r.json())
      .then(d => { if (d.goal) setGoal(d.goal); })
      .finally(() => setGoalLoading(false));
  }, []);

  const handleSetGoal = async () => {
    setSaving(true);
    const res = await fetch('/api/student/daily-goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetMinutes: parseInt(targetInput) }),
    });
    const d = await res.json();
    if (d.goal) setGoal(d.goal);
    setSaving(false);
  };

  const handleLogMinutes = async () => {
    if (!goal) return;
    setSaving(true);
    const newCompleted = goal.completed_minutes + parseInt(addMinutes);
    const res = await fetch('/api/student/daily-goals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completedMinutes: newCompleted }),
    });
    const d = await res.json();
    if (d.goal) setGoal(d.goal);
    setSaving(false);
  };

  const pct = goal ? Math.min(100, Math.round((goal.completed_minutes / goal.target_minutes) * 100)) : 0;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-indigo-500" />
        <h2 className="font-bold text-slate-900 dark:text-slate-100">Today&apos;s Study Goal</h2>
        <span className="text-xs text-slate-400 ml-auto">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
      </div>

      {goalLoading ? (
        <p className="text-sm text-slate-400">Loading...</p>
      ) : goal ? (
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">
              <span>{goal.completed_minutes} / {goal.target_minutes} min</span>
              <span>{pct}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
              <div
                className="bg-indigo-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${pct}% of daily goal completed`}
              />
            </div>
            {pct >= 100 && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">🎉 Goal reached! Great work today.</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select
              className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
              value={addMinutes}
              onChange={e => setAddMinutes(e.target.value)}
            >
              {[5, 10, 15, 20, 30, 45, 60].map(m => (
                <option key={m} value={m}>{m} min</option>
              ))}
            </select>
            <Button size="sm" onClick={handleLogMinutes} isLoading={saving} disabled={saving}>
              Log Study Time
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setGoal(null); setTargetInput(String(goal.target_minutes)); }}>
              Change Goal
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Set today&apos;s target (minutes)</label>
            <select
              className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
              value={targetInput}
              onChange={e => setTargetInput(e.target.value)}
            >
              {[15, 20, 30, 45, 60, 90, 120].map(m => (
                <option key={m} value={m}>{m} minutes</option>
              ))}
            </select>
          </div>
          <div className="flex items-end pb-0.5">
            <Button size="sm" onClick={handleSetGoal} isLoading={saving} disabled={saving}>
              Set Goal
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

interface ChapterResult {
  id: string;
  name: string;
  attempted: number;
  accuracy: number | null;
}

interface PlanDay {
  dayNumber: number;
  date: string;
  chapter: ChapterResult;
  targetQuestions: number;
  estimatedMinutes: number;
}

export default function StudyPlannerPage() {
  const [examDate, setExamDate] = useState('');
  const [availableDailyMinutes, setAvailableDailyMinutes] = useState(45);
  const [planDays, setPlanDays] = useState<PlanDay[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function generatePlan() {
    setError('');
    setPlanDays(null);
    if (!examDate) {
      setError('Choose your exam date to generate a study recommendation.');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(`${examDate}T00:00:00`);
    const daysUntilExam = Math.ceil((deadline.getTime() - today.getTime()) / 86_400_000);
    if (!Number.isFinite(daysUntilExam) || daysUntilExam < 1) {
      setError('Choose an exam date that is at least one day away.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/users/chapters', { credentials: 'same-origin' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load saved chapter performance.');

      const weakChapters = (data.chapters as ChapterResult[])
        .filter((chapter) => chapter.attempted > 0 && chapter.accuracy !== null)
        .sort((first, second) => (first.accuracy ?? 100) - (second.accuracy ?? 100))
        .slice(0, Math.min(7, daysUntilExam));

      const plan = weakChapters.map((chapter, index) => {
        const date = new Date(today);
        date.setDate(today.getDate() + index + 1);
        return {
          dayNumber: index + 1,
          date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          chapter,
          targetQuestions: Math.max(3, Math.floor(availableDailyMinutes / 5)),
          estimatedMinutes: availableDailyMinutes,
        };
      });
      setPlanDays(plan);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to generate a study recommendation.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <RoleGuard allowedRoles={['STUDENT']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex-1 flex">
          <Sidebar />
          <main className="flex flex-1 min-w-0 flex-col">
            <Header
              title="Mathematics Study Planner"
              subtitle="Recommendations are based on your saved chapter assessment attempts"
            />
            <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
              <DailyGoalsPanel />
              <Card className="p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-500" htmlFor="exam-date">Upcoming exam date</label>
                    <input
                      id="exam-date"
                      type="date"
                      value={examDate}
                      onChange={(event) => setExamDate(event.target.value)}
                      className="w-full rounded-md border border-slate-200 bg-white p-2.5 text-xs dark:border-slate-800 dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-500" htmlFor="daily-minutes">Available study time</label>
                    <select
                      id="daily-minutes"
                      value={availableDailyMinutes}
                      onChange={(event) => setAvailableDailyMinutes(Number(event.target.value))}
                      className="w-full rounded-md border border-slate-200 bg-white p-2.5 text-xs dark:border-slate-800 dark:bg-slate-900"
                    >
                      <option value={30}>30 minutes per day</option>
                      <option value={45}>45 minutes per day</option>
                      <option value={60}>60 minutes per day</option>
                      <option value={90}>90 minutes per day</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={generatePlan} isLoading={isLoading} size="sm" className="w-full" leftIcon={<Sparkles className="h-3.5 w-3.5" />}>
                      Generate recommendation
                    </Button>
                  </div>
                </div>
                {error && <p className="mt-4 text-sm text-rose-700 dark:text-rose-300" role="alert">{error}</p>}
              </Card>

              {planDays !== null && (planDays.length ? (
                <section className="space-y-3" aria-label="Recommended study schedule">
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Priority chapter recommendations</h2>
                  {planDays.map((day) => (
                    <Card key={day.chapter.id} className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
                      <div>
                        <p className="text-xs font-semibold text-slate-500">Day {day.dayNumber} · {day.date}</p>
                        <h3 className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">{day.chapter.name}</h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Saved accuracy: {day.chapter.accuracy}% across {day.chapter.attempted} answered questions
                        </p>
                      </div>
                      <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        {day.targetQuestions} practice questions · {day.estimatedMinutes} minutes
                      </div>
                    </Card>
                  ))}
                  <p className="text-xs text-slate-500">Recommendations are generated from saved assessments and are not a persisted schedule.</p>
                </section>
              ) : (
                <EmptyState
                  icon={<Sparkles className="h-6 w-6" />}
                  title="No chapter attempts to plan from"
                  description="Complete a baseline assessment or quiz first. The planner will then prioritize chapters using your actual saved accuracy."
                />
              ))}
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}