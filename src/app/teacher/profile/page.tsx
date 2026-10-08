'use client';

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth-context';
import {
  Mail,
  Phone,
  Building,
  BookOpen,
  Calendar,
  Award,
  Shield,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

export default function TeacherProfilePage() {
  const { user } = useAuth();

  const [stats, setStats] = React.useState<{
    assignedStudents?: number;
    assignedClasses?: number;
    assignments?: number;
    pendingSubmissions?: number;
  } | null>(null);
  const [statsLoading, setStatsLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/teacher/dashboard')
      .then((r) => r.json())
      .then((d) => { if (d.stats) setStats(d.stats); })
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  const initials = user?.displayName
    ? user.displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'T';

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : '—';

  return (
    <RoleGuard allowedRoles={['TEACHER', 'PLATFORM_ADMIN']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex-1 flex">
          <Sidebar />
          <main className="flex-1 flex flex-col min-w-0">
            <Header title="Profile & Settings" subtitle="Your teaching profile and preferences" />

            <div className="p-6 max-w-3xl w-full mx-auto space-y-6">
              {/* Profile Card */}
              <Card className="p-6 space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-black">
                    {initials}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {user?.displayName || 'Teacher'}
                    </h2>
                    <p className="text-xs text-slate-500">Mathematics Teacher • Class 9</p>
                    <Badge variant="purple" size="sm" className="mt-1">Verified Educator</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-slate-500 block">Email</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">[Teacher Email]</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-slate-500 block">Phone</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">+91 98765 43210</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Building className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-slate-500 block">School</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">Sri Vidya High School</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-slate-500 block">Sections</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">9-A & 9-B (68 students)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-slate-500 block">Joined EduMathAI</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">August 2026</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-slate-500 block">Role</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">Teacher (Mathematics)</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Teaching Stats */}
              <Card className="p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  Teaching Statistics
                </h3>
                {statsLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-xs">
                    <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
                      <span className="text-xl font-black text-indigo-600 block">{stats?.assignedStudents ?? 0}</span>
                      <span className="text-slate-500">Active Students</span>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                      <span className="text-xl font-black text-emerald-600 block">{stats?.assignedClasses ?? 0}</span>
                      <span className="text-slate-500">Classes</span>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                      <span className="text-xl font-black text-amber-600 block">{stats?.assignments ?? 0}</span>
                      <span className="text-slate-500">Assignments</span>
                    </div>
                    <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                      <span className="text-xl font-black text-purple-600 block">{stats?.pendingSubmissions ?? 0}</span>
                      <span className="text-slate-500">Pending Reviews</span>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
