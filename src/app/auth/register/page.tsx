'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Brain, Lock, Mail, User, Phone, ArrowRight, GraduationCap, Building, Shield, Users, Eye, EyeOff } from 'lucide-react';
import { UserRole } from '@/types';

const roles: { value: UserRole; label: string; desc: string }[] = [
  { value: 'STUDENT', label: '🎓 Student (Class 9)', desc: 'Learn, practice & track progress' },
  { value: 'TEACHER', label: '👩‍🏫 Teacher / Faculty', desc: 'Manage students & analytics' },
  { value: 'PARENT', label: '👨‍👧 Parent / Guardian', desc: "Monitor your child's progress" },
  { value: 'SCHOOL_ADMIN', label: '🏫 School Administrator', desc: 'Manage school analytics & teachers' },
  { value: 'PLATFORM_ADMIN', label: '⚙️ Platform Administrator', desc: 'Platform management (Requires Invite Code)' },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [parentGuardianName, setParentGuardianName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [board, setBoard] = useState('CBSE');
  const [classGrade, setClassGrade] = useState('Class 9');
  const [schoolName, setSchoolName] = useState('');
  const [medium, setMedium] = useState('ENGLISH');
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Please enter your full name.'); return; }
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters long.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (role === 'STUDENT' && !parentGuardianName.trim()) { setError('Parent or guardian name is required.'); return; }
    if (role === 'STUDENT' && !phone.trim()) { setError('Phone number is required.'); return; }
    if (role !== 'PLATFORM_ADMIN' && !schoolName.trim()) { setError('School name is required.'); return; }
    if ((role === 'SCHOOL_ADMIN' || role === 'PLATFORM_ADMIN') && !inviteCode.trim()) { setError('Admin invite code is required.'); return; }

    setIsLoading(true);
    try {
      await register({ name, email, password, confirmPassword, role, phone, parentGuardianName, className: classGrade, schoolName, board, medium, inviteCode });
      if (role === 'STUDENT') router.push('/student/onboarding');
      else if (role === 'TEACHER') router.push('/teacher/dashboard');
      else if (role === 'PARENT') router.push('/parent/dashboard');
      else router.push('/school-admin/dashboard');
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "w-full text-sm rounded-xl border border-slate-700 bg-[#0B1120] text-white placeholder:text-slate-600 px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors";
  const labelClass = "block text-xs font-semibold text-slate-300 mb-2";

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

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-[1000px] flex flex-col md:flex-row rounded-3xl overflow-hidden shadow-2xl shadow-black/50 mx-4 my-8 border border-white/10">

        {/* Left Side — background image panel */}
        <div
          className="hidden md:block w-[45%] relative overflow-hidden"
          style={{ minHeight: '640px' }}
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: 'url("/backgrounds/dark-classroom-bg.jpg")' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B1120]/60 via-transparent to-[#121827]/80" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120]/70 via-transparent to-transparent" />
          {/* Branding overlay */}
          <div className="absolute inset-0 flex flex-col justify-end p-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-600/80 backdrop-blur-sm flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white drop-shadow">EduMathAI</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-3 drop-shadow-lg leading-snug">
              Start Your AI Learning Journey
            </h2>
            <p className="text-blue-100 text-sm leading-relaxed drop-shadow">
              Join thousands of students mastering Mathematics with personalized AI tutoring for CBSE & AP State Board.
            </p>
          </div>
        </div>

        {/* Right Side — Dark form panel */}
        <div className="w-full md:w-[55%] bg-[#121827] flex flex-col justify-start p-8 md:p-10 overflow-y-auto max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 flex items-center justify-center md:hidden">
              <Brain className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Create your account</h1>
              <p className="text-xs text-slate-400 mt-0.5">Free forever for students</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Role selector */}
            <div>
              <label className={labelClass}>I am a...</label>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`flex flex-col items-start gap-0.5 p-3 rounded-xl border text-left transition-all duration-200 ${
                      role === r.value
                        ? 'border-blue-500 bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/30'
                        : 'border-slate-700/50 bg-slate-800/30 text-slate-400 hover:bg-slate-800/80 hover:border-slate-600'
                    } ${r.value === 'PLATFORM_ADMIN' ? 'col-span-2' : ''}`}
                  >
                    <span className="text-xs font-semibold">{r.label}</span>
                    <span className="text-[10px] text-slate-500 leading-tight">{r.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className={labelClass}>Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Arjun Kumar" required
                  className={`${inputClass} pl-10`} />
              </div>
            </div>

            {/* Admin Invite Code */}
            {(role === 'SCHOOL_ADMIN' || role === 'PLATFORM_ADMIN') && (
              <div>
                <label className={labelClass}>Admin Invite Code <span className="text-rose-400">*</span></label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="text" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Enter invite code" required
                    className={`${inputClass} pl-10`} />
                </div>
              </div>
            )}

            {/* Parent Name — student only */}
            {role === 'STUDENT' && (
              <div>
                <label className={labelClass}>Parent / Guardian Name <span className="text-rose-400">*</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="text" value={parentGuardianName} onChange={(e) => setParentGuardianName(e.target.value)}
                    placeholder="Parent or guardian's full name" required
                    className={`${inputClass} pl-10`} />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className={labelClass}>Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email" required
                  className={`${inputClass} pl-10`} />
              </div>
            </div>

            {/* Phone — student only */}
            {role === 'STUDENT' && (
              <div>
                <label className={labelClass}>Phone Number <span className="text-rose-400">*</span></label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile number" required
                    className={`${inputClass} pl-10`} />
                </div>
                <p className="text-[10px] text-slate-600 mt-1">Never shown on leaderboard. Used for account recovery only.</p>
              </div>
            )}

            {/* School Name */}
            {role !== 'PLATFORM_ADMIN' && (
              <div>
                <label className={labelClass}>School Name <span className="text-rose-400">*</span></label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="text" value={schoolName} onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="e.g. Kendriya Vidyalaya" required
                    className={`${inputClass} pl-10`} />
                </div>
              </div>
            )}

            {/* Class / Board / Medium — student only */}
            {role === 'STUDENT' && (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className={labelClass}>Class</label>
                  <select value={classGrade} onChange={(e) => setClassGrade(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-700 bg-[#0B1120] text-white px-2 py-3 focus:outline-none focus:border-blue-500 transition-colors">
                    <option value="Class 9">Class 9</option>
                    <option value="Class 10">Class 10</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Board</label>
                  <select value={board} onChange={(e) => setBoard(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-700 bg-[#0B1120] text-white px-2 py-3 focus:outline-none focus:border-blue-500 transition-colors">
                    <option value="CBSE">CBSE</option>
                    <option value="AP_STATE_BOARD">AP State Board</option>
                    <option value="TS_STATE_BOARD">Telangana State Board</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Medium</label>
                  <select value={medium} onChange={(e) => setMedium(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-700 bg-[#0B1120] text-white px-2 py-3 focus:outline-none focus:border-blue-500 transition-colors">
                    <option value="ENGLISH">English</option>
                    <option value="TELUGU">Telugu</option>
                  </select>
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label className={labelClass}>Create Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters" required
                  className={`${inputClass} pr-12`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className={labelClass}>Confirm Password</label>
              <div className="relative">
                <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password" required
                  className={`${inputClass} pr-12`} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1">
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-400 font-medium bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button type="submit" disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200">
              {isLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account...
                </>
              ) : (
                <>
                  {role === 'STUDENT' ? 'Continue to Onboarding' : 'Create Account'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs font-medium text-slate-500">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
