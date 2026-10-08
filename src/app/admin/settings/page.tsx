'use client';

import React from 'react';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { EmptyState } from '@/components/ui/EmptyState';
import { Settings } from 'lucide-react';

export default function PlatformAdminSettingsPage() {
  return (
    <RoleGuard allowedRoles={['PLATFORM_ADMIN']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex-1 flex">
          <Sidebar />
          <main className="flex-1 flex flex-col min-w-0">
            <Header title="System Settings" subtitle="Configure global platform parameters" />
            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
              <EmptyState 
                icon={<Settings className="w-6 h-6" />}
                title="Settings Coming Soon"
                description="Global system settings, email integrations, and platform configurations will be managed here."
              />
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
