'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { MathRenderer, MixedMathText } from '@/components/ui/MathRenderer';
import {
  Brain,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Camera,
  Bot,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Award,
  Layers,
  GraduationCap,
  Users,
  ShieldCheck,
  Zap,
  Target,
  FileCheck,
  Flame,
  Clock,
  BookOpen,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { CLASS_9_CHAPTERS } from '@/lib/curriculum-data';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      <Navbar />

      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        {/* Background ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Next-Gen Class 9 Math Education • CBSE & AP State Board</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15] mb-6">
              EduMathAI <br />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                AI-Powered Mathematics Learning Platform
              </span>
            </h1>

            {/* Supporting Subheadline */}
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed mb-8 max-w-2xl mx-auto">
              Personalized mathematics learning, practice, assessment and progress tracking for Class 9 students.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link href="/auth/register">
                <Button size="lg" className="w-full sm:w-auto text-base px-8 py-4 shadow-lg shadow-indigo-500/25" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Start Learning
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-8 py-4">
                  Explore Features
                </Button>
              </Link>
            </div>

            {/* Highlight Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> English & తెలుగు Medium
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> AI Mistake Detective ⭐
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Measurable Before & After
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Deterministic Academic Grading
              </span>
            </div>
          </div>

          {/* Interactive Hero Visual Showcase */}
          <div className="mt-14 max-w-5xl mx-auto">
            <Card className="p-2 sm:p-4 bg-slate-900/90 border-slate-800 text-white shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                  <span className="ml-2 font-mono text-[11px] text-slate-300">
                    EduMathAI AI Mistake Detective & Interactive Solver
                  </span>
                </div>
                <Badge variant="purple" size="sm">
                  Class 9 Demo
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 sm:p-6 text-sm">
                {/* Left: Student Error Example */}
                <div className="bg-slate-950/80 rounded-xl p-5 border border-rose-900/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-500" /> Student Working Submission
                    </span>
                    <Badge variant="danger" size="sm">
                      Wrong Answer
                    </Badge>
                  </div>
                  <div className="space-y-2 font-mono text-xs text-slate-300">
                    <div className="text-slate-400">Problem: Solve $2x + 5 = 15$</div>
                    <div className="p-2.5 rounded bg-rose-950/30 text-rose-200 border border-rose-800/40">
                      Step 1: $2x = 15 + 5 = 20$<br />
                      Step 2: $x = 20 / 2 = 10$
                    </div>
                  </div>
                </div>

                {/* Right: AI Mistake Detective Diagnosis */}
                <div className="bg-slate-950/80 rounded-xl p-5 border border-indigo-500/40 relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-400" /> AI Detective Diagnosis
                    </span>
                    <Badge variant="primary" size="sm">
                      Sign & Transposition Error
                    </Badge>
                  </div>
                  <div className="space-y-2 text-xs text-slate-300">
                    <p className="text-amber-300 font-medium">
                      💡 <strong>What went wrong:</strong> You added 5 to 15 instead of subtracting.
                    </p>
                    <p className="text-slate-300">
                      <strong>Transposition Rule:</strong> $+5$ becomes $-5$ when crossing the equals sign:
                      <span className="text-emerald-400 font-mono block mt-1">
                        $2x = 15 - 5 = 10 \implies x = 5$
                      </span>
                    </p>
                    <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px]">
                      <span className="text-indigo-400 font-semibold">Recommended: Retest similar question</span>
                      <span className="text-emerald-400 font-bold">+15 XP earned</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS: THE 8-STEP CYCLE */}
      <section id="how-it-works" className="py-20 bg-[var(--band-white)] border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="primary" size="md" className="mb-3">
              The Proven Educational Cycle
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              How EduMathAI Works
            </h2>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
              Unlike generic calculators that just dump answers, EduMathAI guides students through an evidence-backed learning cycle.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Assess (Baseline)',
                desc: 'Take an immutable diagnostic assessment to discover starting accuracy, strengths, and weak topics.',
                icon: Target,
                color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60',
              },
              {
                step: '02',
                title: 'Learn Concepts',
                desc: 'Explore CBSE and AP State Board chapters with visual worked examples, formulas, and Telugu translations.',
                icon: BookOpen,
                color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/60',
              },
              {
                step: '03',
                title: 'Ask AI Tutor',
                desc: 'Receive hints, step-by-step guidance, and conceptual explanations rather than blind answer dumps.',
                icon: Bot,
                color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/60',
              },
              {
                step: '04',
                title: 'Practice Actively',
                desc: 'Solve topic-wise, chapter-wise, and adaptive questions calibrated to your skill level.',
                icon: Layers,
                color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60',
              },
              {
                step: '05',
                title: 'Detect Mistakes ⭐',
                desc: 'AI categorizes mistakes into Sign, Calculation, Formula, or Concept errors and explains why they happened.',
                icon: Sparkles,
                color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60',
              },
              {
                step: '06',
                title: 'Smart Revision',
                desc: 'Prioritize weak areas, formula revision, and past errors with automated personalized revision queues.',
                icon: RotateCcw,
                color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/60',
              },
              {
                step: '07',
                title: 'Retest Comparable Qs',
                desc: 'Take standardized follow-up assessments with matched difficulty to test genuine mastery.',
                icon: FileCheck,
                color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/60',
              },
              {
                step: '08',
                title: 'Measure Improvement',
                desc: 'See precise growth in percentage points (+30 pts), mistake reduction count, and topic mastery gains.',
                icon: TrendingUp,
                color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60',
              },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <Card key={s.step} hoverEffect className="relative p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-slate-300 dark:text-slate-700">
                      {s.step}
                    </span>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
                    {s.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {s.desc}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. CORE AI CAPABILITIES: TUTOR, SOLVER, MISTAKE DETECTIVE */}
      <section id="features" className="py-20 bg-[var(--band-slate)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="purple" size="md" className="mb-3">
              AI Mathematics Accelerators
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              Pedagogical AI Built Specifically for Math
            </h2>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
              Built to teach students mathematical reasoning instead of bypassing problem-solving.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Feature 1: AI Maths Tutor */}
            <Card hoverEffect className="p-6 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-6">
                  <Bot className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
                  AI Mathematics Tutor
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  Multi-stage teaching flow: <strong>Hint → Additional Hint → Step-by-Step → Final Solution → Similar Question</strong>. Supports English, Simple English, and Telugu.
                </p>
                <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Never gives away answers immediately
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Explains formulas in Telugu script
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Generates targeted practice
                  </li>
                </ul>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                <Link href="/student/ai-tutor">
                  <Button variant="outline" size="sm" className="w-full" rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
                    Open AI Tutor
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Feature 2: AI Image Maths Solver */}
            <Card hoverEffect className="p-6 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-6">
                  <Camera className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
                  AI Image Maths Solver
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  Take a photo of any textbook math problem. The multimodal engine extracts the question, identifies the underlying chapter concept, and provides verified step-by-step working.
                </p>
                <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> OCR math symbol detection
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Refuses to hallucinate on blurry images
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Hand-written solution evaluator
                  </li>
                </ul>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                <Link href="/student/ai-solver">
                  <Button variant="outline" size="sm" className="w-full" rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
                    Open Image Solver
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Feature 3: AI Mistake Detective ⭐ */}
            <Card hoverEffect className="p-6 flex flex-col justify-between border-amber-300/80 dark:border-amber-800/80 bg-gradient-to-b from-amber-50/20 to-transparent">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center mb-6">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    AI Mistake Detective
                  </h3>
                  <Badge variant="warning" size="sm">
                    ⭐ Key USP
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  Classifies errors into 10 strict mathematical categories (Sign error, Calculation error, Formula error, Concept gap). Pinpoints the exact line where logic failed.
                </p>
                <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Explains &quot;Why it happened&quot;
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Shows the exact correct approach
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Gives immediate retest question
                  </li>
                </ul>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                <Link href="/student/mistake-detective">
                  <Button variant="primary" size="sm" className="w-full bg-amber-600 hover:bg-amber-700 border-amber-500" rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
                    Try Mistake Detective
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 4. BEFORE & AFTER MEASURABLE IMPACT SHOWCASE ⭐⭐⭐ */}
      <section id="before-after" className="py-20 bg-[var(--band-white)] border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="success" size="md" className="mb-3">
              ⭐⭐⭐ Measurable Evidence
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              Before & After Learning Impact
            </h2>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
              EduMathAI compares comparable baseline assessments with post-learning retests using standardized percentage point deltas.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
                <div>
                  <h3 className="text-xl font-bold">Standardized Learning Progress Comparison</h3>
                  <p className="text-xs text-slate-400">Personalized Class 9 mathematics progress</p>
                </div>
                <Link href="/student/before-after">
                  <Button size="sm" variant="primary" rightIcon={<TrendingUp className="w-3.5 h-3.5" />}>
                    View Live Comparison
                  </Button>
                </Link>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-xs text-slate-400 block mb-1">Baseline Score</span>
                  <div className="text-2xl font-black text-rose-400">40%</div>
                  <span className="text-[11px] text-slate-400">Diagnostic Snapshot</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-xs text-slate-400 block mb-1">Retest Score</span>
                  <div className="text-2xl font-black text-emerald-400">80%</div>
                  <span className="text-[11px] text-slate-400">After Retest</span>
                </div>
                <div className="p-4 rounded-xl bg-indigo-950/60 border border-indigo-700/60">
                  <span className="text-xs text-indigo-300 block mb-1">Score Gain</span>
                  <div className="text-2xl font-black text-indigo-300">+40 pts</div>
                  <span className="text-[11px] text-indigo-400 font-medium">Percentage Points</span>
                </div>
                <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-700/60">
                  <span className="text-xs text-emerald-300 block mb-1">Mistakes Reduced</span>
                  <div className="text-2xl font-black text-emerald-300">-4 Errors</div>
                  <span className="text-[11px] text-emerald-400 font-medium">Sign & Calc Repaired</span>
                </div>
              </div>

              {/* Honest Academic Notice */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <p>
                  <strong>Strict Academic Honesty Rule:</strong> Comparisons are only computed between comparable assessments with matching difficulty distribution and question volume. Scores are calculated deterministically on the server.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 5. MULTI-STAKEHOLDER FEATURES: STUDENTS, TEACHERS, PARENTS */}
      <section className="py-20 bg-[var(--band-slate)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="primary" size="md" className="mb-3">
              Unified Ecosystem
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              Built for the Entire Learning Community
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Student Card */}
            <Card hoverEffect className="p-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center mb-4">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
                For Students
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Interactive syllabus explorer
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Gamification, XP, and Streaks
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Formula Notebook & personal notes
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> AI Study Planner for exams
                </li>
              </ul>
            </Card>

            {/* Teacher Card */}
            <Card hoverEffect className="p-6">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
                For Teachers
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Class-wide mistake heatmaps
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> AI Question Generator with DRAFT workflow
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Homework & Assignment management
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Verified Before & After student growth
                </li>
              </ul>
            </Card>

            {/* Parent Card */}
            <Card hoverEffect className="p-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
                For Parents
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Real-time study activity tracker
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Downloadable Progress Reports
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Weak topic notifications
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Zero invasive score manipulation
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* 6. CLASS 9 CURRICULUM OVERVIEW */}
      <section id="curriculum" className="py-20 bg-[var(--band-white)] border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="primary" size="md" className="mb-3">
              Standardized Curriculum
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              Class 9 Mathematics Syllabus
            </h2>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
              Aligned with AP State Board & CBSE frameworks, complete with bilingual definitions and LaTeX formulas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {CLASS_9_CHAPTERS.map((ch) => (
              <Card key={ch.id} hoverEffect className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary" size="sm">
                    Ch {ch.chapterNumber}
                  </Badge>
                  <span className="text-[11px] text-slate-500">{ch.estimatedHours}h est.</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                  {ch.title}
                </h4>
                {ch.titleTelugu && (
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mb-2">
                    {ch.titleTelugu}
                  </p>
                )}
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                  {ch.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FREQUENTLY ASKED QUESTIONS (FAQ) */}
      <section className="py-20 bg-[var(--band-slate)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'How does EduMathAI detect mistakes?',
                a: 'The AI Mistake Detective analyzes the student’s working or submitted options against formal mathematical rules. It classifies errors into Sign error, Calculation error, Formula error, or Conceptual gap and immediately generates a tailored correction approach.',
              },
              {
                q: 'Is EduMathAI available in Telugu?',
                a: 'Yes! All Class 9 chapters, lessons, formula explanations, and AI Tutor responses are available with bilingual English and Telugu support.',
              },
              {
                q: 'How are Before & After results calculated?',
                a: 'Before results come from an immutable baseline diagnostic. After results come from standardized follow-up assessments. Comparisons strictly measure percentage point deltas on comparable tests and are computed deterministically on the server.',
              },
              {
                q: 'Can teachers create assignments and custom questions?',
                a: 'Yes. Teachers have access to question builders, assignment distribution tools, and an AI Question Assistant where generated items remain in DRAFT until authorized.',
              },
            ].map((faq, fIdx) => (
              <Card key={fIdx} className="p-6">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  {faq.q}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-6">
                  {faq.a}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 8. CALL TO ACTION */}
      <section className="py-20 bg-gradient-to-tr from-indigo-900 via-purple-900 to-slate-950 text-white text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Ready to Master Class 9 Mathematics?
          </h2>
          <p className="text-base text-slate-300 max-w-xl mx-auto mb-8">
            Start your personalized diagnostic assessment today and measure your true learning improvement.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register">
              <Button size="lg" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-950 hover:bg-slate-100 font-bold shadow-xl">
                Get Started Now
              </Button>
            </Link>
            <Link href="/student/baseline">
              <Button size="lg" variant="ghost" className="w-full sm:w-auto px-8 py-4 border border-white/30 text-white hover:bg-white/10">
                Take Baseline Test
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
