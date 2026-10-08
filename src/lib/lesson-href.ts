import type { Chapter } from '@/types';

/**
 * Canonical URL + slug format for the chapter learning page
 * (`/student/learn/[lessonId]`).
 *
 * The chapter page parses its `lessonId` with
 *   /^(ap|cbse)-ch(\d+)(?:-l(\d+))?$/
 * so the board prefix is REQUIRED. Links built without it fall through to the
 * "Lesson not found" state. Every link into the chapter page must be produced
 * here so the format cannot drift again.
 */

const BOARD_PREFIX: Record<string, string> = {
  CBSE: 'cbse',
  AP_STATE_BOARD: 'ap',
};

export function boardPathFor(board: string | null | undefined): string {
  return BOARD_PREFIX[board ?? ''] ?? 'cbse';
}

/** Route slug, e.g. `cbse-ch3-l2`. */
export function buildLessonSlug(
  chapter: Pick<Chapter, 'board' | 'chapterNumber'>,
  lessonNumber = 1
): string {
  const safeLesson = Number.isFinite(lessonNumber) && lessonNumber > 0 ? Math.floor(lessonNumber) : 1;
  return `${boardPathFor(chapter.board)}-ch${chapter.chapterNumber}-l${safeLesson}`;
}

/** Full href for the chapter learning page. */
export function buildLessonHref(
  chapter: Pick<Chapter, 'board' | 'chapterNumber'>,
  lessonNumber = 1
): string {
  return `/student/learn/${buildLessonSlug(chapter, lessonNumber)}`;
}

/** True when a `lessonId` route param will resolve on the chapter page. */
export function isValidLessonSlug(lessonId: string | null | undefined): boolean {
  return /^(ap|cbse)-ch(\d+)(?:-l(\d+))?$/.test(lessonId ?? '');
}