import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireRoles } from '@/lib/authz';
import { CLASS_9_CHAPTERS, SAMPLE_QUESTIONS_BANK } from '@/lib/curriculum-data';
import { buildLessonHref } from '@/lib/lesson-href';

/**
 * Phase 6 - student progress summary.
 *
 * Every figure is read from real stored rows: student_profiles (xp, streak),
 * activity_log (completed lessons/activity) and assessment_snapshots (accuracy,
 * weak topics). "Continue Learning" resolves to the student's latest incomplete
 * lesson; when nothing has been started it falls back to the first curriculum
 * lesson rather than guessing.
 */
export async function GET() {
  try {
    const auth = await requireRoles(['STUDENT']);
    if ('error' in auth) return auth.error;

    const db = getDb();
    const studentId = auth.actor.userId;

    const profile = db
      .prepare(
        `SELECT display_name AS displayName, xp, level, streak_days AS streakDays,
                questions_solved AS questionsSolved, total_study_minutes AS totalStudyMinutes,
                last_active_date AS lastActiveDate, board, class_name AS className
         FROM student_profiles WHERE uid = ?`
      )
      .get(studentId) as Record<string, unknown> | undefined;

    const activity = db
      .prepare(
        `SELECT activity_type AS activityType, created_at AS createdAt
         FROM activity_log WHERE student_id = ? ORDER BY datetime(created_at) DESC LIMIT 200`
      )
      .all(studentId) as { activityType: string; createdAt: string }[];

    const lessonEvents = activity.filter((a) => a.activityType === 'LESSON').length;
    const revisionEvents = activity.filter((a) => a.activityType === 'REVISION').length;
    const quizEvents = activity.filter((a) => a.activityType === 'QUIZ').length;
    const practiceEvents = activity.filter((a) => a.activityType === 'PRACTICE').length;
    const totalTopics = CLASS_9_CHAPTERS.reduce((n, c) => n + c.topics.length, 0);

    const accuracyRow = db
      .prepare(
        `SELECT COUNT(*) AS attempts,
                COALESCE(ROUND(AVG(percentage), 1), 0) AS avgPercentage,
                COALESCE(ROUND(AVG(accuracy), 1), 0) AS avgAccuracy
         FROM assessment_snapshots WHERE student_id = ?`
      )
      .get(studentId) as { attempts: number; avgPercentage: number; avgAccuracy: number };

    // --- Weak topics, derived from the student's own graded answers ---
    const topicAgg = new Map<string, { chapterId: string; topicId: string; attempted: number; correct: number }>();
    const snapshots = db
      .prepare(
        'SELECT snapshot_json AS snapshotJson FROM assessment_snapshots WHERE student_id = ? ORDER BY created_at ASC'
      )
      .all(studentId) as { snapshotJson: string }[];

    for (const { snapshotJson } of snapshots) {
      let payload: { evaluatedQuestions?: unknown };
      try {
        payload = JSON.parse(snapshotJson);
      } catch {
        continue;
      }
      if (!Array.isArray(payload.evaluatedQuestions)) continue;
      for (const value of payload.evaluatedQuestions) {
        if (!value || typeof value !== 'object') continue;
        const q = value as {
          chapterId?: unknown;
          topicId?: unknown;
          isCorrect?: unknown;
          studentAnswer?: unknown;
        };
        if (typeof q.chapterId !== 'string' || typeof q.topicId !== 'string') continue;
        const answer = typeof q.studentAnswer === 'string' ? q.studentAnswer.trim() : '';
        if (!answer || answer.toLowerCase() === 'unanswered') continue;
        const key = `${q.chapterId}::${q.topicId}`;
        const agg = topicAgg.get(key) ?? {
          chapterId: q.chapterId,
          topicId: q.topicId,
          attempted: 0,
          correct: 0,
        };
        agg.attempted += 1;
        if (q.isCorrect === true) agg.correct += 1;
        topicAgg.set(key, agg);
      }
    }

    const chapterById = new Map(CLASS_9_CHAPTERS.map((c) => [c.id, c]));
    const weakTopics = [...topicAgg.values()]
      .filter((t) => t.attempted >= 2)
      .map((t) => ({
        chapterId: t.chapterId,
        chapterTitle: chapterById.get(t.chapterId)?.title ?? t.chapterId,
        topicId: t.topicId,
        topicTitle:
          chapterById.get(t.chapterId)?.topics.find((x) => x.id === t.topicId)?.title ?? t.topicId,
        accuracy: Math.round((t.correct / t.attempted) * 100),
        attempted: t.attempted,
      }))
      .filter((t) => t.accuracy < 70)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5);

    // --- Continue Learning: the most recent lesson not yet completed ---
    const lastLesson = db
      .prepare(
        `SELECT lesson_id AS lessonId, board, chapter_id AS chapterId, topic_id AS topicId
         FROM lesson_progress
         WHERE student_id = ? AND status = 'IN_PROGRESS'
         ORDER BY datetime(started_at) DESC LIMIT 1`
      )
      .get(studentId) as { lessonId: string; board: string | null; chapterId: string | null; topicId: string | null } | undefined;

    let continueLearning: { href: string; title: string; chapterTitle: string } | null = null;
    if (lastLesson?.chapterId) {
      const chapter = CLASS_9_CHAPTERS.find((c) => c.id === lastLesson.chapterId);
      if (chapter) {
        const index = chapter.topics.findIndex((t) => t.id === lastLesson.topicId);
        continueLearning = {
          href: buildLessonHref(chapter, index >= 0 ? index + 1 : 1),
          title: chapter.title,
          chapterTitle: chapter.title,
        };
      }
    }
    if (!continueLearning && CLASS_9_CHAPTERS[0]) {
      const first = CLASS_9_CHAPTERS[0];
      continueLearning = {
        href: buildLessonHref(first, 1),
        title: first.title,
        chapterTitle: first.title,
      };
    }

    // Lessons actually completed, used by the Phase 8 achievement checks.
    const completedLessons = db
      .prepare(
        `SELECT COUNT(*) AS lessons, COUNT(DISTINCT chapter_id) AS chapters
         FROM lesson_progress WHERE student_id = ? AND status = 'COMPLETED'`
      )
      .get(studentId) as { lessons: number; chapters: number };

    return NextResponse.json({
      profile: profile ?? null,
      stats: {
        lessonsCompleted: completedLessons.lessons,
        chaptersCompleted: completedLessons.chapters,
        topicsCompleted: Math.min(completedLessons.lessons, totalTopics),
        totalTopics,
        lessonOpens: lessonEvents,
        quizzesCompleted: quizEvents,
        practiceSessions: practiceEvents,
        revisionSessions: revisionEvents,
        accuracy: accuracyRow.attempts > 0 ? accuracyRow.avgAccuracy : null,
        averageScore: accuracyRow.attempts > 0 ? accuracyRow.avgPercentage : null,
        attempts: accuracyRow.attempts,
        xp: profile?.xp ?? 0,
        level: profile?.level ?? 1,
        streakDays: profile?.streakDays ?? 0,
        questionsSolved: profile?.questionsSolved ?? 0,
        totalStudyMinutes: profile?.totalStudyMinutes ?? 0,
        questionBankSize: SAMPLE_QUESTIONS_BANK.length,
      },
      weakTopics,
      continueLearning,
      recentActivity: activity.slice(0, 8),
    });
  } catch (error) {
    console.error('[Student Dashboard API] Error:', error);
    return NextResponse.json({ error: 'Failed to load progress.' }, { status: 500 });
  }
}

