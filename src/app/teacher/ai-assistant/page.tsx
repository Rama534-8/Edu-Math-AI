'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MathRenderer, MixedMathText } from '@/components/ui/MathRenderer';
import { Sparkles, CheckCircle2, ShieldCheck, Trash2 } from 'lucide-react';
import { Question } from '@/types';

export default function TeacherAIAssistantPage() {
  const [topic, setTopic] = useState('Polynomials');
  const [targetMistake, setTargetMistake] = useState('Sign & Transposition Errors');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [isLoading, setIsLoading] = useState(false);

  const [draftQuestions, setDraftQuestions] = useState<Question[]>([]);

  const [saveMsg, setSaveMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleGenerate = async () => {
    setIsLoading(true);
    setSaveMsg('');
    setErrorMsg('');
    try {
      // Dedicated teacher endpoint: returns a validated question object, so no
      // JSON scraping from model prose is needed here.
      const res = await fetch('/api/teacher/ai-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, targetMistake, difficulty }),
      });
      const d = await res.json();
      if (!res.ok) {
        throw new Error(d.error || 'Could not generate a question. Please try again.');
      }
      const generated = d.question as Question | undefined;
      if (!generated || typeof generated.questionText !== 'string' || !generated.questionText.trim()) {
        throw new Error('The AI returned a question without any question text. Please try again.');
      }
      setDraftQuestions((prev) => [{ ...generated, status: 'DRAFT' }, ...prev]);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not generate a question.');
      console.error('[Teacher AI Assistant]', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    const qToApprove = draftQuestions.find(q => q.id === id);
    if (!qToApprove) return;
    setSaveMsg('Saving...');
    try {
      const res = await fetch('/api/teacher/quizzes/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions: [qToApprove],
          title: `AI: ${qToApprove.questionText.slice(0, 50)}`,
        }),
      });
      if (res.ok) {
        setDraftQuestions(prev => prev.map(q => q.id === id ? { ...q, status: 'APPROVED' } : q));
        setSaveMsg('✓ Saved to Quiz Bank');
      } else {
        setSaveMsg('Failed to save. Try again.');
      }
    } catch {
      setSaveMsg('Network error.');
    }
  };

  const handleDelete = (id: string) => {
    setDraftQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  return (
    <RoleGuard allowedRoles={['TEACHER', 'PLATFORM_ADMIN']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />

        <div className="flex-1 flex">
          <Sidebar />

          <main className="flex-1 flex flex-col min-w-0">
            <Header
              title="AI Question Generator & Approval Workflow"
              subtitle="Generate curriculum questions targeting specific class mistakes. All items remain DRAFT until teacher approval."
            />

            <div className="p-6 max-w-5xl w-full mx-auto space-y-6">
              {/* Generator Settings Card */}
              <Card className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Target Chapter / Topic
                    </label>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Target Mistake Pattern
                    </label>
                    <select
                      value={targetMistake}
                      onChange={(e) => setTargetMistake(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                    >
                      <option value="Sign & Transposition Errors">Sign & Transposition Errors</option>
                      <option value="Formula Recall & Application">Formula Recall & Application</option>
                      <option value="Arithmetic Calculation Slip">Arithmetic Calculation Slip</option>
                      <option value="Supplementary vs Complementary">Supplementary vs Complementary</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Difficulty Level
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                    >
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 flex-wrap gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Academic Quality Guard: Teacher Approval Required</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {errorMsg && (
                <p
                  role="alert"
                  className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300"
                >
                  {errorMsg}
                </p>
              )}
              {saveMsg && <span className={`text-xs font-semibold ${saveMsg.startsWith('✓') ? 'text-emerald-600' : 'text-rose-600'}`}>{saveMsg}</span>}
                    <Button
                      onClick={handleGenerate}
                      isLoading={isLoading}
                      size="sm"
                      leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                    >
                      Generate Targeted Question
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Drafts Queue */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Question Review & Approval Queue ({draftQuestions.length} Items)
                </h3>

                <div className="space-y-4">
                  {draftQuestions.map((q) => (
                    <Card
                      key={q.id}
                      className={`p-6 border transition-all ${
                        q.status === 'APPROVED'
                          ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/20'
                          : 'border-amber-300 dark:border-amber-800 bg-amber-50/20'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={q.status === 'APPROVED' ? 'success' : 'warning'}
                            size="sm"
                          >
                            STATUS: {q.status}
                          </Badge>
                          <span className="text-xs text-slate-400 font-mono">{q.id}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {q.status === 'DRAFT' && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleApprove(q.id)}
                              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                            >
                              Approve & Publish to Quiz Bank
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(q.id)}
                            className="text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                        <MixedMathText text={q.questionText} />
                      </div>

                      {q.latex && (
                        <div className="p-2.5 bg-slate-900 text-white rounded-xl text-center my-2">
                          <MathRenderer math={q.latex} inline={false} />
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div>
                          <strong>Correct Answer:</strong> {q.correctAnswer}
                        </div>
                        <div>
                          <strong>Explanation:</strong> {q.correctAnswerExplanation}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
