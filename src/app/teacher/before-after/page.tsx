'use client';

import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { EmptyState } from '@/components/ui/EmptyState';
import { TrendingUp } from 'lucide-react';

export default function TeacherBeforeAfterPage() {
  return (
    <RoleGuard allowedRoles={['TEACHER', 'PLATFORM_ADMIN']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex-1 flex">
          <Sidebar />
          <main className="flex-1 flex min-w-0 flex-col">
            <Header title="Before & After Class Insights" subtitle="Improvement from comparable saved assessments" />
            <div className="mx-auto w-full max-w-7xl p-6">
              <EmptyState
                icon={<TrendingUp className="h-6 w-6" />}
                title="No assigned student comparisons are available"
                description="Before & After data can only be shown after assessment snapshots are linked to authorized teacher classes."
              />
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
