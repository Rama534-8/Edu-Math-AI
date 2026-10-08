import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { CLASS_9_CHAPTERS } from '@/lib/curriculum-data';
import { getSessionFromRequest } from '@/lib/session';

type SnapshotRow = {
  snapshot_json: string;
  created_at: string;
};

type SnapshotQuestion = {
  chapterId?: unknown;
  topicId?: unknown;
  studentAnswer?: unknown;
  isCorrect?: unknown;
  mistakeCategory?: unknown;
};

type TopicStats = {
  id: string;
  name: string;
  attempted: number;
  correct: number;
};

type ChapterStats = {
  id: string;
  name: string;
  attempted: number;
  correct: number;
  incorrect: number;
  lastPracticed: string | null;
  mistakes: Map<string, number>;
  topics: Map<string, TopicStats>;
  history: { date: string; accuracy: number }[];
};

function getStrength(accuracy: number | null) {
  if (accuracy === null) return 'NOT_ATTEMPTED';
  if (accuracy >= 80) return 'STRONG';
  if (accuracy >= 65) return 'IMPROVING';
  if (accuracy >= 40) return 'NEEDS_PRACTICE';
  return 'WEAK';
}

export async function GET() {
  try {
    const session = await getSessionFromRequest();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const db = getDb();
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(session.userId) as
      | { role: string }
      | undefined;
    if (user?.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Student access required.' }, { status: 403 });
    }

    const chapterStats = new Map<string, ChapterStats>(
      CLASS_9_CHAPTERS.map((chapter) => [
        chapter.id,
        {
          id: chapter.id,
          name: chapter.title,
          attempted: 0,
          correct: 0,
          incorrect: 0,
          lastPracticed: null,
          mistakes: new Map(),
          topics: new Map(),
          history: [],
        },
      ])
    );
    const rows = db.prepare(
      'SELECT snapshot_json, created_at FROM assessment_snapshots WHERE student_id = ? ORDER BY created_at ASC'
    ).all(session.userId) as SnapshotRow[];

    for (const row of rows) {
      let snapshot: { createdAt?: unknown; evaluatedQuestions?: unknown };
      try {
        snapshot = JSON.parse(row.snapshot_json);
      } catch {
        continue;
      }
      if (!Array.isArray(snapshot.evaluatedQuestions)) continue;

      const date = typeof snapshot.createdAt === 'string' ? snapshot.createdAt : row.created_at;
      const snapshotChapters = new Map<string, { attempted: number; correct: number }>();

      for (const value of snapshot.evaluatedQuestions) {
        if (!value || typeof value !== 'object') continue;
        const question = value as SnapshotQuestion;
        if (typeof question.chapterId !== 'string') continue;
        const chapter = chapterStats.get(question.chapterId);
        if (!chapter) continue;

        const answer = typeof question.studentAnswer === 'string' ? question.studentAnswer.trim() : '';
        if (!answer || answer.toLowerCase() === 'unanswered') continue;

        chapter.attempted += 1;
        const chapterAttempt = snapshotChapters.get(chapter.id) ?? { attempted: 0, correct: 0 };
        chapterAttempt.attempted += 1;

        if (question.isCorrect === true) {
          chapter.correct += 1;
          chapterAttempt.correct += 1;
        } else {
          chapter.incorrect += 1;
          if (typeof question.mistakeCategory === 'string') {
            chapter.mistakes.set(
              question.mistakeCategory,
              (chapter.mistakes.get(question.mistakeCategory) ?? 0) + 1
            );
          }
        }
        snapshotChapters.set(chapter.id, chapterAttempt);

        if (typeof question.topicId === 'string') {
          const curriculumChapter = CLASS_9_CHAPTERS.find((item) => item.id === chapter.id);
          const curriculumTopic = curriculumChapter?.topics.find((item) => item.id === question.topicId);
          const topic = chapter.topics.get(question.topicId) ?? {
            id: question.topicId,
            name: curriculumTopic?.title ?? question.topicId,
            attempted: 0,
            correct: 0,
          };
          topic.attempted += 1;
          if (question.isCorrect === true) topic.correct += 1;
          chapter.topics.set(topic.id, topic);
        }

        if (!chapter.lastPracticed || date > chapter.lastPracticed) {
          chapter.lastPracticed = date;
        }
      }

      for (const [chapterId, attempt] of snapshotChapters) {
        const chapter = chapterStats.get(chapterId);
        if (chapter && attempt.attempted > 0) {
          chapter.history.push({
            date,
            accuracy: Math.round((attempt.correct / attempt.attempted) * 100),
          });
        }
      }
    }

    const chapters = Array.from(chapterStats.values()).map((chapter) => {
      const accuracy = chapter.attempted > 0
        ? Math.round((chapter.correct / chapter.attempted) * 100)
        : null;
      const mostCommonMistake = Array.from(chapter.mistakes.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      const topics = Array.from(chapter.topics.values())
        .map((topic) => ({
          id: topic.id,
          name: topic.name,
          attempted: topic.attempted,
          accuracy: Math.round((topic.correct / topic.attempted) * 100),
        }))
        .sort((a, b) => a.accuracy - b.accuracy);
      const history = chapter.history;
      const improvement = history.length > 1
        ? history[history.length - 1].accuracy - history[0].accuracy
        : null;

      return {
        id: chapter.id,
        name: chapter.name,
        attempted: chapter.attempted,
        correct: chapter.correct,
        incorrect: chapter.incorrect,
        accuracy,
        strength: getStrength(accuracy),
        mostCommonMistake,
        weakTopics: topics.filter((topic) => topic.accuracy < 70).slice(0, 3),
        lastPracticed: chapter.lastPracticed,
        improvement,
      };
    });

    const attemptedChapters = chapters.filter((chapter) => chapter.attempted > 0);
    const weakest = [...attemptedChapters].sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0))[0] ?? null;
    const strongest = [...attemptedChapters].sort((a, b) => (b.accuracy ?? 0) - (a.accuracy ?? 0))[0] ?? null;
    const mostImproved = chapters
      .filter((chapter) => chapter.improvement !== null && chapter.improvement > 0)
      .sort((a, b) => (b.improvement ?? 0) - (a.improvement ?? 0))[0] ?? null;

    return NextResponse.json({ chapters, summary: { weakest, strongest, mostImproved } });
  } catch (error) {
    console.error('[Chapter Performance GET] Error:', error);
    return NextResponse.json({ error: 'Failed to load chapter performance.' }, { status: 500 });
  }
}
