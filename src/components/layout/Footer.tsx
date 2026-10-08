'use client';

import React from 'react';
import Link from 'next/link';
import { Brain, Shield, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                EduMathAI
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              AI-Powered Mathematics Learning Platform for Class 9 students.
              Designed specifically for CBSE & AP State Board curriculums with
              full English & Telugu support.
            </p>
            <div className="text-xs text-indigo-400 font-medium">
              Assess → Learn → Ask AI → Practice → Detect Mistakes → Revise →
              Retest → Measure Improvement
            </div>
          </div>

          {/* Quick Learning Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">
              Student Hub
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link
                  href="/student/dashboard"
                  className="hover:text-indigo-400 transition-colors"
                >
                  Student Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/student/mock-exams"
                  className="hover:text-indigo-400 transition-colors"
                >
                  Mock Exams (Full & Chapter-wise)
                </Link>
              </li>
              <li>
                <Link
                  href="/student/revision"
                  className="hover:text-indigo-400 transition-colors"
                >
                  Smart Revision Hub ⚡
                </Link>
              </li>
              <li>
                <Link
                  href="/student/mistake-detective"
                  className="hover:text-indigo-400 transition-colors"
                >
                  AI Mistake Detective ⭐
                </Link>
              </li>
              <li>
                <Link
                  href="/student/ai-tutor"
                  className="hover:text-indigo-400 transition-colors"
                >
                  AI Mathematics Tutor
                </Link>
              </li>
              <li>
                <Link
                  href="/student/before-after"
                  className="hover:text-indigo-400 transition-colors"
                >
                  Before &amp; After Measurable Impact
                </Link>
              </li>
            </ul>
          </div>

          {/* Curriculums & Language */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">
              Curriculum & Boards
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>CBSE Class 9 Mathematics</li>
              <li>AP State Board Class 9 (SCERT)</li>
              <li>English Medium Support</li>
              <li>తెలుగు మాధ్యమం మద్దతు (Telugu Medium)</li>
              <li>Deterministic Academic Grading</li>
            </ul>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">
              Company
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li><Link href="/" className="hover:text-indigo-400">Home</Link></li>
              <li><Link href="/#features" className="hover:text-indigo-400">Features</Link></li>
              <li><Link href="#" className="hover:text-indigo-400">About</Link></li>
              <li><Link href="#" className="hover:text-indigo-400">FAQ</Link></li>
              <li><Link href="#" className="hover:text-indigo-400">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-indigo-400">Terms of Use</Link></li>
              <li><Link href="#" className="hover:text-indigo-400">Contact</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div>
            © {new Date().getFullYear()} EduMathAI. All rights reserved.
          </div>
          <div className="flex items-center gap-1">
            <span>Built with precision for mathematics education</span>
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 ml-1" />
          </div>
        </div>
      </div>
    </footer>
  );
};
