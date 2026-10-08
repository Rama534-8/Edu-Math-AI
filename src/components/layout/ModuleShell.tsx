'use client';

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { RoleGuard } from '@/components/layout/RoleGuard';
import type { UserRole } from '@/types';

interface ModuleShellProps {
  allowedRoles: UserRole[];
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

/**
 * Shared chrome for the Teacher / School Admin / Parent module pages so every
 * screen keeps the same Navbar + Sidebar + Header layout and role guard.
 */
export default function ModuleShell({ allowedRoles, title, subtitle, children }: ModuleShellProps) {
  return (
    <RoleGuard allowedRoles={allowedRoles}>
      <div className="min-h-screen flex flex-col bg-transparent">
        <Navbar />
        <div className="flex-1 flex">
          <Sidebar />
          <main className="flex-1 flex flex-col min-w-0">
            <Header title={title} subtitle={subtitle} />
            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">{children}</div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}

export function MetricTile({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/60">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}

export function LoadingBlock({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-12 text-center text-sm text-slate-300 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/60" role="status">
      {label}
    </div>
  );
}

export function EmptyBlock({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 backdrop-blur-sm p-12 text-center dark:border-slate-700/50 dark:bg-slate-900/60">
      <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="mx-auto max-w-md text-sm text-slate-500">{description}</p>
    </div>
  );
}

export function ErrorBlock({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300" role="alert">
      {message}
    </div>
  );
}