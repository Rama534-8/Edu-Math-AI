'use client';

import React, { useEffect, useState } from 'react';
import { Activity, BarChart3, TrendingUp, Users } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

type ParentPanelMode = 'activity' | 'before-after' | 'progress';

type ChildReport = {
  id: string;
  displayName: string;
  className: string;
  accuracy: number | null;
  questionsAttempted: number;
  correctAnswers: number;
  incorrectAnswers: number;
  beforeScore: number | null;
  afterScore: number | null;
  improvement: number | null;
  latestAssessment: number | null;
  chapters: { id: string; attempted: number; accuracy: number }[];
};

type ParentReport = {
  children: ChildReport[];
  recentActivities: { id: string; activityType: string; createdAt: string; studentName: string }[];
};

const titleMap: Record<ParentPanelMode, string> = {
  activity: 'Student Activity Overview',
  'before-after': 'Before & After Trend',
  progress: 'Learning Progress Snapshot',
};

const subtitleMap: Record<ParentPanelMode, string> = {
  activity: 'Recorded activity from your linked students.',
  'before-after': 'Compare completed assessments against the saved baseline.',
  progress: 'Assessment results and chapter performance from linked students.',
};

export const ParentReportPanel: React.FC<{ mode: ParentPanelMode }> = ({ mode }) => {
  const [report, setReport] = useState<ParentReport | null>(null);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const loadReport = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch('/api/parent/children', { credentials: 'same-origin' });
        if (!response.ok) throw new Error('Unable to load linked student reports.');
        const data = await response.json() as ParentReport;
        if (cancelled) return;
        setReport(data);
        setSelectedChildId((current) =>
          data.children.some((child) => child.id === current) ? current : data.children[0]?.id ?? ''
        );
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load reports.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadReport();
    return () => { cancelled = true; };
  }, []);

  const children = report?.children ?? [];
  const selectedChild = children.find((child) => child.id === selectedChildId) ?? null;
  const chapterRows = selectedChild?.chapters ?? [];
  const weakChapters = [...chapterRows].filter((chapter) => chapter.attempted > 0)
    .sort((a, b) => a.accuracy - b.accuracy).slice(0, 3);
  const activityRows = report?.recentActivities ?? [];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Parent dashboard</p>
            <h2 className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">{titleMap[mode]}</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitleMap[mode]}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="info" size="sm">{children.length} linked student(s)</Badge>
            {children.length > 1 && (
              <label className="text-xs text-slate-600 dark:text-slate-300">
                <span className="sr-only">Select student</span>
                <select
                  value={selectedChildId}
                  onChange={(event) => setSelectedChildId(event.target.value)}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                >
                  {children.map((child) => <option key={child.id} value={child.id}>{child.displayName}</option>)}
                </select>
              </label>
            )}
          </div>
        </div>
      </Card>

      {loading ? (
        <Card className="p-8 text-sm text-slate-500">Loading linked student reports...</Card>
      ) : error ? (
        <Card className="p-8 text-sm text-rose-700 dark:text-rose-300" role="alert">{error}</Card>
      ) : children.length === 0 ? (
        <Card className="p-8 text-sm text-slate-500">No students are linked to this parent account yet.</Card>
      ) : mode === 'activity' ? (
        <Card className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            <Activity className="h-4 w-4 text-indigo-500" /> Recent activity
          </h3>
          {activityRows.length ? (
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {activityRows.map((activity) => (
                <li key={activity.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <span className="font-medium text-slate-800 dark:text-slate-200">{activity.studentName} · {activity.activityType.toLowerCase()}</span>
                  <time className="text-xs text-slate-500" dateTime={activity.createdAt}>{new Date(activity.createdAt).toLocaleString()}</time>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-slate-500">No activity has been recorded for linked students yet.</p>}
        </Card>
      ) : mode === 'before-after' ? (
        <Card className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            <TrendingUp className="h-4 w-4 text-emerald-500" /> {selectedChild?.displayName}
          </h3>
          {selectedChild?.beforeScore === null || selectedChild?.beforeScore === undefined ? (
            <p className="text-sm text-slate-500">Complete a baseline assessment to unlock this comparison.</p>
          ) : selectedChild.afterScore === null ? (
            <p className="text-sm text-slate-500">Complete another assessment to measure improvement from the baseline.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Metric label="Baseline" value={`${selectedChild.beforeScore}%`} />
              <Metric label="Latest assessment" value={`${selectedChild.afterScore}%`} />
              <Metric label="Change" value={`${selectedChild.improvement! > 0 ? '+' : ''}${selectedChild.improvement} pp`} />
            </div>
          )}
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Metric label="Questions attempted" value={selectedChild?.questionsAttempted ?? 0} icon={<Activity className="h-4 w-4 text-indigo-500" />} />
            <Metric label="Correct answers" value={selectedChild?.correctAnswers ?? 0} icon={<Users className="h-4 w-4 text-emerald-500" />} />
            <Metric label="Accuracy" value={selectedChild?.accuracy === null ? 'No results' : `${selectedChild?.accuracy}%`} icon={<BarChart3 className="h-4 w-4 text-amber-500" />} />
          </div>
          <Card className="p-6">
            <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-slate-100">Chapters needing practice</h3>
            {weakChapters.length ? (
              <ul className="space-y-3">
                {weakChapters.map((chapter) => (
                  <li key={chapter.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-700 dark:text-slate-300">{chapter.id}</span>
                    <span className="font-semibold text-amber-700 dark:text-amber-300">{chapter.accuracy}% · {chapter.attempted} attempted</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-slate-500">No chapter assessment results are available yet.</p>}
          </Card>
        </>
      )}
    </div>
  );
};

function Metric({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-slate-500">{label}</span>{icon}
      </div>
      <div className="mt-3 text-2xl font-black text-slate-900 dark:text-slate-100">{value}</div>
    </Card>
  );
}

export default ParentReportPanel;
