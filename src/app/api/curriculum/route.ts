import { NextResponse } from 'next/server';
import { requireRoles } from '@/lib/authz';
import { CLASS_9_CHAPTERS } from '@/lib/curriculum-data';
import type { BoardType } from '@/types';

/**
 * Read-only curriculum browser shared by the Teacher and School Admin modules so
 * staff can see exactly what students are studying. Serves the same
 * `CLASS_9_CHAPTERS` source the student pages use, so chapter/topic IDs always
 * match progress records and assessment snapshots.
 *
 * Query parameters:
 *   board      CBSE | AP_STATE_BOARD
 *   chapterId  return a single chapter (with topics)
 *   level      overview (default) | chapters | chapter
 */
export async function GET(req: Request) {
  try {
    const auth = await requireRoles(['TEACHER', 'SCHOOL_ADMIN', 'PLATFORM_ADMIN']);
    if ('error' in auth) return auth.error;

    const url = new URL(req.url);
    const boardParam = url.searchParams.get('board');
    const chapterId = url.searchParams.get('chapterId');
    const level = url.searchParams.get('level') ?? 'overview';

    const chapters = CLASS_9_CHAPTERS.filter(
      (chapter) => !boardParam || chapter.board === (boardParam as BoardType)
    );

    const boardSummary = (['CBSE', 'AP_STATE_BOARD'] as const).map((board) => {
      const scoped = CLASS_9_CHAPTERS.filter((chapter) => chapter.board === board);
      return {
        board,
        chapters: scoped.length,
        topics: scoped.reduce((total, chapter) => total + chapter.topics.length, 0),
      };
    });

    if (chapterId) {
      const chapter = CLASS_9_CHAPTERS.find((item) => item.id === chapterId);
      if (!chapter) {
        return NextResponse.json({ error: 'Chapter not found.' }, { status: 404 });
      }
      return NextResponse.json({ chapter, boards: boardSummary });
    }

    if (level === 'chapters') {
      return NextResponse.json({
        boards: boardSummary,
        chapters: chapters.map((chapter) => ({
          id: chapter.id,
          chapterNumber: chapter.chapterNumber,
          title: chapter.title,
          titleTelugu: chapter.titleTelugu,
          description: chapter.description,
          board: chapter.board,
          grade: chapter.grade,
          unitLabel: chapter.unitLabel,
          estimatedHours: chapter.estimatedHours,
          topicCount: chapter.topics.length,
          topics: chapter.topics.map((topic) => ({
            id: topic.id,
            title: topic.title,
            titleTelugu: topic.titleTelugu,
            order: topic.order,
            lessonCount: topic.lessons.length,
            formulaCount: topic.formulas?.length ?? 0,
            exampleCount: topic.examples?.length ?? 0,
            questionCount: topic.questions?.length ?? 0,
          })),
        })),
      });
    }

    return NextResponse.json({
      boards: boardSummary,
      totalChapters: chapters.length,
      totalTopics: chapters.reduce((total, chapter) => total + chapter.topics.length, 0),
    });
  } catch (error) {
    console.error('[Curriculum API] Error:', error);
    return NextResponse.json({ error: 'Failed to load curriculum.' }, { status: 500 });
  }
}