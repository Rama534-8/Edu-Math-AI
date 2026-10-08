'use client';
import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Card } from '@/components/ui/Card';
import { Users, BookOpen, ClipboardList, AlertCircle, Loader2 } from 'lucide-react';

export default function TeacherDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/teacher/dashboard')
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setStats(data.stats);
      })
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <RoleGuard allowedRoles={['TEACHER', 'PLATFORM_ADMIN']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex-1 flex">
          <Sidebar />
          <main className="flex-1 flex min-w-0 flex-col">
            <Header title="Teacher Command Center" subtitle="Assigned student and class data" />
            <div className="mx-auto w-full max-w-7xl p-6">
              {error && <p className="text-red-500 mb-4">{error}</p>}
              {isLoading ? (
                <div className="flex items-center justify-center p-10"><Loader2 className="animate-spin w-8 h-8 text-indigo-500" /></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 border-indigo-100 dark:border-indigo-900/40">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-indigo-900 dark:text-indigo-100">Students</h3>
                      <Users className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{stats?.assignedStudents || 0}</div>
                  </Card>
                  <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-100 dark:border-emerald-900/40">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-emerald-900 dark:text-emerald-100">Classes</h3>
                      <BookOpen className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{stats?.assignedClasses || 0}</div>
                  </Card>
                  <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-100 dark:border-amber-900/40">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-amber-900 dark:text-amber-100">Assignments</h3>
                      <ClipboardList className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="text-3xl font-black text-amber-600 dark:text-amber-400">{stats?.assignments || 0}</div>
                  </Card>
                  <Card className="p-6 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 border-rose-100 dark:border-rose-900/40">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-rose-900 dark:text-rose-100">Pending Grading</h3>
                      <AlertCircle className="w-5 h-5 text-rose-500" />
                    </div>
                    <div className="text-3xl font-black text-rose-600 dark:text-rose-400">{stats?.pendingSubmissions || 0}</div>
                  </Card>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}