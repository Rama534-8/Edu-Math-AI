'use client';

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { LearningInsightsPanel } from '@/components/student/LearningInsightsPanel';

export default function LearningInsightsPage() {
  return (
    <RoleGuard allowedRoles={['STUDENT']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />

        <div className="flex-1 flex">
          <Sidebar />

          <main className="flex-1 flex flex-col min-w-0">
            <Header
              title="AI Learning Insights & Personalized Path"
              subtitle="Your weak topics, strong topics and the exact next steps — built only from your real Class 9 Mathematics results"
            />

            <div className="p-6 max-w-6xl w-full mx-auto space-y-6">
              <LearningInsightsPanel variant="full" />
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}