'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, X, CheckCheck } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: number;
  link?: string;
  created_at: string;
}

const TYPE_ICONS: Record<string, string> = {
  BADGE: '🏅',
  ANNOUNCEMENT: '📢',
  ASSIGNMENT: '📚',
  QUIZ: '📝',
  RESULT: '📊',
  DEADLINE: '⏰',
  PROGRESS: '📈',
};

const TYPE_LABELS: Record<string, string> = {
  BADGE: 'Achievement',
  ANNOUNCEMENT: 'Announcement',
  ASSIGNMENT: 'Assignment',
  QUIZ: 'Quiz',
  RESULT: 'Result',
  DEADLINE: 'Deadline',
  PROGRESS: 'Progress',
};

export function NotificationBell() {
  const [open, setOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const ref = React.useRef<HTMLDivElement>(null);

  const fetchNotifications = React.useCallback(() => {
    fetch('/api/notifications')
      .then((r) => r.json())
      .then((data) => {
        if (data.notifications) setNotifications(data.notifications);
        if (typeof data.unreadCount === 'number') setUnreadCount(data.unreadCount);
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // poll every 60s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close panel when clicking outside
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    setUnreadCount(0);
  };

  const markOneRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return `${Math.floor(diffHrs / 24)}d ago`;
  };

  return (
    <div className="relative" ref={ref}>
      <button
        id="notification-bell-btn"
        aria-label="Notifications"
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          id="notification-panel"
          className="absolute right-0 top-12 w-80 max-h-[480px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 text-xs font-semibold text-rose-500">
                  {unreadCount} new
                </span>
              )}
            </h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  title="Mark all as read"
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => {
                const inner = (
                  <div
                    key={n.id}
                    onClick={() => !n.is_read && markOneRead(n.id)}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${
                      !n.is_read ? 'bg-indigo-50/60 dark:bg-indigo-950/20' : ''
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-base flex-shrink-0 mt-0.5">
                      {TYPE_ICONS[n.type] ?? '🔔'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          {TYPE_LABELS[n.type] ?? n.type}
                        </span>
                      </div>
                      <p className={`text-xs font-bold truncate ${!n.is_read ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">{formatTime(n.created_at)}</p>
                    </div>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                );
                return n.link ? (
                  <Link href={n.link} key={n.id} onClick={() => setOpen(false)}>
                    {inner}
                  </Link>
                ) : (
                  <div key={n.id}>{inner}</div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
