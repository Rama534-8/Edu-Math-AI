'use client';

import React from 'react';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ParentReportPanel } from '@/components/parent/ParentReportPanel';

export default function ParentProgressPage() {
  return (
    <RoleGuard allowedRoles={['PARENT']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex-1 flex">
          <Sidebar />
          <main className="flex-1 flex flex-col min-w-0">
            <Header title="Learning Progress" subtitle="Assessment and chapter performance for your linked students" />
            <div className="p-6 max-w-7xl w-full mx-auto">
              <ParentReportPanel mode="progress" />
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
