'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Brain, TrendingUp, AlertTriangle, CheckCircle2, ChevronRight, BookOpen, Clock, Zap } from 'lucide-react';

export default function RevisionHubPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/student/revision')
      .then(async (res) => {
        const resData = await res.json().catch(() => null);
        if (!res.ok) throw new Error(resData?.error || 'Failed to load revision data.');
        return resData;
      })
      .then((resData) => {
        if (!cancelled) setData(resData);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load revision data.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <RoleGuard allowedRoles={['STUDENT']}>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex flex-1 pt-16 h-[calc(100vh-4rem)]">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <Header 
              title="Smart Revision" 
              subtitle="Revise your weak areas, strengthen important concepts, and prepare for your next test."
            />
            
            <div className="p-6 max-w-7xl mx-auto space-y-6">
              
              {loading ? (
                <div className="flex items-center justify-center py-20 text-slate-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mr-2"></div>
                  Loading revision data...
                </div>
              ) : error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700" role="alert">
                  <p className="font-semibold">Unable to load Smart Revision</p>
                  <p className="mt-1 text-sm">{error}</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-6 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <BookOpen className="w-5 h-5 text-indigo-200" />
                        <h3 className="font-semibold text-lg">Total Sessions</h3>
                      </div>
                      <p className="text-3xl font-bold">{data?.overallStats?.totalSessions || 0}</p>
                    </Card>
                    <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-6 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <AlertTriangle className="w-5 h-5 text-amber-200" />
                        <h3 className="font-semibold text-lg">Needs Revision</h3>
                      </div>
                      <p className="text-3xl font-bold">
                        {data?.recommendations?.filter((r: any) => r.status === 'Needs Revision').length || 0}
                      </p>
                    </Card>
                    <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-6 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                        <h3 className="font-semibold text-lg">Strong Chapters</h3>
                      </div>
                      <p className="text-3xl font-bold">
                        {data?.recommendations?.filter((r: any) => r.status === 'Strong').length || 0}
                      </p>
                    </Card>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                      <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-500" />
                        Recommended Revision
                      </h2>
                    </div>
                    
                    {data?.recommendations?.length === 0 ? (
                      <div className="p-12 text-center text-slate-500">
                        <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-slate-700">You're all caught up!</h3>
                        <p>No revision recommendations at this time.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {data?.recommendations?.map((rec: any) => (
                          <div key={rec.chapterId} className="p-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-semibold text-slate-900">{rec.chapterName}</h3>
                                {rec.priority === 'high' && (
                                  <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">High Priority</Badge>
                                )}
                                {rec.status === 'Strong' && (
                                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">Strong</Badge>
                                )}
                                {rec.status === 'Recently Revised' && (
                                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">Recently Revised</Badge>
                                )}
                              </div>
                              <p className="text-sm text-slate-500 mb-2">{rec.reason}</p>
                              
                              {rec.stats && (
                                <div className="flex items-center gap-4 text-sm text-slate-600">
                                  <div className="flex items-center gap-1">
                                    <TrendingUp className="w-4 h-4" />
                                    Accuracy: {rec.stats.accuracy}%
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <Link href={`/student/revision/${rec.chapterId}`}>
                              <Button className="w-full sm:w-auto flex items-center justify-center gap-2">
                                Start Revision
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}