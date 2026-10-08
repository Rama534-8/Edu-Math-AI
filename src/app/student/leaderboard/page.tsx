'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Award, Flame, Target, Trophy, Sparkles } from 'lucide-react';
import { LeaderboardItem } from '@/types';

export default function StudentLeaderboardPage() {
  const { studentProfile, getLeaderboard } = useAuth();
  const leaderboard = getLeaderboard();
  
  return (
    <RoleGuard allowedRoles={['STUDENT']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />

        <div className="flex-1 flex">
          <Sidebar />

          <main className="flex-1 flex flex-col min-w-0">
            <Header
              title="Global Leaderboard 🏆"
              subtitle="Compete with your peers and track your progress"
            />

            <div className="p-6 space-y-6 max-w-4xl w-full mx-auto">
              {leaderboard.length === 0 ? (
                <Card className="p-12 text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-500 mb-4">
                    <Trophy className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">No Students on the Leaderboard Yet</h3>
                  <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
                    Be the first to solve quizzes, complete practice sets, and earn XP to claim the #1 spot on the leaderboard!
                  </p>
                  <Link href="/student/practice">
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                      <Sparkles className="w-4 h-4" /> Start Practicing Now
                    </Button>
                  </Link>
                </Card>
              ) : (
                <>
                  {/* Top Podium Section */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end mb-8">
                    {/* 2nd Place */}
                    {leaderboard[1] ? (
                      <Card className="p-4 flex flex-col items-center bg-gradient-to-t from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-2 border-slate-300 dark:border-slate-700 h-[140px] justify-end relative order-2 sm:order-1">
                        <div className="absolute -top-6 w-12 h-12 bg-slate-300 dark:bg-slate-700 rounded-full flex items-center justify-center text-xl font-bold shadow-lg ring-4 ring-white dark:ring-slate-950">🥈</div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-center text-sm truncate max-w-full px-2">{leaderboard[1].displayName}</span>
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-1">{leaderboard[1].xp} XP</span>
                      </Card>
                    ) : (
                      <div className="hidden sm:block order-2 sm:order-1" />
                    )}
                    
                    {/* 1st Place */}
                    {leaderboard[0] && (
                      <Card className="p-4 flex flex-col items-center bg-gradient-to-t from-amber-200 to-amber-50 dark:from-amber-900/40 dark:to-amber-900/10 border-2 border-amber-400 dark:border-amber-500 h-[170px] justify-end relative shadow-amber-500/20 shadow-xl order-1 sm:order-2">
                        <div className="absolute -top-8 w-16 h-16 bg-amber-400 dark:bg-amber-500 rounded-full flex items-center justify-center text-3xl font-bold shadow-lg ring-4 ring-white dark:ring-slate-950">🥇</div>
                        <span className="font-bold text-amber-900 dark:text-amber-100 text-center text-base truncate max-w-full px-2">{leaderboard[0].displayName}</span>
                        <span className="text-sm font-black text-amber-700 dark:text-amber-400 mt-1">{leaderboard[0].xp} XP</span>
                      </Card>
                    )}
                    
                    {/* 3rd Place */}
                    {leaderboard[2] ? (
                      <Card className="p-4 flex flex-col items-center bg-gradient-to-t from-orange-200 to-orange-100 dark:from-orange-950/60 dark:to-orange-900/20 border-2 border-orange-300 dark:border-orange-800 h-[120px] justify-end relative order-3">
                        <div className="absolute -top-5 w-10 h-10 bg-orange-300 dark:bg-orange-800 rounded-full flex items-center justify-center text-lg font-bold shadow-lg ring-4 ring-white dark:ring-slate-950">🥉</div>
                        <span className="font-bold text-orange-900 dark:text-orange-100 text-center text-xs truncate max-w-full px-2">{leaderboard[2].displayName}</span>
                        <span className="text-xs font-bold text-orange-700 dark:text-orange-400 mt-1">{leaderboard[2].xp} XP</span>
                      </Card>
                    ) : (
                      <div className="hidden sm:block order-3" />
                    )}
                  </div>

                  {/* Leaderboard List */}
                  <Card className="overflow-hidden">
                    <div className="p-4 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <div className="w-16 text-center">Rank</div>
                      <div className="flex-1">Student</div>
                      <div className="w-24 text-right">Streak</div>
                      <div className="w-24 text-right">Solved</div>
                      <div className="w-24 text-right text-indigo-600 dark:text-indigo-400">XP</div>
                    </div>
                    
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                      {leaderboard.map((student: LeaderboardItem) => (
                        <div 
                          key={student.id} 
                          className={`flex items-center p-4 text-sm transition-colors ${
                            student.id === studentProfile?.uid 
                              ? 'bg-indigo-50/50 dark:bg-indigo-900/20 hover:bg-indigo-50 dark:hover:bg-indigo-900/30' 
                              : 'hover:bg-slate-50 dark:hover:bg-slate-900'
                          }`}
                        >
                          <div className="w-16 text-center font-bold text-slate-400">
                            {student.rank === 1 ? '🥇' : student.rank === 2 ? '🥈' : student.rank === 3 ? '🥉' : `#${student.rank}`}
                          </div>
                          <div className="flex-1 font-semibold text-slate-900 dark:text-slate-100">
                            {student.displayName}
                            {student.id === studentProfile?.uid && (
                              <span className="ml-2 inline-block px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-[10px]">YOU</span>
                            )}
                          </div>
                          <div className="w-24 text-right flex items-center justify-end gap-1 font-medium text-slate-600 dark:text-slate-400">
                            <Flame className="w-3.5 h-3.5 text-orange-500" />
                            {student.streak}
                          </div>
                          <div className="w-24 text-right flex items-center justify-end gap-1 font-medium text-slate-600 dark:text-slate-400">
                            <Target className="w-3.5 h-3.5 text-slate-400" />
                            {student.questions}
                          </div>
                          <div className="w-24 text-right font-black text-indigo-600 dark:text-indigo-400">
                            {student.xp}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
