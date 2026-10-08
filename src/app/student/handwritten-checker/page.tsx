'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MathRenderer } from '@/components/ui/MathRenderer';
import { checkHandwrittenAnswerWithAI } from '@/lib/ai-service';
import { HandwrittenCheckResult } from '@/types';
import {
  FileCheck,
  Upload,
  Sparkles,
  CheckCircle2,
  FileImage,
} from 'lucide-react';

export default function HandwrittenCheckerPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkResult, setCheckResult] = useState<HandwrittenCheckResult | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Choose a JPEG, PNG, or WEBP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB.');
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRunCheck = async () => {
    if (!selectedImage) {
      setError('Upload a handwritten solution image first.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const result = await checkHandwrittenAnswerWithAI(selectedImage);
      setCheckResult(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The handwritten checker could not complete this request.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['STUDENT']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />

        <div className="flex-1 flex">
          <Sidebar />

          <main className="flex-1 flex flex-col min-w-0">
            <Header
              title="Handwritten Answer Sheet Checker"
              subtitle="Upload a photo of your notebook solution to verify intermediate mathematical steps"
            />

            <div className="p-6 max-w-6xl w-full mx-auto space-y-6">
              <Card className="p-6 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border-emerald-500/30">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white mb-1">
                      Step-by-Step Answer Sheet Verification
                    </h2>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                      Checks your handwritten homework or test copy. Detects sign transpositions, algebraic errors in intermediate lines, and provides immediate feedback before exams.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Upload Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-emerald-500" />
                    Upload Handwritten Answer Sheet
                  </h3>

                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-emerald-500 transition-colors">
                    {selectedImage ? (
                      <div className="space-y-3">
                        <img
                          src={selectedImage}
                          alt="Handwritten solution"
                          className="max-h-48 mx-auto rounded-xl shadow-md"
                        />
                        <p className="text-xs text-emerald-600 font-semibold">Answer sheet image loaded</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <FileImage className="w-10 h-10 text-slate-400 mx-auto" />
                        <div>
                          <label className="cursor-pointer text-xs font-bold text-indigo-600 hover:underline">
                            Upload solution photo
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </label>
                          <p className="text-[11px] text-slate-400 mt-1">JPEG / PNG from camera or gallery</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {error && <p className="text-sm text-rose-700 dark:text-rose-300" role="alert">{error}</p>}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleRunCheck}
                      isLoading={isLoading}
                      className="flex-1"
                      leftIcon={<Sparkles className="w-4 h-4" />}
                    >
                      Check Handwritten Steps
                    </Button>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Checking Standards
                  </h3>
                  <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <strong>Legibility Check:</strong> We ensure handwriting is clear. If illegible, the AI requests a clearer photo rather than guessing equations.
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <strong>Method Marks Evaluation:</strong> Evaluates intermediate formulas, theorem citations, and substitution arithmetic.
                    </div>
                  </div>
                </Card>
              </div>

              {/* Check Result */}
              {checkResult && (
                <Card className="p-6 sm:p-8 border-emerald-200 dark:border-emerald-900 shadow-xl space-y-6 animate-in fade-in">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                        Evaluated Question
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {checkResult.extractedQuestionText}
                      </h3>
                    </div>
                    <Badge
                      variant={checkResult.overallStatus === 'CORRECT' ? 'success' : 'warning'}
                      size="md"
                    >
                      {checkResult.overallStatus}
                    </Badge>
                  </div>

                  {/* Step Breakdown */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Step-by-Step Handwriting Analysis:
                    </h4>
                    {(checkResult.detectedSteps.length > 0 ? checkResult.detectedSteps : []).map((st, stIdx) => (
                      <div
                        key={`${st.stepIndex}-${stIdx}`}
                        className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                          st.isCorrect
                            ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                            : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            Step {st.stepIndex}: {st.rawText}
                          </span>
                          <span
                            className={`font-bold ${
                              st.isCorrect ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {st.isCorrect ? '✓ Correct Step' : '✗ Mistake Detected'}
                          </span>
                        </div>
                        {st.latexForm && (
                          <div className="p-2 rounded bg-slate-900 text-white font-mono text-center">
                            <MathRenderer math={st.latexForm} inline={false} />
                          </div>
                        )}
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">
                          Feedback: {st.feedback}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Verdict */}
                  <div className="p-4 rounded-xl bg-slate-900 text-white text-xs space-y-1">
                    <span className="text-emerald-400 font-bold block">
                      Overall Teacher Verdict:
                    </span>
                    <p className="text-slate-200">{checkResult.finalVerdict}</p>
                    <span className="text-indigo-400 block pt-1">
                      Recommended Revision: {checkResult.recommendedRevisionTopic}
                    </span>
                  </div>
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
