import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';
import { ALL_BADGES } from '@/lib/badges';
import { CLASS_9_CHAPTERS } from '@/lib/curriculum-data';
import { randomUUID } from 'crypto';

/**
 * GET /api/student/achievements
 * Returns the student's earned badges alongside all badge definitions.
 * Also triggers badge evaluation so new badges get awarded on load.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const db = getDb();
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(session.userId) as any;
    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Student access required.' }, { status: 403 });
    }

    // Evaluate and award new badges
    await evaluateAndAwardBadges(session.userId, db);

    // Return earned badges
    const earned = db
      .prepare('SELECT badge_code, earned_at FROM student_achievements WHERE student_id = ?')
      .all(session.userId) as { badge_code: string; earned_at: string }[];

    const earnedMap = new Map(earned.map((e) => [e.badge_code, e.earned_at]));

    const badgesWithStatus = ALL_BADGES.map((b) => ({
      ...b,
      unlocked: earnedMap.has(b.code),
      earnedAt: earnedMap.get(b.code) || null,
    }));

    return NextResponse.json({ badges: badgesWithStatus });
  } catch (err: any) {
    console.error('Achievements GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function evaluateAndAwardBadges(studentId: string, db: any) {
  const profile = db
    .prepare('SELECT * FROM student_profiles WHERE uid = ?')
    .get(studentId) as any;
  if (!profile) return;

  const snapshots = db
    .prepare('SELECT * FROM assessment_snapshots WHERE student_id = ? ORDER BY created_at ASC')
    .all(studentId) as any[];

  const studyPlans = db
    .prepare('SELECT id FROM study_plans WHERE student_id = ?')
    .all(studentId) as any[];

  // Real lesson completion state (Phase 6 lesson_progress).
  const lessonProgress = db
    .prepare("SELECT chapter_id AS chapterId, lesson_id AS lessonId FROM lesson_progress WHERE student_id = ? AND status = 'COMPLETED'")
    .all(studentId) as { chapterId: string | null; lessonId: string }[];

  const completedLessons = lessonProgress.length;

  // A chapter counts as complete only when EVERY lesson inside it is completed.
  const completedChapterIds = new Set(
    lessonProgress.map((r) => r.chapterId).filter((id): id is string => typeof id === 'string')
  );
  const fullyCompletedChapters = [...completedChapterIds].filter((chapterId) => {
    const chapter = CLASS_9_CHAPTERS.find((c) => c.id === chapterId);
    if (!chapter) return false;
    const lessonIds = chapter.topics.flatMap((topic) => (topic.lessons ?? []).map((lesson) => lesson.id));
    if (lessonIds.length === 0) return false;
    const done = new Set(
      lessonProgress.filter((r) => r.chapterId === chapterId).map((r) => r.lessonId)
    );
    return lessonIds.every((id) => done.has(id));
  });

  // Mock exam data
  const mockExams = db
    .prepare("SELECT * FROM mock_exam_attempts WHERE student_id = ? AND status = 'SUBMITTED'")
    .all(studentId) as any[];

  // Revision session data
  const revisionSessions = db
    .prepare('SELECT * FROM revision_sessions WHERE student_id = ?')
    .all(studentId) as any[];

  const alreadyEarned = new Set(
    (db
      .prepare('SELECT badge_code FROM student_achievements WHERE student_id = ?')
      .all(studentId) as { badge_code: string }[]).map((r) => r.badge_code)
  );

  const toAward: string[] = [];

  const maxAccuracy = snapshots.reduce((max: number, s: any) => Math.max(max, s.accuracy ?? 0), 0);
  const passCount = snapshots.filter((s: any) => s.result_status === 'PASS').length;
  const questionsSolved = profile.questions_solved ?? 0;
  const streak = profile.streak_days ?? 0;
  const level = profile.level ?? 1;
  const baselineCompleted = !!profile.baseline_completed;

  // Mock exam metrics
  const mockExamCount = mockExams.length;
  const mockExamPassCount = mockExams.filter((m: any) => m.result_status === 'PASS').length;

  // Revision metrics
  const revisionCount = revisionSessions.length;

  const check = (code: string, condition: boolean) => {
    if (condition && !alreadyEarned.has(code)) toAward.push(code);
  };

  check('FIRST_QUIZ', snapshots.length > 0);
  check('PASSING_RESULT', passCount >= 1);
  check('RETEST_CHAMPION', snapshots.some((s: any) => s.is_retest === 1));
  check('THREE_PASSES', passCount >= 3);
  check('ACCURACY_80', maxAccuracy >= 80);
  check('ACCURACY_100', maxAccuracy >= 100);
  check('Q50', questionsSolved >= 50);
  check('Q100', questionsSolved >= 100);
  check('Q500', questionsSolved >= 500);
  check('STREAK_3', streak >= 3);
  check('STREAK_7', streak >= 7);
  check('STREAK_30', streak >= 30);
  check('STUDY_PLAN_FIRST', studyPlans.length > 0);
  check('BASELINE_COMPLETE', baselineCompleted);
  check('LEVEL_5', level >= 5);
  // Mock exam badges
  check('MOCK_EXAM_FIRST', mockExamCount >= 1);
  check('MOCK_EXAM_PASS', mockExamPassCount >= 1);
  check('MOCK_EXAM_5', mockExamCount >= 5);
  // Revision badges
  check('REVISION_FIRST', revisionCount >= 1);
  check('REVISION_5', revisionCount >= 5);
  // Lesson milestones - every one is backed by stored lesson_progress rows.
  check('FIRST_LESSON', completedLessons >= 1);
  check('FIVE_LESSONS', completedLessons >= 5);
  check('CHAPTER_COMPLETE', fullyCompletedChapters.length >= 1);

  if (toAward.length === 0) return;

  const insertAchievement = db.prepare(
    'INSERT OR IGNORE INTO student_achievements (id, student_id, badge_code) VALUES (?, ?, ?)'
  );
  const insertNotification = db.prepare(
    `INSERT INTO notifications (id, user_id, type, title, message, link)
     VALUES (?, ?, 'BADGE', ?, ?, '/student/achievements')`
  );

  const awardMany = db.transaction(() => {
    for (const code of toAward) {
      const badge = ALL_BADGES.find((b) => b.code === code);
      if (!badge) continue;
      insertAchievement.run(randomUUID(), studentId, code);
      insertNotification.run(
        randomUUID(),
        studentId,
        `🏅 Badge Unlocked: ${badge.title}`,
        badge.description
      );
    }
  });
  awardMany();
}
