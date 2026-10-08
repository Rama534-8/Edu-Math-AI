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
import { askTutorAI } from '@/lib/ai-service';
import {
  Bot,
  Sparkles,
  Lightbulb,
  HelpCircle,
  RotateCcw,
  Languages,
  BookOpen,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export default function AITutorPage() {
  const [topicTitle, setTopicTitle] = useState('Polynomials & Factorization');
  const [studentQuestion, setStudentQuestion] = useState('How do I factorize 6x² + 17x + 5 by splitting the middle term?');
  const [language, setLanguage] = useState<'ENGLISH' | 'TELUGU' | 'SIMPLE_ENGLISH'>('ENGLISH');
  const [stepStage, setStepStage] = useState<'HINT' | 'ADDITIONAL_HINT' | 'STEP_BY_STEP' | 'FINAL_SOLUTION' | 'SIMILAR_QUESTION'>('HINT');
  const [isLoading, setIsLoading] = useState(false);
  const [tutorOutput, setTutorOutput] = useState<{
    content: string;
    latex?: string;
    suggestedPrompts: string[];
  } | null>(null);

  const sampleQuestions = [
    { topic: 'Linear Equations', q: 'Solve for x: 3(x - 2) + 4 = 2x + 7' },
    { topic: 'Polynomials', q: 'How do I factorize 6x² + 17x + 5?' },
    { topic: "Heron's Formula", q: 'How to find the area of a triangle with sides 6cm, 8cm, 10cm?' },
    { topic: 'Lines and Angles', q: 'If two supplementary angles are in ratio 4:5, find the angles.' },
  ];

  const handleAskStep = async (step: typeof stepStage) => {
    setStepStage(step);
    setIsLoading(true);
    try {
      const response = await askTutorAI({
        topicTitle,
        studentQuestion,
        stepRequested: step,
        language,
      });
      setTutorOutput(response);
    } catch (e) {
      console.error(e);
      setTutorOutput({
        content: e instanceof Error ? e.message : 'AI Tutor is temporarily unavailable. Please try again.',
        suggestedPrompts: [],
      });
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
              title="AI Mathematics Tutor"
              subtitle="Step-by-step pedagogical coaching with English & Telugu bilingual support"
            />

            <div className="p-6 max-w-6xl w-full mx-auto space-y-6">
              {/* Top Guided Teaching Flow Indicator */}
              <Card className="p-6 bg-slate-900 text-white shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold">Guided Learning Pipeline</h2>
                      <p className="text-xs text-slate-400">
                        The AI guides your intuition before showing final answers
                      </p>
                    </div>
                  </div>

                  {/* Language Selector */}
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-800 border border-slate-700 text-xs">
                    <button
                      onClick={() => setLanguage('ENGLISH')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                        language === 'ENGLISH' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => setLanguage('TELUGU')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                        language === 'TELUGU' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      తెలుగు (Telugu)
                    </button>
                    <button
                      onClick={() => setLanguage('SIMPLE_ENGLISH')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                        language === 'SIMPLE_ENGLISH' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Simple English
                    </button>
                  </div>
                </div>

                {/* 5 Progress Stages */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs text-center pt-2">
                  {[
                    { key: 'HINT', label: '1. Hint', icon: Lightbulb },
                    { key: 'ADDITIONAL_HINT', label: '2. Extra Hint', icon: HelpCircle },
                    { key: 'STEP_BY_STEP', label: '3. Steps', icon: BookOpen },
                    { key: 'FINAL_SOLUTION', label: '4. Solution', icon: CheckCircle2 },
                    { key: 'SIMILAR_QUESTION', label: '5. Similar Practice', icon: RotateCcw },
                  ].map((st) => {
                    const Icon = st.icon;
                    const isActive = stepStage === st.key;
                    return (
                      <button
                        key={st.key}
                        onClick={() => handleAskStep(st.key as 'HINT' | 'ADDITIONAL_HINT' | 'STEP_BY_STEP' | 'FINAL_SOLUTION' | 'SIMILAR_QUESTION')}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isActive
                            ? 'border-indigo-500 bg-indigo-600/30 text-white ring-2 ring-indigo-500/30'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{st.label}</span>
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* Question Input and Presets */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 p-6 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    Enter Your Math Doubt or Problem
                  </h3>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Mathematics Topic
                    </label>
                    <input
                      type="text"
                      value={topicTitle}
                      onChange={(e) => setTopicTitle(e.target.value)}
                      placeholder="e.g. Polynomials, Coordinate Geometry, Heron's Formula"
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Your Math Problem / Question
                    </label>
                    <textarea
                      rows={3}
                      value={studentQuestion}
                      onChange={(e) => setStudentQuestion(e.target.value)}
                      placeholder="Type your question or expression..."
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => handleAskStep('HINT')}
                      isLoading={isLoading && stepStage === 'HINT'}
                      leftIcon={<Lightbulb className="w-3.5 h-3.5 text-amber-300" />}
                    >
                      Give Me a Hint
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAskStep('STEP_BY_STEP')}
                      isLoading={isLoading && stepStage === 'STEP_BY_STEP'}
                    >
                      Show Step-by-Step
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAskStep('SIMILAR_QUESTION')}
                      isLoading={isLoading && stepStage === 'SIMILAR_QUESTION'}
                    >
                      Generate Similar Practice
                    </Button>
                  </div>
                </Card>

                {/* Sample Presets */}
                <Card className="p-6">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
                    Try Sample Class 9 Doubts
                  </h3>
                  <div className="space-y-2 text-xs">
                    {sampleQuestions.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setTopicTitle(s.topic);
                          setStudentQuestion(s.q);
                          handleAskStep('HINT');
                        }}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-left hover:bg-indigo-50 dark:hover:bg-slate-900 transition-colors"
                      >
                        <span className="font-bold text-indigo-600 block text-[11px]">{s.topic}</span>
                        <span className="text-slate-700 dark:text-slate-300 line-clamp-2">{s.q}</span>
                      </button>
                    ))}
                  </div>
                </Card>
              </div>

              {/* AI Tutor Output Card */}
              {tutorOutput && (
                <Card className="p-6 sm:p-8 border-indigo-200 dark:border-indigo-900 shadow-xl space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Bot className="w-5 h-5 text-indigo-600" />
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        AI Tutor Response ({stepStage.replace('_', ' ')})
                      </span>
                    </div>
                    <Badge variant="purple" size="sm">
                      {language}
                    </Badge>
                  </div>

                  <div className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 space-y-3">
                    <MixedMathText text={tutorOutput.content} />
                  </div>

                  {tutorOutput.latex && (
                    <div className="p-4 rounded-xl bg-slate-900 text-white text-center">
                      <MathRenderer math={tutorOutput.latex} inline={false} />
                    </div>
                  )}

                  {/* Suggested Prompts */}
                  {tutorOutput.suggestedPrompts && tutorOutput.suggestedPrompts.length > 0 && (
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-semibold text-slate-500 block mb-2">
                        Suggested Next Steps:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {tutorOutput.suggestedPrompts.map((p, pIdx) => (
                          <button
                            key={pIdx}
                            onClick={() => {
                              if (p.toLowerCase().includes('hint')) handleAskStep('ADDITIONAL_HINT');
                              else if (p.toLowerCase().includes('step')) handleAskStep('STEP_BY_STEP');
                              else if (p.toLowerCase().includes('similar')) handleAskStep('SIMILAR_QUESTION');
                              else handleAskStep('STEP_BY_STEP');
                            }}
                            className="px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200 dark:border-indigo-800 transition-colors"
                          >
                            ⚡ {p}
                          </button>
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
