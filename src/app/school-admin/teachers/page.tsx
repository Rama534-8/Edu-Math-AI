'use client';

import React, { useEffect, useState } from 'react';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Loader2, Mail, Phone, Users } from 'lucide-react';

interface TeacherRow {
  id: string;
  email: string;
  createdAt: string;
  displayName: string | null;
  phoneNumber: string | null;
  profilePicture: string | null;
}

export default function SchoolAdminTeachersPage() {
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/teachers', { credentials: 'same-origin' })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load teachers.');
        if (!cancelled) setTeachers(json.teachers as TeacherRow[]);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load teachers.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <RoleGuard allowedRoles={['SCHOOL_ADMIN', 'PLATFORM_ADMIN']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex-1 flex">
          <Sidebar />
          <main className="flex-1 flex flex-col min-w-0">
            <Header title="Faculty & Teachers" subtitle="All registered teacher accounts" />
            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
              {error && (
                <Card className="p-4 text-sm text-rose-700 dark:text-rose-300" role="alert">{error}</Card>
              )}

              {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-20 text-slate-500" role="status">
                  <Loader2 className="w-5 h-5 animate-spin" /> Loading teachers...
                </div>
              ) : teachers.length === 0 ? (
                <Card className="p-12 text-center border-dashed">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
                    No Teachers Registered
                  </h3>
                  <p className="text-sm text-slate-500 max-w-md mx-auto">
                    No teacher accounts have been created yet. Teachers can register using the registration page with the &quot;Teacher&quot; role.
                  </p>
                </Card>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {teachers.length} Teacher{teachers.length !== 1 ? 's' : ''} Registered
                    </h2>
                    <Badge variant="info" size="sm">Live data</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {teachers.map((teacher) => (
                      <Card key={teacher.id} className="p-5">
                        <div className="flex items-center gap-3 mb-3">
                          {teacher.profilePicture ? (
                             
                            <img
                              src={teacher.profilePicture}
                              alt=""
                              className="w-11 h-11 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center text-sky-700 dark:text-sky-300 font-bold text-sm">
                              {(teacher.displayName || teacher.email).charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                              {teacher.displayName || 'Unnamed Teacher'}
                            </h3>
                            <Badge variant="secondary" size="sm">Teacher</Badge>
                          </div>
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-500">
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate">{teacher.email}</span>
                          </div>
                          {teacher.phoneNumber && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span>•••• {teacher.phoneNumber.slice(-4)}</span>
                            </div>
                          )}
                          <p className="text-[10px] text-slate-400 mt-2">
                            Registered: {new Date(teacher.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </Card>
                    ))}
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
