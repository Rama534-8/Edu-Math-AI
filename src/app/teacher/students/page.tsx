'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Eye } from 'lucide-react';
import { StudentProfile } from '@/types';

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scopeMessage, setScopeMessage] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch('/api/users/students', { credentials: 'same-origin' });
        if (!res.ok) throw new Error('Failed to fetch students');
        const data = await res.json();
        setStudents(data.students || []);
        if (data.scopeConfigured === false) setScopeMessage(data.message || 'No student assignments are configured.');
      } catch (error) {
        console.error('Error fetching students:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, []);

  return (
    <RoleGuard allowedRoles={['TEACHER', 'SCHOOL_ADMIN', 'PLATFORM_ADMIN']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />

        <div className="flex-1 flex">
          <Sidebar />

          <main className="flex-1 flex flex-col min-w-0">
            <Header
              title="Class 9 Enrolled Students Directory"
              subtitle="Monitor authorized student performance, baseline snapshots, and verified improvement"
            />

            <div className="p-6 max-w-6xl w-full mx-auto space-y-6">
              <Card className="p-6">
                <div className="overflow-x-auto">
                  {isLoading ? (
                    <div className="p-4 text-center text-slate-500">Loading students...</div>
                  ) : students.length === 0 ? (
                    <div className="p-4 text-center text-slate-500">
                      {scopeMessage || 'No students are assigned to this account.'}
                    </div>
                  ) : (
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3.5 rounded-l-xl">Student Name</th>
                        <th className="p-3.5">Board / Medium</th>
                        <th className="p-3.5 text-center">Latest Result</th>
                        <th className="p-3.5 text-center">Level / XP</th>
                        <th className="p-3.5 text-center">Questions Solved</th>
                        <th className="p-3.5 text-right rounded-r-xl">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {students.map((st) => (
                        <tr key={st.uid} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                          <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                            {st.displayName || 'Unknown Student'}
                          </td>
                          <td className="p-3.5 text-slate-500">
                            {st.board || 'Not set'} • {st.medium || 'Not set'}
                          </td>
                          <td className="p-3.5 text-center">
                            {st.baselineCompleted ? (
                              <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold ${st.baselineScore && st.baselineScore >= 40 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                {st.baselineScore ? `${st.baselineScore}%` : 'N/A'}
                                <span className="ml-1">{st.baselineScore && st.baselineScore >= 40 ? 'PASS' : 'FAIL'}</span>
                              </span>
                            ) : 'N/A'}
                          </td>
                          <td className="p-3.5 text-center font-mono text-emerald-600 font-bold">
                            Lvl {st.level || 1} ({st.xp || 0} XP)
                          </td>
                          <td className="p-3.5 text-center">
                            {st.questionsSolved || 0}
                          </td>
                          <td className="p-3.5 text-right">
                            <Link href={`/student/before-after/report?studentId=${st.uid}`}>
                              <Button size="sm" variant="ghost" className="text-xs text-indigo-600">
                                <Eye className="w-3.5 h-3.5 mr-1" /> View Report
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  )}
                </div>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
