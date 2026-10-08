'use client';

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useAuth } from '@/lib/auth-context';
import { Trophy, Star, Flame, Zap } from 'lucide-react';

interface BadgeWithStatus {
  code: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  category: string;
  unlocked: boolean;
  earnedAt: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  ASSESSMENT: '📝 Assessments',
  EXAM: '🏛️ Mock Exams',
  PRACTICE: '✏️ Practice',
  REVISION: '🔁 Smart Revision',
  STREAK: '🔥 Streaks',
  MILESTONE: '⭐ Milestones',
};

export default function AchievementsPage() {
  const { studentProfile } = useAuth();
  const xp = studentProfile?.xp ?? 0;
  const level = studentProfile?.level ?? 1;
  const streak = studentProfile?.streakDays ?? 0;

  const [badges, setBadges] = React.useState<BadgeWithStatus[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/student/achievements')
      .then((r) => r.json())
      .then((data) => {
        if (data.badges) setBadges(data.badges);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const totalCount = badges.length;
  const levelProgress = xp % 1000;

  const categorised = Object.entries(CATEGORY_LABELS).map(([key, label]) => ({
    key,
    label,
    badges: badges.filter((b) => b.category === key),
  }));

  return (
    <RoleGuard allowedRoles={['STUDENT']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex-1 flex">
          <Sidebar />
          <main className="flex-1 flex flex-col min-w-0">
            <Header
              title="Achievements Hub"
              subtitle={`${unlockedCount} of ${totalCount} badges earned`}
            />

            <div className="p-6 max-w-5xl w-full mx-auto space-y-6">

              {/* Hero Level Card */}
              <Card className="p-6 bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/30">
                      🏆
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-2xl font-black">Level {level} Math Explorer</h2>
                        <Badge variant="purple" size="sm">Active</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-300">
                        <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-amber-400" />{xp} XP</span>
                        <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-orange-400" />{streak}-day streak</span>
                        <span className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5 text-purple-400" />{unlockedCount} badges</span>
                      </div>
                    </div>
                  </div>
                  <div className="sm:w-64 space-y-2">
                    <div className="flex justify-between text-xs text-slate-300 font-semibold">
                      <span>Progress to Level {level + 1}</span>
                      <span>{levelProgress} / 1000 XP</span>
                    </div>
                    <ProgressBar value={levelProgress} max={1000} size="sm" showPercentage={false} />
                  </div>
                </div>
              </Card>

              {/* Overall badge progress */}
              <Card className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" />
                    Badge Collection
                  </h3>
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {unlockedCount} / {totalCount}
                  </span>
                </div>
                <ProgressBar value={unlockedCount} max={totalCount || 1} size="sm" showPercentage={false} />
              </Card>

              {/* Loading state */}
              {loading && (
                <p className="text-center text-sm text-slate-500 py-8">Loading your achievements…</p>
              )}

              {/* Categorised badge grids */}
              {!loading && categorised.map(({ key, label, badges: catBadges }) => (
                <div key={key} className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    {label}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {catBadges.map((b) => (
                      <Card
                        key={b.code}
                        className={`p-5 flex flex-col justify-between transition-all ${
                          b.unlocked
                            ? 'border-indigo-200 dark:border-indigo-800/60 bg-white dark:bg-slate-900 shadow-sm'
                            : 'opacity-50 bg-slate-50/80 dark:bg-slate-900/20 grayscale'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <span className="text-3xl">{b.icon}</span>
                            <Badge variant={b.unlocked ? 'success' : 'secondary'} size="sm">
                              {b.unlocked ? 'Unlocked' : 'Locked'}
                            </Badge>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {b.title}
                          </h4>
                          <p className="text-xs text-slate-500 leading-relaxed">{b.description}</p>
                          {b.unlocked && b.earnedAt && (
                            <p className="text-[10px] text-slate-400">
                              Earned {new Date(b.earnedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-amber-600 dark:text-amber-400">
                          +{b.xpReward} XP Reward
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
