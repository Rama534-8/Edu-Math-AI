'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Users } from 'lucide-react';

export default function TeacherClassesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch('/api/teacher/classes', { credentials: 'same-origin' });
        if (!res.ok) throw new Error('Failed to fetch classes');
        const data = await res.json();
        setClasses(data.classes || []);
      } catch (error) {
        console.error('Error fetching classes:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchClasses();
  }, []);

  return (
    <RoleGuard allowedRoles={['TEACHER', 'SCHOOL_ADMIN', 'PLATFORM_ADMIN']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex-1 flex">
          <Sidebar />
          <main className="flex-1 flex min-w-0 flex-col">
            <Header title="Assigned Classes & Sections" subtitle="Authorized class roster and performance data" />
            <div className="mx-auto w-full max-w-6xl p-6">
              {isLoading ? (
                <div className="p-4 text-center text-slate-500">Loading classes...</div>
              ) : classes.length === 0 ? (
                <EmptyState
                  icon={<Users className="h-6 w-6" />}
                  title="No classes are assigned to you yet."
                  description="Once you are assigned classes by the school admin, they will appear here."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {classes.map((cls, idx) => (
                    <Card key={idx} className="p-6">
                      <h3 className="font-bold text-lg">{cls.className} - Section {cls.sectionName}</h3>
                      <p className="text-slate-500 text-sm">{cls.schoolName}</p>
                      <div className="mt-4 flex items-center text-slate-700 dark:text-slate-300">
                        <Users className="w-4 h-4 mr-2" />
                        <span>{cls.studentCount} Students</span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
