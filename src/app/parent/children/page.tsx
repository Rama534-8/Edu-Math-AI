'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, UserPlus } from 'lucide-react';

interface ParentChild {
  id: string;
  displayName: string;
  parentGuardianName: string | null;
  profilePicture: string | null;
  className: string;
  board: string;
  medium: string;
  xp: number;
  level: number;
  streakDays: number;
  questionsSolved: number;
  accuracy: number | null;
  improvement: number | null;
  latestAssessment: number | null;
}

export default function ParentChildrenPage() {
  const router = useRouter();
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLinking, setIsLinking] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [studentCode, setStudentCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/parent/children', { credentials: 'same-origin' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load linked students.');
        if (!cancelled) setChildren(data.children as ParentChild[]);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Could not load linked students.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [reloadKey]);

  const handleLinkStudent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsLinking(true);
    try {
      const response = await fetch('/api/parent/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ studentCode: studentCode.trim().toUpperCase() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not link student.');
      setStudentCode('');
      setSuccess('Student linked successfully.');
      setReloadKey((key) => key + 1);
    } catch (linkError: unknown) {
      setError(linkError instanceof Error ? linkError.message : 'Could not link student.');
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['PARENT']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex-1 flex">
          <Sidebar />
          <main className="flex-1 flex flex-col min-w-0">
            <Header title="My Children" subtitle="Manage your linked student accounts" />
            <div className="p-6 space-y-6 max-w-7xl w-full mx-auto">
              <div className="flex flex-wrap justify-between items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Linked Accounts</h2>
                <Button leftIcon={<UserPlus className="w-4 h-4" />} onClick={() => setIsFormOpen((open) => !open)}>
                  {isFormOpen ? 'Close' : 'Link New Student'}
                </Button>
              </div>

              {isFormOpen && (
                <Card className="p-5">
                  <form onSubmit={handleLinkStudent} className="flex flex-col sm:flex-row gap-3">
                    <label htmlFor="student-code" className="sr-only">Student Code</label>
                    <input
                      id="student-code"
                      value={studentCode}
                      onChange={(event) => setStudentCode(event.target.value.toUpperCase())}
                      placeholder="EDU-ABC123"
                      autoComplete="off"
                      maxLength={10}
                      required
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                    <Button type="submit" disabled={isLinking || !studentCode.trim()}>
                      {isLinking ? 'Linking…' : 'Link Student'}
                    </Button>
                  </form>
                </Card>
              )}

              {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
              {success && <p role="status" className="text-sm text-emerald-700">{success}</p>}

              {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-slate-500" role="status">
                  <Loader2 className="w-5 h-5 animate-spin" /> Loading linked students...
                </div>
              ) : children.length === 0 ? (
                <Card className="p-12 text-center flex flex-col items-center justify-center border-dashed">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">No children linked yet</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                    Link a student using the unique code shown in their profile.
                  </p>
                  <Button leftIcon={<UserPlus className="w-4 h-4" />} onClick={() => setIsFormOpen(true)}>
                    Link New Student
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {children.map((child) => (
                    <Card key={child.id} className="p-5 space-y-4">
                      <div className="flex items-center gap-3">
                        {child.profilePicture ? (
                           
                          <img src={child.profilePicture} alt="" className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold">
                            {child.displayName.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-900 dark:text-slate-100 truncate">{child.displayName}</h3>
                          <p className="text-xs text-slate-500">{child.className} · {child.board} · {child.medium}</p>
                        </div>
                        <span className="ml-auto flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Level {child.level}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                        <div><p className="text-xs text-slate-500">Accuracy</p><p className="font-semibold">{child.accuracy === null ? 'No data' : `${Math.round(child.accuracy)}%`}</p></div>
                        <div><p className="text-xs text-slate-500">Questions</p><p className="font-semibold">{child.questionsSolved}</p></div>
                        <div><p className="text-xs text-slate-500">XP</p><p className="font-semibold">{child.xp}</p></div>
                        <div><p className="text-xs text-slate-500">Streak</p><p className="font-semibold">{child.streakDays} days</p></div>
                      </div>
                      <p className="text-xs text-slate-500">
                        Latest assessment: {child.latestAssessment === null ? 'No assessment yet' : `${Math.round(child.latestAssessment)}%`}
                        {child.improvement !== null && ` · Improvement ${child.improvement >= 0 ? '+' : ''}${Math.round(child.improvement)} points`}
                      </p>
                      <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />} onClick={() => router.push(`/parent/progress?studentId=${encodeURIComponent(child.id)}`)}>
                        View Progress
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
