'use client';

import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { Megaphone, Pin, Clock, AlertTriangle, CalendarDays, PartyPopper, ClipboardList, Sparkles } from 'lucide-react';

/** Announcement shape returned by every announcements API. */
export interface AnnouncementView {
  id: string;
  title: string;
  message: string;
  type: string;
  audience: string;
  isPinned?: boolean;
  isActive?: boolean;
  publishAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  authorName?: string | null;
  className?: string | null;
  sectionName?: string | null;
  schoolName?: string | null;
}

const TYPE_META: Record<string, { label: string; icon: React.ElementType; tone: 'info' | 'danger' | 'warning' | 'success' | 'purple' | 'secondary' }> = {
  GENERAL: { label: 'General', icon: Megaphone, tone: 'info' },
  IMPORTANT: { label: 'Important', icon: AlertTriangle, tone: 'danger' },
  EXAM: { label: 'Exam', icon: ClipboardList, tone: 'purple' },
  HOLIDAY: { label: 'Holiday', icon: CalendarDays, tone: 'success' },
  ASSIGNMENT: { label: 'Assignment', icon: ClipboardList, tone: 'warning' },
  EVENT: { label: 'Event', icon: PartyPopper, tone: 'info' },
};

const AUDIENCE_LABEL: Record<string, string> = {
  EVERYONE: 'Everyone',
  STUDENTS: 'Students',
  TEACHERS: 'Teachers',
  PARENTS: 'Parents',
  SCHOOL: 'School',
  CLASS: 'Class',
  SECTION: 'Section',
};

function formatDate(value?: string | null): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toLocaleDateString();
}

/**
 * Read-only announcement card. Pinned announcements are visually distinct so
 * they stand out at the top of any list.
 */
export function AnnouncementCard({
  announcement,
  showStatus = false,
}: {
  announcement: AnnouncementView;
  showStatus?: boolean;
}) {
  const meta = TYPE_META[announcement.type] ?? TYPE_META.GENERAL;
  const Icon = meta.icon;
  const isPinned = announcement.isPinned === true;
  const isActive = announcement.isActive !== false;

  const scope = [
    announcement.schoolName,
    announcement.className,
    announcement.sectionName,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <article
      id={announcement.id}
      className={`rounded-2xl border p-5 shadow-sm transition-colors ${
        isPinned
          ? 'border-indigo-300 bg-indigo-50/60 dark:border-indigo-800 dark:bg-indigo-950/30'
          : isActive
            ? 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
            : 'border-dashed border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {isPinned ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                <Pin className="h-3 w-3" aria-hidden="true" />
                Pinned
              </span>
            ) : null}
            <Badge variant={meta.tone} size="sm">
              <Icon className="h-3 w-3" aria-hidden="true" />
              {meta.label}
            </Badge>
            <Badge variant="secondary" size="sm">
              {AUDIENCE_LABEL[announcement.audience] ?? announcement.audience}
            </Badge>
            {showStatus && !isActive ? (
              <Badge variant="danger" size="sm">Inactive</Badge>
            ) : null}
          </div>

          <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            {announcement.title}
          </h3>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {announcement.message}
          </p>

          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
            <span>{announcement.authorName ?? 'EduMathAI'}</span>
            {announcement.createdAt ? <span>· {formatDate(announcement.createdAt)}</span> : null}
            {scope ? <span>· {scope}</span> : null}
            {announcement.expiresAt ? (
              <span className="inline-flex items-center gap-1">
                · <Clock className="h-3 w-3" aria-hidden="true" />
                Expires {formatDate(announcement.expiresAt)}
              </span>
            ) : null}
          </p>
        </div>
      </div>
    </article>
  );
}
