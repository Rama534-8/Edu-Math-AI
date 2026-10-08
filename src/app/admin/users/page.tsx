'use client';

import React, { useEffect, useState } from 'react';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Loader2, Users, ShieldCheck, UserCog, User, ShieldAlert } from 'lucide-react';

interface UserRow {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function PlatformAdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/users', { credentials: 'same-origin' })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load users.');
        if (!cancelled) setUsers(json.users as UserRow[]);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load users.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'PLATFORM_ADMIN': return <ShieldAlert className="w-4 h-4" />;
      case 'SCHOOL_ADMIN': return <ShieldCheck className="w-4 h-4" />;
      case 'TEACHER': return <UserCog className="w-4 h-4" />;
      case 'PARENT': return <Users className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'PLATFORM_ADMIN': return 'danger';
      case 'SCHOOL_ADMIN': return 'purple';
      case 'TEACHER': return 'info';
      case 'PARENT': return 'warning';
      default: return 'primary';
    }
  };

  return (
    <RoleGuard allowedRoles={['PLATFORM_ADMIN']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex-1 flex">
          <Sidebar />
          <main className="flex-1 flex flex-col min-w-0">
            <Header title="User Roles & Access" subtitle="Manage all system users across the platform" />
            
            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
              {error && (
                <Card className="p-4 text-sm text-rose-700 dark:text-rose-300" role="alert">{error}</Card>
              )}

              {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-20 text-slate-500" role="status">
                  <Loader2 className="w-5 h-5 animate-spin" /> Loading users...
                </div>
              ) : (
                <Card className="overflow-hidden">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-500" /> Platform Users
                    </h2>
                    <Badge variant="secondary" size="sm">{users.length} Total</Badge>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50/50 dark:bg-slate-900/20 text-slate-500 text-xs uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-4 font-semibold text-left">Email Address</th>
                          <th className="py-3 px-4 font-semibold text-left">Role</th>
                          <th className="py-3 px-4 font-semibold text-left">Account ID</th>
                          <th className="py-3 px-4 font-semibold text-right">Registered</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {users.map((user) => (
                          <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                              {user.email}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={getRoleBadgeVariant(user.role)} size="sm" className="flex w-fit items-center gap-1">
                                {getRoleIcon(user.role)} {user.role}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                              {user.id}
                            </td>
                            <td className="py-3 px-4 text-right text-xs text-slate-500">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
