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
import { solveMathImageWithAI } from '@/lib/ai-service';
import { SolverResult } from '@/lib/ai-normalize';
import {
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  FileImage,
} from 'lucide-react';

export default function AISolverPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [solverResult, setSolverResult] = useState<SolverResult | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Choose a JPG, PNG, or WEBP image.');
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

  const handleRunSolve = async () => {
    if (!selectedImage) {
      setError('Upload a math problem image first.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const result = await solveMathImageWithAI(selectedImage);
      setSolverResult(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The AI solver could not complete this request.');
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
              title="AI Image Maths Solver"
              subtitle="Upload a photo of any textbook math problem for verified OCR & step-by-step resolution"
            />

            <div className="p-6 max-w-6xl w-full mx-auto space-y-6">
              {/* Vision Solver Banner */}
              <Card className="p-6 bg-gradient-to-r from-purple-900/40 via-indigo-950/40 to-slate-900 border-purple-500/30">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white mb-1">
                      Multimodal Mathematical Equation Recognition
                    </h2>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                      Upload photos of algebra equations, geometry diagrams, or word problems. Our engine recognizes symbols, maps to Class 9 concepts, and shows complete derivations.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Upload Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-indigo-500" />
                    Upload Math Problem Image
                  </h3>

                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-indigo-500 transition-colors">
                    {selectedImage ? (
                      <div className="space-y-3">
                        <img
                          src={selectedImage}
                          alt="Uploaded question"
                          className="max-h-48 mx-auto rounded-xl shadow-md"
                        />
                        <p className="text-xs text-emerald-600 font-semibold">Image loaded ready for OCR</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <FileImage className="w-10 h-10 text-slate-400 mx-auto" />
                        <div>
                          <label className="cursor-pointer text-xs font-bold text-indigo-600 hover:underline">
                            Click to upload image
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </label>
                          <p className="text-[11px] text-slate-400 mt-1">PNG, JPG or JPEG up to 5MB</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {error && <p className="text-sm text-rose-700 dark:text-rose-300" role="alert">{error}</p>}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleRunSolve()}
                      isLoading={isLoading}
                      className="flex-1"
                      leftIcon={<Sparkles className="w-4 h-4" />}
                    >
                      Solve with AI
                    </Button>
                  </div>
                </Card>

                {/* Accuracy & No-Hallucination Guarantee */}
                <Card className="p-6">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Accuracy & Vision Guardrails
                  </h3>
                  <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <strong>Zero Hallucination Rule:</strong> If an image is blurry, angled, or cut off, the solver prompts for a clearer image instead of inventing arbitrary formulas.
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <strong>LaTeX Formula Standards:</strong> Equations are verified using standard algebraic balance and geometry axioms.
                    </div>
                  </div>
                </Card>
              </div>

              {/* Solution Output */}
              {solverResult && !solverResult.isReadable && (
                <Card className="p-6 sm:p-8 border-amber-200 dark:border-amber-900 shadow-xl space-y-2 animate-in fade-in">
                  <h3 className="text-base font-bold text-amber-900 dark:text-amber-100">
                    Image could not be read
                  </h3>
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    {solverResult.unreadableReason ||
                      'Please upload a clearer, straight-on photo of a single math problem.'}
                  </p>
                </Card>
              )}

              {solverResult?.isReadable && (
                <Card className="p-6 sm:p-8 border-indigo-200 dark:border-indigo-900 shadow-xl space-y-6 animate-in fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                        {solverResult.concept}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        Extracted Question: {solverResult.extractedQuestion}
                      </h3>
                    </div>
                    <Badge variant="success" size="md">
                      Verified Solution
                    </Badge>
                  </div>

                  {/* Step by Step Working */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Step-by-Step Derivation:
                    </h4>
                    <div className="space-y-3">
                      {solverResult.stepByStepSolution.map((st) => (
                        <div
                          key={st.step}
                          className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-indigo-600">Step {st.step}</span>
                          </div>
                          <p className="text-slate-800 dark:text-slate-200">{st.text}</p>
                          {st.latex && (
                            <div className="p-2.5 rounded-lg bg-slate-950 text-white text-center font-mono">
                              <MathRenderer math={st.latex} inline={false} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Final Answer Banner */}
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                        Final Answer:
                      </span>
                      <span className="text-lg font-black text-emerald-900 dark:text-emerald-100 font-mono">
                        {solverResult.finalAnswer}
                      </span>
                    </div>
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  </div>

                  {/* Similar Questions */}
                  {solverResult.similarQuestions?.length > 0 && (
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-500 block mb-2">
                        Similar Practice Questions to Try:
                      </span>
                      <div className="space-y-2 text-xs">
                        {solverResult.similarQuestions.map((sim, sIdx) => (
                          <div
                            key={sIdx}
                            className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                          >
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              • {sim}
                            </span>
                            <Button size="sm" variant="ghost" className="text-xs text-indigo-600">
                              Practice
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
