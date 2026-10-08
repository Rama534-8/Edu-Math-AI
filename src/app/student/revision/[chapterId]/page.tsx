'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MixedMathText } from '@/components/ui/MathRenderer';
import { BookOpen, PenTool, CheckCircle2, ArrowRight, Bot, Target, XCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RevisionQuestion {
  id: string;
  questionText: string;
  options: { id: string; text: string }[];
  correctAnswer: string;
  correctAnswerExplanation: string;
  difficulty: string;
  hint1?: string;
  hint2?: string;
}

interface ChapterData {
  chapter: {
    id: string;
    name: string;
    title: string;
    topics: {
      title: string;
      titleTelugu?: string;
      description?: string;
      lessons?: { title?: string; revisionNotes?: string[] }[];
    }[];
  };
  revision: { sessions_completed: number; practice_attempted: number; practice_correct: number; best_quiz_score: number };
  notes: { topics: string[]; content: string | null };
  questions: RevisionQuestion[];
}

export default function ChapterRevisionPage({ params }: { params: Promise<{ chapterId: string }> }) {
  const { chapterId } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ChapterData | null>(null);
  const [activeTab, setActiveTab] = useState<'NOTES' | 'PRACTICE' | 'QUIZ' | 'AI'>('NOTES');
  const [error, setError] = useState('');

  // Practice State
  const [qIndex, setQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    fetch(`/api/student/revision/${chapterId}`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.error) {
          setError(resData.error);
        } else {
          setData(resData);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [chapterId]);

  const currentQ = data?.questions?.[qIndex];

  const handleCheckAnswer = async () => {
    if (!selectedAnswer || !currentQ) return;

    const correct = selectedAnswer === currentQ.correctAnswer;
    setIsCorrect(correct);
    setIsAnswerChecked(true);

    if (correct) {
      try { confetti({ particleCount: 50, spread: 60 }); } catch (_e) { /* */ }
    }

    try {
      await fetch(`/api/student/revision/${chapterId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: activeTab === 'PRACTICE' ? 'PRACTICE_ANSWER' : 'QUIZ_SUBMIT',
          isCorrect: correct,
          score: correct ? 100 : 0,
        }),
      });
    } catch (_e) {
      console.error(_e);
    }
  };

  const nextQuestion = () => {
    setSelectedAnswer('');
    setIsAnswerChecked(false);
    setIsCorrect(false);
    if (data && qIndex < data.questions.length - 1) {
      setQIndex(qIndex + 1);
    } else {
      setQIndex(0);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1 pt-16 h-[calc(100vh-4rem)]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-500 font-medium">{error}</div>
          ) : data ? (
            <>
              <Header
                title={`Revision: ${data.chapter.title}`}
                subtitle="Master this chapter with quick notes, practice questions, and AI help."
              />

              <div className="p-6 max-w-7xl mx-auto space-y-6">

                {/* Tabs */}
                <div className="flex overflow-x-auto bg-white p-2 rounded-xl shadow-sm border border-slate-200 gap-2">
                  <Button
                    variant={activeTab === 'NOTES' ? 'primary' : 'ghost'}
                    onClick={() => setActiveTab('NOTES')}
                    className="flex items-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" /> Notes
                  </Button>
                  <Button
                    variant={activeTab === 'PRACTICE' ? 'primary' : 'ghost'}
                    onClick={() => { setActiveTab('PRACTICE'); setQIndex(0); setIsAnswerChecked(false); setSelectedAnswer(''); }}
                    className="flex items-center gap-2"
                  >
                    <PenTool className="w-4 h-4" /> Practice
                  </Button>
                  <Button
                    variant={activeTab === 'QUIZ' ? 'primary' : 'ghost'}
                    onClick={() => { setActiveTab('QUIZ'); setQIndex(0); setIsAnswerChecked(false); setSelectedAnswer(''); }}
                    className="flex items-center gap-2"
                  >
                    <Target className="w-4 h-4" /> Revision Quiz
                  </Button>
                  <Button
                    variant={activeTab === 'AI' ? 'primary' : 'ghost'}
                    onClick={() => setActiveTab('AI')}
                    className="flex items-center gap-2"
                  >
                    <Bot className="w-4 h-4" /> AI Assistant
                  </Button>
                </div>

                {/* Tab Content */}
                {activeTab === 'NOTES' && (
                  <Card className="p-6">
                    <h3 className="text-xl font-bold mb-4">Chapter Topics &amp; Revision Notes</h3>
                    <div className="space-y-5">
                      {data.chapter.topics.map((topic, i) => {
                        const revisionNotes = (topic.lessons ?? []).flatMap((lesson) => lesson.revisionNotes ?? []);
                        return (
                          <div key={i} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-semibold text-slate-900">{topic.title}</h4>
                              <Badge variant="secondary" size="sm">Topic {i + 1}</Badge>
                            </div>
                            {topic.titleTelugu ? (
                              <p className="text-sm text-slate-500">{topic.titleTelugu}</p>
                            ) : null}
                            {topic.description ? (
                              <p className="mt-1 text-sm text-slate-600">{topic.description}</p>
                            ) : null}
                            {revisionNotes.length > 0 && (
                              <ul className="mt-2 space-y-1">
                                {revisionNotes.map((note, noteIndex) => (
                                  <li key={noteIndex} className="flex items-start gap-2 text-sm text-slate-600">
                                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-cyan-500" />
                                    {note}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-4 p-4 bg-amber-50 text-amber-800 rounded-lg border border-amber-200 text-sm">
                      Tip: use Practice and the Revision Quiz to apply these notes, or ask the AI Assistant for a refresher.
                    </div>
                  </Card>
                )}

                {(activeTab === 'PRACTICE' || activeTab === 'QUIZ') && (
                  <Card className="p-6">
                    {!currentQ ? (
                      <div className="text-center py-8 text-slate-500">
                        No questions available for this chapter yet.
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex justify-between text-sm font-medium text-slate-500">
                          <span>Question {qIndex + 1} of {data.questions.length}</span>
                          <Badge variant="secondary">{currentQ.difficulty}</Badge>
                        </div>

                        <div className="text-lg font-medium text-slate-900 bg-slate-50 p-6 rounded-xl border border-slate-100">
                          <MixedMathText text={currentQ.questionText} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {currentQ.options.map((opt) => {
                            const isSelected = selectedAnswer === opt.id;
                            let style = 'border-slate-200 hover:border-primary-300 hover:bg-primary-50';

                            if (isAnswerChecked) {
                              if (opt.id === currentQ.correctAnswer) {
                                style = 'border-emerald-500 bg-emerald-50';
                              } else if (isSelected) {
                                style = 'border-red-500 bg-red-50';
                              }
                            } else if (isSelected) {
                              style = 'border-primary-500 bg-primary-50 ring-2 ring-primary-500 ring-opacity-20';
                            }

                            return (
                              <button
                                key={opt.id}
                                disabled={isAnswerChecked}
                                onClick={() => setSelectedAnswer(opt.id)}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${style}`}
                              >
                                <MixedMathText text={opt.text} />
                              </button>
                            );
                          })}
                        </div>

                        {isAnswerChecked && currentQ.correctAnswerExplanation && (
                          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm font-semibold text-blue-900 mb-1">Explanation</p>
                            <p className="text-sm text-blue-800">{currentQ.correctAnswerExplanation}</p>
                          </div>
                        )}

                        <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                          {!isAnswerChecked ? (
                            <Button
                              onClick={handleCheckAnswer}
                              disabled={!selectedAnswer}
                              className="ml-auto"
                            >
                              Check Answer
                            </Button>
                          ) : (
                            <div className="w-full flex items-center justify-between">
                              <div className={`font-semibold flex items-center gap-2 ${isCorrect ? 'text-emerald-600' : 'text-red-600'}`}>
                                {isCorrect ? (
                                  <><CheckCircle2 className="w-5 h-5" /> Correct!</>
                                ) : (
                                  <><XCircle className="w-5 h-5" /> Incorrect</>
                                )}
                              </div>
                              <Button onClick={nextQuestion} className="flex items-center gap-2">
                                Next <ArrowRight className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                )}

                {activeTab === 'AI' && (
                  <Card className="p-6">
                    <div className="text-center py-8">
                      <Bot className="w-16 h-16 text-primary-500 mx-auto mb-4" />
                      <h3 className="text-xl font-bold mb-2">AI Revision Assistant</h3>
                      <p className="text-slate-500 mb-6 max-w-lg mx-auto">
                        Have a specific question about {data.chapter.title}? Ask the AI Assistant for help!
                      </p>
                      <Button onClick={() => router.push('/student/ai-tutor')}>
                        Go to AI Tutor
                      </Button>
                    </div>
                  </Card>
                )}

              </div>
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}
