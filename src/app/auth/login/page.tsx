'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { 
  Brain, Lock, Mail, ArrowRight, Eye, EyeOff, Home, Globe,
  MessageSquare, TrendingUp, Award, BookOpen, GraduationCap, Users, Building, Shield
} from 'lucide-react';
import { UserRole } from '@/types';

const ROLE_OPTIONS: { value: UserRole; label: string; icon: React.ReactNode }[] = [
  { value: 'STUDENT', label: 'Student', icon: <GraduationCap className="w-5 h-5 mb-1" /> },
  { value: 'TEACHER', label: 'Teacher', icon: <Users className="w-5 h-5 mb-1" /> },
  { value: 'PARENT', label: 'Parent', icon: <Users className="w-5 h-5 mb-1" /> },
  { value: 'SCHOOL_ADMIN', label: 'School Admin', icon: <Building className="w-5 h-5 mb-1" /> },
  { value: 'PLATFORM_ADMIN', label: 'Platform Admin', icon: <Shield className="w-5 h-5 mb-1" /> },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('STUDENT');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email address.'); return; }
    if (!password) { setError('Please enter your password.'); return; }

    setIsLoading(true);
    setError('');
    try {
      await login(email, password, selectedRole);
      const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
      const data = await res.json();
      const userRole = data.user?.role;

      if (userRole === 'TEACHER') router.push('/teacher/dashboard');
      else if (userRole === 'PARENT') router.push('/parent/dashboard');
      else if (userRole === 'SCHOOL_ADMIN') router.push('/school-admin/dashboard');
      else if (userRole === 'PLATFORM_ADMIN') router.push('/admin/dashboard');
      else router.push('/student/dashboard');
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleLabel = (val: UserRole) => {
    return ROLE_OPTIONS.find(r => r.value === val)?.label || 'Student';
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#0B1120] text-slate-200">
      {/* Full screen background image */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: 'url("/backgrounds/dark-classroom-bg.jpg")' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-[#0B1120]/80 to-transparent" />
      </div>

      {/* Top Right Navigation Pills */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
        <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-xs font-semibold backdrop-blur-md">
          <Globe className="w-4 h-4 text-blue-400" />
          English ▾
        </button>
        <Link href="/">
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-xs font-semibold backdrop-blur-md">
            <Home className="w-4 h-4 text-orange-400" />
            Home
          </button>
        </Link>
      </div>

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-[1000px] flex flex-col md:flex-row rounded-3xl overflow-hidden shadow-2xl shadow-black/50 mx-4 border border-white/10">
        
        {/* Left Side (Blue Branding Panel) */}
        <div className="hidden md:flex flex-col justify-between w-1/2 p-12 bg-blue-600 text-white">
          <div>
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold leading-tight">EduMathAI</h2>
                <p className="text-[10px] text-blue-100 uppercase tracking-widest font-semibold mt-0.5">Learn • Practice • Grow</p>
              </div>
            </div>

            <h1 className="text-4xl font-bold mb-4 leading-tight">Master Mathematics with AI</h1>
            <p className="text-blue-100 text-sm leading-relaxed mb-10">
              Personalized AI math tutor, interactive practice questions, and instant step-by-step doubt resolution for CBSE & AP State Board.
            </p>

            <ul className="space-y-5 text-sm font-medium text-blue-50">
              <li className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 text-blue-200" />
                </div>
                AI-powered step-by-step doubt resolution
              </li>
              <li className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4 text-blue-200" />
                </div>
                Personalized performance & streak analytics
              </li>
              <li className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4 text-blue-200" />
                </div>
                Gamified badges, levels & reward points
              </li>
              <li className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4 text-blue-200" />
                </div>
                Full CBSE & AP State Board syllabus
              </li>
            </ul>
          </div>
        </div>

        {/* Right Side (Login Form) */}
        <div className="w-full md:w-1/2 p-8 md:p-12 bg-[#121827] backdrop-blur-xl flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              Sign In
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold tracking-wider uppercase">
                {getRoleLabel(selectedRole)}
              </span>
            </h2>
            <p className="text-sm text-slate-400 mt-2">Sign in to access your AI tutor, practice questions & tests</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Roles Selector */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
              {ROLE_OPTIONS.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setSelectedRole(role.value)}
                  className={`flex flex-col items-center justify-center flex-1 min-w-[70px] py-3 rounded-xl border transition-all ${
                    selectedRole === role.value
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                      : 'border-slate-700/50 bg-slate-800/30 text-slate-400 hover:bg-slate-800/80 hover:border-slate-600'
                  }`}
                >
                  {role.icon}
                  <span className="text-[10px] font-semibold text-center leading-tight mt-1">{role.label}</span>
                </button>
              ))}
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                {getRoleLabel(selectedRole)} Email Address
              </label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com" 
                required
                className="w-full text-sm rounded-xl border border-slate-700 bg-[#0B1120] text-white placeholder:text-slate-600 px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" 
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password" 
                  required
                  className="w-full text-sm rounded-xl border border-slate-700 bg-[#0B1120] text-white placeholder:text-slate-600 pl-4 pr-12 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex justify-end mt-2">
                <Link href="/auth/forgot-password" className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-400 font-medium bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 mt-2"
            >
              {isLoading ? 'Signing in...' : `Sign In as ${getRoleLabel(selectedRole)}`}
            </button>
          </form>

          <p className="mt-8 text-center text-xs font-medium text-slate-400">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
