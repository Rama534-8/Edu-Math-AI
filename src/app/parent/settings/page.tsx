'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Settings, Save } from 'lucide-react';

export default function ParentSettingsPage() {
  const { user } = useAuth();
  
  return (
    <RoleGuard allowedRoles={['PARENT', 'PLATFORM_ADMIN']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />

        <div className="flex-1 flex">
          <Sidebar />

          <main className="flex-1 flex flex-col min-w-0">
            <Header
              title="Parent Settings"
              subtitle="Manage your account and notification preferences"
            />

            <div className="p-6 space-y-6 max-w-3xl w-full mx-auto">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Settings className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Account Preferences</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                    <input 
                      type="email" 
                      disabled
                      value={user?.email || ''}
                      className="w-full p-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Weekly Report Emails</label>
                    <select className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md">
                      <option>Send weekly summary every Sunday</option>
                      <option>Send daily summary</option>
                      <option>Do not send email reports</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <Button leftIcon={<Save className="w-4 h-4" />}>
                    Save Settings
                  </Button>
                </div>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
