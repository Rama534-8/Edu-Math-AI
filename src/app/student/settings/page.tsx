'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Languages, Bell } from 'lucide-react';

export default function StudentSettingsPage() {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [preferredLang, setPreferredLang] = useState('ENGLISH');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <RoleGuard allowedRoles={['STUDENT']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />

        <div className="flex-1 flex">
          <Sidebar />

          <main className="flex-1 flex flex-col min-w-0">
            <Header
              title="Student Settings & Preferences"
              subtitle="Configure your AI language mode, audio hints, and study notifications"
            />

            <div className="p-6 max-w-4xl w-full mx-auto space-y-6">
              <Card className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                    <Languages className="w-4 h-4 text-indigo-500" />
                    AI Teaching Language Preference
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => setPreferredLang('ENGLISH')}
                      className={`p-3 rounded-xl border text-left font-semibold ${
                        preferredLang === 'ENGLISH'
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreferredLang('TELUGU')}
                      className={`p-3 rounded-xl border text-left font-semibold ${
                        preferredLang === 'TELUGU'
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      తెలుగు (Telugu)
                    </button>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-purple-500" />
                    Notifications & Audio
                  </h3>

                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                    <div>
                      <span className="font-semibold block text-slate-800 dark:text-slate-200">
                        Daily Study Goal Reminders
                      </span>
                      <span className="text-slate-400">Receive reminder at 6:00 PM</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={emailAlerts}
                      onChange={(e) => setEmailAlerts(e.target.checked)}
                      className="rounded text-indigo-600 w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                    <div>
                      <span className="font-semibold block text-slate-800 dark:text-slate-200">
                        Celebration Sound & Confetti
                      </span>
                      <span className="text-slate-400">Show XP celebration animations</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={soundEffects}
                      onChange={(e) => setSoundEffects(e.target.checked)}
                      className="rounded text-indigo-600 w-4 h-4"
                    />
                  </label>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  {isSaved ? (
                    <span className="text-xs font-bold text-emerald-600">Preferences Saved!</span>
                  ) : (
                    <div />
                  )}
                  <Button size="sm" onClick={handleSave}>
                    Save Preferences
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
