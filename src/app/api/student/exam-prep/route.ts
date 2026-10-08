import { NextRequest, NextResponse } from 'next/server';
import { CLASS_9_CHAPTERS, SAMPLE_QUESTIONS_BANK } from '@/lib/curriculum-data';
import { buildLessonHref } from '@/lib/lesson-href';
import { getDb } from '@/lib/db';
import { requireRoles } from '@/lib/authz';

/**
 * Phase 9 - exam preparation.
 *
 * Assembles the seven revision surfaces from the EXISTING curriculum and
 * question bank; nothing is duplicated or invented:
 *   1. important concepts  -> lesson.conceptHtml / learningObjectives
 *   2. formulas            -> topic.formulas
 *   3. worked examples     -> lesson.examples
 *   4. practice questions  -> SAMPLE_QUESTIONS_BANK filtered by chapter/topic
 *   5. revision            -> lesson.revisionNotes
 *   6. mock quiz           -> /student/mock-exams (existing flow)
 *   7. result              -> the student's real stored snapshots
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireRoles(['STUDENT']);
    if ('error' in auth) return auth.error;

    const url = new URL(req.url);
    const board = url.searchParams.get('board') ?? 'CBSE';
    const chapterId = url.searchParams.get('chapterId');

    // --- Board -> chapters (straight from the shared curriculum module) ---
    const chapters = CLASS_9_CHAPTERS.filter((c) => c.board === board).map((c) => ({
      id: c.id,
      title: c.title,
      titleTelugu: c.titleTelugu,
      chapterNumber: c.chapterNumber,
      topicCount: c.topics.length,
      href: buildLessonHref(c, 1),
    }));

    if (!chapterId) {
      return NextResponse.json({ board, chapters });
    }

    const chapter = CLASS_9_CHAPTERS.find((c) => c.id === chapterId);
    if (!chapter || chapter.board !== board) {
      return NextResponse.json({ error: 'Chapter not found for this board.' }, { status: 404 });
    }

    const topics = chapter.topics.map((t) => ({
      id: t.id,
      title: t.title,
      titleTelugu: t.titleTelugu,
      description: t.description,
      lessonCount: t.lessons?.length ?? 0,
      formulaCount: t.formulas?.length ?? 0,
      questionCount: SAMPLE_QUESTIONS_BANK.filter((q) => q.topicId === t.id).length,
    }));

    // Full study pack for a chapter, sourced from the same lesson objects the
    // learning page renders.
    const lessons = chapter.topics.flatMap((topic, topicIndex) =>
      (topic.lessons ?? []).map((lesson, lessonIndex) => ({
        id: lesson.id,
        title: lesson.title,
        titleTelugu: lesson.titleTelugu,
        topicId: topic.id,
        topicTitle: topic.title,
        topicTitleTelugu: topic.titleTelugu,
        learningObjectives: lesson.learningObjectives ?? [],
        conceptHtml: lesson.conceptHtml ?? '',
        examples: (lesson.examples ?? []).map((e) => ({
          question: e.question,
          finalAnswer: e.finalAnswer,
          steps: e.steps ?? [],
        })),
        revisionNotes: lesson.revisionNotes ?? [],
        formulas: topic.formulas ?? [],
        href: buildLessonHref(chapter, topicIndex + 1 + lessonIndex),
      }))
    );

    const chapterQuestions = SAMPLE_QUESTIONS_BANK.filter((q) => q.chapterId === chapter.id).map((q) => ({
      id: q.id,
      topicId: q.topicId,
      type: q.type,
      difficulty: q.difficulty,
      questionText: q.questionText,
      questionTextTelugu: q.questionTextTelugu,
      latex: q.latex,
      options: q.options,
      marks: q.marks,
    }));

    // --- 7. Real stored results for this chapter ---
    const db = getDb();
    const results = db
      .prepare(
        `SELECT id, quiz_title AS quizTitle, type, percentage, accuracy,
                correct_count AS correctCount, total_questions AS totalQuestions,
                result_status AS resultStatus, created_at AS createdAt
         FROM assessment_snapshots
         WHERE student_id = ? AND chapter_id = ?
         ORDER BY datetime(created_at) DESC LIMIT 10`
      )
      .all(auth.actor.userId, chapter.id);

    return NextResponse.json({
      board,
      chapter: {
        id: chapter.id,
        title: chapter.title,
        titleTelugu: chapter.titleTelugu,
        chapterNumber: chapter.chapterNumber,
        href: buildLessonHref(chapter, 1),
      },
      topics,
      lessons,
      questions: chapterQuestions,
      formulas: chapter.topics.flatMap((t) => t.formulas ?? []),
      results,
    });
  } catch (error) {
    console.error('[Exam Prep API] Error:', error);
    return NextResponse.json({ error: 'Failed to load exam preparation data.' }, { status: 500 });
  }
}
