'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { BookOpen, Sigma, HelpCircle, Trash2 } from 'lucide-react';

interface Bookmark {
  id: string;
  itemType: 'LESSON' | 'FORMULA' | 'QUESTION';
  itemId: string;
  board: string | null;
  chapterId: string | null;
  topicId: string | null;
  title: string | null;
  createdAt: string;
}

const TYPE_META = {
  LESSON: { label: 'Lesson', icon: BookOpen, tone: 'info' as const },
  FORMULA: { label: 'Formula', icon: Sigma, tone: 'purple' as const },
  QUESTION: { label: 'Question', icon: HelpCircle, tone: 'warning' as const },
};

const FILTERS = ['ALL', 'LESSON', 'FORMULA', 'QUESTION'] as const;

export default function StudentBookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/student/bookmarks', { credentials: 'same-origin' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load bookmarks.');
      setBookmarks((json.bookmarks as Bookmark[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load bookmarks.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const remove = async (b: Bookmark) => {
    setError('');
    try {
      const res = await fetch(
        `/api/student/bookmarks?itemType=${encodeURIComponent(b.itemType)}&itemId=${encodeURIComponent(b.itemId)}`,
        { method: 'DELETE', credentials: 'same-origin' }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to remove bookmark.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to remove bookmark.');
    }
  };

  const visible = filter === 'ALL' ? bookmarks : bookmarks.filter((b) => b.itemType === filter);
  const counts = {
    ALL: bookmarks.length,
    LESSON: bookmarks.filter((b) => b.itemType === 'LESSON').length,
    FORMULA: bookmarks.filter((b) => b.itemType === 'FORMULA').length,
    QUESTION: bookmarks.filter((b) => b.itemType === 'QUESTION').length,
  };

  return (
    <RoleGuard allowedRoles={['STUDENT']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex-1 flex">
          <Sidebar />
          <main className="flex-1 flex flex-col min-w-0">
            <Header title="Saved & Bookmarks" subtitle="Lessons, formulas and questions you saved for later" />
            <div className="mx-auto w-full max-w-5xl space-y-4 p-4 sm:p-6">
              {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300" role="alert">
                  {error}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      filter === f
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    {f === 'ALL' ? 'All' : TYPE_META[f].label} ({counts[f]})
                  </button>
                ))}
              </div>

              {loading ? (
                <Card className="p-10 text-center text-sm text-slate-500">Loading saved items...</Card>
              ) : visible.length === 0 ? (
                <Card className="p-10 text-center">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Nothing saved yet</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Save lessons, formulas and important questions to find them here.
                  </p>
                  <Link href="/student/learn" className="mt-3 inline-block text-xs font-semibold text-indigo-600 hover:underline">
                    Browse lessons
                  </Link>
                </Card>
              ) : (
                <div className="space-y-3">
                  {visible.map((b) => {
                    const meta = TYPE_META[b.itemType];
                    const Icon = meta.icon;
                    const href =
                      b.itemType === 'LESSON'
                        ? `/student/learn/${b.itemId}`
                        : b.chapterId
                          ? `/student/learn/${b.chapterId}`
                          : '/student/learn';
                    return (
                      <Card key={b.id} className="flex items-start gap-3 p-4">
                        <span className="mt-0.5 rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={meta.tone} size="sm">{meta.label}</Badge>
                            {b.board ? <Badge variant="secondary" size="sm">{b.board}</Badge> : null}
                          </div>
                          <p className="mt-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {b.title || b.itemId}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Saved {new Date(b.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Link
                            href={href}
                            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-950/50"
                          >
                            Open
                          </Link>
                          <button
                            onClick={() => remove(b)}
                            title="Remove bookmark"
                            aria-label={`Remove ${b.title || b.itemId}`}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
