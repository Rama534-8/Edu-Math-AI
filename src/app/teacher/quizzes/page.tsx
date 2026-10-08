'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, Plus, Loader2, ChevronRight, X, HelpCircle, CheckCircle2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Navbar } from '@/components/layout/Navbar';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/Card';

export default function TeacherQuizzesPage() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Drill-down state
  const [selectedQuiz, setSelectedQuiz] = useState<any | null>(null);
  const [quizDetails, setQuizDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchQuizzes = () => {
    setLoading(true);
    fetch('/api/teacher/quizzes')
      .then(res => res.json())
      .then(data => {
        if(data.quizzes) setQuizzes(data.quizzes);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const openQuizDetails = async (quiz: any) => {
    setSelectedQuiz(quiz);
    setQuizDetails(null);
    setLoadingDetails(true);

    try {
      const res = await fetch(`/api/teacher/quizzes/${quiz.id}`);
      const data = await res.json();
      if (res.ok && data.questions) {
        setQuizDetails(data);
      }
    } catch (e) {
      console.error('Failed to load quiz details', e);
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeDetails = () => {
    setSelectedQuiz(null);
    setQuizDetails(null);
  };

  return (
    <RoleGuard allowedRoles={['TEACHER', 'PLATFORM_ADMIN']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex-1 flex">
          <Sidebar />
          <main className="flex flex-1 min-w-0 flex-col">
            <Header title="Quizzes & Tests" subtitle="Create and track class assessments" />
            <div className="mx-auto w-full max-w-7xl p-6 flex gap-6 relative">
              
              {/* Main Quizzes List */}
              <div className={`flex-1 transition-all duration-300 ${selectedQuiz ? 'hidden md:block md:w-1/3' : 'w-full'}`}>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Your Quizzes</h2>
                  {/* This control previously had no handler, so the empty state's
                      "Create one to get started" was a dead end. Quiz creation only
                      happens together with questions (POST /api/teacher/quizzes/save),
                      so it routes to the AI Assistant flow that performs both. */}
                  <Link
                    href="/teacher/ai-assistant"
                    className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
                  >
                    <Plus className="w-4 h-4" /> Create Quiz
                  </Link>
                </div>
                
                {loading ? (
                  <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
                ) : quizzes.length === 0 ? (
                  <Card className="p-12 text-center text-slate-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No quizzes found. Create one to get started.</p>
                  </Card>
                ) : (
                  <div className={`grid gap-4 ${selectedQuiz ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                    {quizzes.map(q => (
                      <Card 
                        key={q.id} 
                        className={`p-5 cursor-pointer transition-all border-l-4 ${selectedQuiz?.id === q.id ? 'border-l-emerald-600 ring-2 ring-emerald-500/20 bg-slate-50 dark:bg-slate-800/50' : 'border-l-emerald-500 hover:shadow-md hover:-translate-y-1'}`}
                        onClick={() => openQuizDetails(q)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-lg mb-1">{q.title}</h3>
                            <p className="text-sm text-slate-500 mb-4">{q.subject} • {q.className} {q.sectionName}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-400 mt-1" />
                        </div>
                        <div className="flex justify-between text-sm items-center">
                          <span className="text-slate-400">{new Date(q.created_at).toLocaleDateString()}</span>
                          <span className="font-semibold px-2 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 rounded-md">{q.total_marks || 0} Marks</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Drill-down Panel */}
              {selectedQuiz && (
                <div className="flex-1 w-full md:w-2/3 md:max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg flex flex-col h-[calc(100vh-12rem)] sticky top-6 overflow-hidden">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
                    <div>
                      <h2 className="font-bold text-lg">{selectedQuiz.title}</h2>
                      <p className="text-xs text-slate-500">{selectedQuiz.className} {selectedQuiz.sectionName} • {selectedQuiz.subject}</p>
                    </div>
                    <button 
                      onClick={closeDetails}
                      className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-500"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {loadingDetails ? (
                      <div className="flex flex-col items-center justify-center h-full text-slate-500">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-2" />
                        <p>Loading quiz details...</p>
                      </div>
                    ) : quizDetails?.questions?.length > 0 ? (
                      quizDetails.questions.map((q: any, i: number) => (
                        <div key={q.id} className="border border-slate-100 dark:border-slate-800 rounded-xl p-5 bg-slate-50/50 dark:bg-slate-900/20">
                          <div className="flex justify-between items-start mb-4">
                            <h4 className="font-semibold flex gap-2">
                              <span className="text-emerald-600">Q{i + 1}.</span> 
                              <span className="text-slate-800 dark:text-slate-200">{q.question_text}</span>
                            </h4>
                            {q.marks && (
                              <span className="shrink-0 text-xs font-semibold px-2 py-1 bg-slate-200 dark:bg-slate-800 rounded-md text-slate-600 dark:text-slate-300">
                                {q.marks} Marks
                              </span>
                            )}
                          </div>
                          
                          <div className="space-y-2 mt-4 ml-6">
                            {(Array.isArray(q.options) ? q.options : []).map((opt: string, optIdx: number) => {
                              const isCorrect = q.correct_answer === opt;
                              return (
                                <div 
                                  key={optIdx} 
                                  className={`p-3 rounded-lg text-sm border flex items-center justify-between ${
                                    isCorrect 
                                      ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 font-medium' 
                                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900'
                                  }`}
                                >
                                  <span>{String.fromCharCode(65 + optIdx)}. {opt}</span>
                                  {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                                </div>
                              );
                            })}
                          </div>

                          {q.explanation && (
                            <div className="mt-4 ml-6 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 text-sm">
                              <div className="flex gap-2 items-center text-indigo-700 dark:text-indigo-400 mb-1 font-semibold">
                                <HelpCircle className="w-4 h-4" /> Explanation
                              </div>
                              <p className="text-indigo-900 dark:text-indigo-300">{q.explanation}</p>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-slate-500 py-12">
                        <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No questions found for this quiz.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}