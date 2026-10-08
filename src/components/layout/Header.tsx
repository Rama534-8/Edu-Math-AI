'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '../ui/Button';
import {
  Flame,
  Zap,
  Sparkles,
  TrendingUp,
  Target,
} from 'lucide-react';

export const Header: React.FC<{ title?: string; subtitle?: string }> = ({
  title,
  subtitle,
}) => {
  const { studentProfile, role } = useAuth();

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          {title || 'Mathematics Learning Center'}
        </h1>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {/* Student Badges & Quick AI Actions */}
      {role === 'STUDENT' && studentProfile && (
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Daily Goal Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Target className="w-4 h-4 text-indigo-500" />
            <span>Daily: 1 Quiz / 10 Qs</span>
          </div>

          {/* Streak Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800/80 text-xs font-bold text-orange-600 dark:text-orange-400">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-bounce" />
            <span>{studentProfile.streakDays} Day Streak</span>
          </div>

          {/* XP & Level Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/80 text-xs font-bold text-purple-700 dark:text-purple-300">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>
              {studentProfile.xp} XP (Lvl {studentProfile.level})
            </span>
          </div>

          {/* Quick AI Links */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-700">
            <Link href="/student/mistake-detective">
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-amber-300 dark:border-amber-700 bg-amber-50/50 hover:bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300"
                leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-500" />}
              >
                Mistake Detective
              </Button>
            </Link>
            <Link href="/student/before-after">
              <Button
                variant="primary"
                size="sm"
                className="text-xs"
                leftIcon={<TrendingUp className="w-3.5 h-3.5" />}
              >
                Before & After
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
