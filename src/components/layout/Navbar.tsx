'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { NotificationBell } from '@/components/layout/NotificationBell';
import {
  Brain,
  Sparkles,
  Menu,
  X,
  LayoutDashboard,
} from 'lucide-react';
import { ThemeToggleButton } from '@/components/ui/ThemeToggle';

export const Navbar: React.FC = () => {
  const { user, role } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const getDashboardPath = () => {
    switch (role) {
      case 'TEACHER':
        return '/teacher/dashboard';
      case 'PARENT':
        return '/parent/dashboard';
      case 'SCHOOL_ADMIN':
        return '/school-admin/dashboard';
      case 'PLATFORM_ADMIN':
        return '/admin/dashboard';
      case 'STUDENT':
      default:
        return '/student/dashboard';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/85 dark:bg-slate-950/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-white">
              <Brain className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                EduMathAI
              </span>
              <Badge variant="purple" size="sm">
                Class 9
              </Badge>
            </div>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              CBSE & AP State Board (Eng / తె)
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <Link href="/#how-it-works" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            How It Works
          </Link>
          <Link href="/#features" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            AI Tutor & Solver
          </Link>
          <Link href="/#mistake-detective" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Mistake Detective
          </Link>
          <Link href="/#before-after" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Before & After
          </Link>
          <Link href="/#curriculum" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Curriculum
          </Link>
        </nav>

        {/* Right Action Bar */}
        <div className="hidden lg:flex items-center gap-3">


          <ThemeToggleButton />
          {user ? (
            <div className="flex items-center gap-3">
              <NotificationBell />
              <Link href={getDashboardPath()}>
                <Button size="sm" leftIcon={<LayoutDashboard className="w-3.5 h-3.5" />}>
                  Dashboard
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggleButton />
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {isMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-6 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <Link
            href="/#how-it-works"
            onClick={() => setIsMenuOpen(false)}
            className="block py-2 text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            How It Works
          </Link>
          <Link
            href="/#features"
            onClick={() => setIsMenuOpen(false)}
            className="block py-2 text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Features & AI Solver
          </Link>
          <Link
            href="/#before-after"
            onClick={() => setIsMenuOpen(false)}
            className="block py-2 text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Before & After Improvement
          </Link>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
            <Link href={getDashboardPath()} onClick={() => setIsMenuOpen(false)}>
              <Button className="w-full mt-2" size="sm">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
