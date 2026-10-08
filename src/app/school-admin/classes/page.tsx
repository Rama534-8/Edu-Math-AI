'use client';

import React, { useEffect, useState } from 'react';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Loader2, Users, Trophy, BookOpen, GraduationCap, Building, ChevronDown, ChevronUp } from 'lucide-react';

interface StudentRow {
  id: string;
  displayName: string;
  className: string;
  board: string;
  medium: string;
  schoolName: string | null;
  xp: number;
  level: number;
  streakDays: number;
  questionsSolved: number;
  baselineCompleted: number;
  baselineScore: number | null;
  profilePicture: string | null;
  email: string;
  createdAt: string;
}

interface ClassGroup {
  label: string;
  studentCount: number;
  avgXP: number;
  avgQuestions: number;
  baselineCompletion: number;
  students: StudentRow[];
}

export default function SchoolAdminClassesPage() {
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/classes', { credentials: 'same-origin' })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load classes.');
        if (!cancelled) {
          setClasses(json.classes as ClassGroup[]);
          // Auto-expand the first class if there is one
          if (json.classes.length > 0) {
            setExpandedClasses({ [json.classes[0].label]: true });
          }
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load classes.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const toggleClass = (label: string) => {
    setExpandedClasses((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <RoleGuard allowedRoles={['SCHOOL_ADMIN', 'PLATFORM_ADMIN']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex-1 flex">
          <Sidebar />
          <main className="flex-1 flex flex-col min-w-0">
            <Header title="Classes & Cohorts" subtitle="Student roster organized by class and board" />
            
            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
              {error && (
                <Card className="p-4 text-sm text-rose-700 dark:text-rose-300" role="alert">{error}</Card>
              )}

              {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-20 text-slate-500" role="status">
                  <Loader2 className="w-5 h-5 animate-spin" /> Loading roster...
                </div>
              ) : classes.length === 0 ? (
                <Card className="p-12 text-center border-dashed">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                    <Building className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
                    No Students Found
                  </h3>
                  <p className="text-sm text-slate-500 max-w-md mx-auto">
                    Students register automatically and will appear here grouped by their Class and Board selection.
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {classes.map((group) => {
                    const isExpanded = expandedClasses[group.label] || false;
                    
                    return (
                      <Card key={group.label} className="overflow-hidden">
                        {/* Group Header (Clickable) */}
                        <div 
                          className="p-4 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                          onClick={() => toggleClass(group.label)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                              <Users className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                                {group.label}
                              </h3>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {group.studentCount} student{group.studentCount !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6">
                            <div className="hidden md:flex items-center gap-4">
                              <div className="text-center">
                                <p className="text-[10px] text-slate-500 font-medium uppercase">Avg XP</p>
                                <p className="text-sm font-bold text-amber-600">⚡ {group.avgXP}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-[10px] text-slate-500 font-medium uppercase">Avg Q's Solved</p>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{group.avgQuestions}</p>
                              </div>
                              <div className="w-24 text-center">
                                <p className="text-[10px] text-slate-500 font-medium uppercase mb-1">Baseline Taken</p>
                                <ProgressBar value={group.baselineCompletion} size="sm" showPercentage className="text-[10px]" />
                              </div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-400">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                          </div>
                        </div>

                        {/* Students List */}
                        {isExpanded && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-slate-50/50 dark:bg-slate-900/20 text-slate-500 text-xs uppercase tracking-wider">
                                <tr>
                                  <th className="py-3 px-4 font-semibold text-left">Student</th>
                                  <th className="py-3 px-4 font-semibold text-center">Level / XP</th>
                                  <th className="py-3 px-4 font-semibold text-center">Streak</th>
                                  <th className="py-3 px-4 font-semibold text-center">Q's Solved</th>
                                  <th className="py-3 px-4 font-semibold text-center">Baseline</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {group.students.map((student) => (
                                  <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                    <td className="py-3 px-4">
                                      <div className="flex items-center gap-3">
                                        {student.profilePicture ? (
                                           
                                          <img src={student.profilePicture} alt="" className="w-8 h-8 rounded-full object-cover shadow-sm" />
                                        ) : (
                                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-xs shadow-sm">
                                            {student.displayName.charAt(0).toUpperCase()}
                                          </div>
                                        )}
                                        <div>
                                          <p className="font-bold text-slate-900 dark:text-slate-100">{student.displayName}</p>
                                          <p className="text-[10px] text-slate-500">{student.email}</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                      <div className="flex flex-col items-center">
                                        <Badge variant="purple" size="sm">Lvl {student.level}</Badge>
                                        <span className="text-[10px] font-bold text-amber-500 mt-1">⚡ {student.xp}</span>
                                      </div>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-bold text-xs">
                                        🔥 {student.streakDays}
                                      </div>
                                    </td>
                                    <td className="py-3 px-4 text-center font-semibold text-slate-700 dark:text-slate-300">
                                      {student.questionsSolved}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                      {student.baselineCompleted === 1 ? (
                                        <Badge variant="success" size="sm">
                                          {student.baselineScore !== null ? `${student.baselineScore}%` : 'Done'}
                                        </Badge>
                                      ) : (
                                        <Badge variant="secondary" size="sm" className="text-slate-400">Pending</Badge>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
