/**
 * Phase 5 - assignment deadline status.
 *
 * The `assignments.due_date` column already exists, so this only derives the
 * display state; it never invents a due date. Stored values look like
 * 'YYYY-MM-DD HH:MM:SS' (SQLite datetime) or ISO strings, so both are parsed.
 */

export type DeadlineStatus = 'OVERDUE' | 'DUE_SOON' | 'UPCOMING' | 'NO_DEADLINE' | 'SUBMITTED';

export interface DeadlineInfo {
  dueDate: string | null;
  status: DeadlineStatus;
  daysRemaining: number | null;
  label: string;
}

/** Days before the deadline at which an assignment is flagged "due soon". */
export const DUE_SOON_DAYS = 3;

function parseDueDate(value: unknown): Date | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  // Normalise 'YYYY-MM-DD HH:MM:SS' to an ISO-parsable form.
  const normalised = value.trim().includes('T') ? value.trim() : value.trim().replace(' ', 'T') + 'Z';
  const parsed = new Date(normalised);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * @param dueDate      stored due date (nullable)
 * @param submission   the student's submission status, when one exists
 * @param now          injectable for deterministic testing
 */
export function deadlineInfo(
  dueDate: unknown,
  submission?: { status?: string | null } | null,
  now: Date = new Date()
): DeadlineInfo {
  if (submission && submission.status && submission.status.toUpperCase() !== 'PENDING') {
    return {
      dueDate: typeof dueDate === 'string' ? dueDate : null,
      status: 'SUBMITTED',
      daysRemaining: null,
      label: 'Submitted',
    };
  }

  const due = parseDueDate(dueDate);
  if (!due) {
    return { dueDate: null, status: 'NO_DEADLINE', daysRemaining: null, label: 'No deadline' };
  }

  // Compare on whole-day boundaries so an assignment due "today" is not overdue.
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  const daysRemaining = Math.round((startOfDue - startOfToday) / 86_400_000);

  if (daysRemaining < 0) {
    const overdueBy = Math.abs(daysRemaining);
    return {
      dueDate: due.toISOString(),
      status: 'OVERDUE',
      daysRemaining,
      label: overdueBy === 1 ? 'Overdue by 1 day' : `Overdue by ${overdueBy} days`,
    };
  }

  if (daysRemaining === 0) {
    return { dueDate: due.toISOString(), status: 'DUE_SOON', daysRemaining, label: 'Due today' };
  }

  if (daysRemaining <= DUE_SOON_DAYS) {
    return {
      dueDate: due.toISOString(),
      status: 'DUE_SOON',
      daysRemaining,
      label: `Due in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`,
    };
  }

  return {
    dueDate: due.toISOString(),
    status: 'UPCOMING',
    daysRemaining,
    label: `Due in ${daysRemaining} days`,
  };
}

/** Tailwind classes per status, used by the student assignment surfaces. */
export function deadlineTone(status: DeadlineStatus): {
  badge: 'danger' | 'warning' | 'info' | 'success' | 'secondary';
  text: string;
} {
  switch (status) {
    case 'OVERDUE':
      return { badge: 'danger', text: 'text-rose-600 dark:text-rose-400' };
    case 'DUE_SOON':
      return { badge: 'warning', text: 'text-amber-600 dark:text-amber-400' };
    case 'UPCOMING':
      return { badge: 'info', text: 'text-sky-600 dark:text-sky-400' };
    case 'SUBMITTED':
      return { badge: 'success', text: 'text-emerald-600 dark:text-emerald-400' };
    default:
      return { badge: 'secondary', text: 'text-slate-500 dark:text-slate-400' };
  }
}