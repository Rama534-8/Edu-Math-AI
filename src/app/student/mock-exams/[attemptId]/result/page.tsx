'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  CheckCircle2, XCircle, Clock, Award, ChevronLeft, AlertTriangle, Play 
} from 'lucide-react';

export default function MockExamResultPage() {
  const params = useParams();
  const attemptId = params?.attemptId as string;
  const router = useRouter();

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [result, setResult] = React.useState<any>(null);

  React.useEffect(() => {
    if (!attemptId) return;
    fetch(`/api/mock-exam/${attemptId}/result`)
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setResult(data);
      })
      .catch(() => setError('Failed to load result'))
      .finally(() => setLoading(false));
  }, [attemptId]);

  if (loading) {
    return (
      <RoleGuard allowedRoles={['STUDENT']}>
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <p className="text-slate-500 animate-pulse">Loading results...</p>
        </div>
      </RoleGuard>
    );
  }

  if (error || !result) {
    return (
      <RoleGuard allowedRoles={['STUDENT']}>
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
          <Card className="p-8 max-w-md w-full text-center">
            <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
            <h2 className="text-base font-bold mb-2">Error Loading Result</h2>
            <p className="text-sm text-slate-500 mb-6">{error}</p>
            <Button onClick={() => router.push('/student/mock-exams')}>Back to Exams</Button>
          </Card>
        </div>
      </RoleGuard>
    );
  }

  const { attempt, answers } = result;
  const pass = attempt.result_status === 'PASS';
  const durationSecs = Math.floor((new Date(attempt.submitted_at).getTime() - new Date(attempt.started_at).getTime()) / 1000);

  return (
    <RoleGuard allowedRoles={['STUDENT']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex-1 flex">
          <Sidebar />
          <main className="flex-1 flex flex-col min-w-0">
            <Header 
              title="Exam Result" 
              subtitle={attempt.chapter_title || 'Full Mock Exam'} 
            />
            
            <div className="p-4 sm:p-6 max-w-4xl w-full mx-auto space-y-6">
              <div className="flex items-center gap-2">
                <Link href="/student/mock-exams">
                  <Button variant="ghost" size="sm" leftIcon={<ChevronLeft className="w-4 h-4"/>}>
                    Back to History
                  </Button>
                </Link>
              </div>

              {/* Summary Card */}
              <Card className="p-6 sm:p-8 text-center relative overflow-hidden">
                <div className="relative z-10 flex flex-col items-center">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                    pass ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                  }`}>
                    {pass ? <Award className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-2">
                    {pass ? 'Congratulations! You Passed!' : 'Needs Improvement'}
                  </h2>
                  <p className="text-sm text-slate-500 max-w-sm mb-6">
                    {pass 
                      ? 'Great job! You met the minimum passing criteria. Review your answers below to see where you can improve.'
                      : 'You did not meet the passing criteria (40%). Keep practicing and try again!'}
                  </p>

                  <div className="flex flex-wrap justify-center gap-4 sm:gap-8 bg-white dark:bg-slate-900 px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="text-center">
                      <p className="text-xs font-bold text-slate-500 uppercase">Score</p>
                      <p className={`text-2xl font-black ${pass ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {attempt.percentage}%
                      </p>
                    </div>
                    <div className="w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
                    <div className="text-center">
                      <p className="text-xs font-bold text-slate-500 uppercase">Marks</p>
                      <p className="text-2xl font-black text-slate-800 dark:text-slate-100">
                        {attempt.obtained_marks} <span className="text-base text-slate-400">/ {attempt.total_marks}</span>
                      </p>
                    </div>
                    <div className="w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
                    <div className="text-center">
                      <p className="text-xs font-bold text-slate-500 uppercase">Time</p>
                      <p className="text-2xl font-black text-slate-800 dark:text-slate-100">
                        {Math.floor(durationSecs / 60)}m {durationSecs % 60}s
                      </p>
                    </div>
                  </div>
                </div>
                {/* Decorative background */}
                <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full opacity-10 blur-3xl ${
                  pass ? 'bg-emerald-500' : 'bg-rose-500'
                }`} />
              </Card>

              {/* Detailed Review */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">
                  Detailed Review
                </h3>
                <div className="space-y-4">
                  {answers.map((ans: any, idx: number) => {
                    const isCorrect = ans.is_correct === 1;
                    const unanswered = !ans.selected_answer || ans.selected_answer.trim() === '';
                    return (
                      <Card key={ans.question_id} className={`p-5 border-l-4 ${
                        unanswered ? 'border-l-slate-400' : isCorrect ? 'border-l-emerald-500' : 'border-l-rose-500'
                      }`}>
                        <div className="flex gap-4">
                          <div className="flex-shrink-0 mt-0.5">
                            {unanswered ? (
                              <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-slate-500">?</span>
                              </div>
                            ) : isCorrect ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-rose-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-500">
                              <span>Q{idx + 1}</span>
                              <span>•</span>
                              <span>{ans.marks_awarded} / {ans.max_marks} marks</span>
                            </div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 whitespace-pre-wrap">
                              {ans.question_text}
                            </p>
                            
                            <div className="space-y-2 text-sm bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                              <div className="flex gap-2">
                                <span className="font-bold text-slate-500 w-24">Your Answer:</span>
                                <span className={unanswered ? 'text-slate-400 italic' : isCorrect ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium'}>
                                  {unanswered ? 'Not answered' : ans.selected_answer}
                                </span>
                              </div>
                              {!isCorrect && (
                                <div className="flex gap-2">
                                  <span className="font-bold text-slate-500 w-24">Correct Answer:</span>
                                  <span className="text-slate-900 dark:text-slate-100 font-medium">
                                    {ans.correct_answer}
                                  </span>
                                </div>
                              )}
                              {ans.explanation && (
                                <div className="flex gap-2 mt-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                                  <span className="font-bold text-slate-500 w-24">Explanation:</span>
                                  <span className="text-slate-600 dark:text-slate-400">
                                    {ans.explanation}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
              
              <div className="text-center pt-4">
                 <Link href="/student/mock-exams">
                   <Button size="lg" rightIcon={<Play className="w-4 h-4"/>}>
                     Take Another Exam
                   </Button>
                 </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
