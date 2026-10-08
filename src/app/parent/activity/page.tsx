'use client';

import React from 'react';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ParentReportPanel } from '@/components/parent/ParentReportPanel';

export default function ParentActivityPage() {
  return (
    <RoleGuard allowedRoles={['PARENT']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex-1 flex">
          <Sidebar />
          <main className="flex-1 flex flex-col min-w-0">
            <Header title="Study Activity Log" subtitle="Recorded activity from your linked students" />
            <div className="p-6 max-w-7xl w-full mx-auto">
              <ParentReportPanel mode="activity" />
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
