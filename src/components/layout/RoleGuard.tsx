'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/types';
import { LoadingState } from '../ui/LoadingState';
import { ShieldAlert, ArrowRight, LogIn } from 'lucide-react';
import { SmartChatbot } from '../ui/SmartChatbot';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

const ROLE_DASHBOARD: Record<UserRole, string> = {
  STUDENT: '/student/dashboard',
  TEACHER: '/teacher/dashboard',
  PARENT: '/parent/dashboard',
  SCHOOL_ADMIN: '/school-admin/dashboard',
  PLATFORM_ADMIN: '/admin/dashboard',
};

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();

  // Auto-redirect unauthenticated users to login
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingState message="Authenticating role access..." />
      </div>
    );
  }

  // Not logged in — redirect handled by useEffect above
  if (!user || !role) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingState message="Redirecting to login..." />
      </div>
    );
  }

  // Wrong role
  if (!allowedRoles.includes(role)) {
    const correctDashboard = ROLE_DASHBOARD[role];

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        {/* Blurred bg orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-red-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-sm">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/50 text-center">
            {/* Icon */}
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center mb-5">
              <ShieldAlert className="w-8 h-8 text-amber-400" />
            </div>

            <h3 className="text-xl font-bold text-white mb-2">
              Access Restricted
            </h3>
            <p className="text-sm text-slate-400 mb-1">
              This page is for{' '}
              <span className="font-semibold text-indigo-400">{allowedRoles.join(' / ')}</span> only.
            </p>
            <p className="text-xs text-slate-500 mb-7">
              You are signed in as{' '}
              <span className="font-semibold text-amber-400">{role}</span>.
            </p>

            {/* Go to my dashboard */}
            <button
              onClick={() => router.push(correctDashboard)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:scale-[1.02] mb-3"
            >
              Go to My Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>



            {/* Login link */}
            <button
              onClick={() => router.push('/auth/login')}
              className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign in as a different account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      {role === 'STUDENT' && <SmartChatbot />}
    </>
  );
};
