import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireRoles } from '@/lib/authz';
import { CLASS_9_CHAPTERS } from '@/lib/curriculum-data';

/**
 * Phase 10 - weak topic recommendations.
 *
 * Every recommendation is derived from the student's OWN stored answers inside
 * assessment_snapshots.snapshot_json. Topics with fewer than 2 graded answers
 * are reported as "not enough data" instead of being given a made-up score.
 */
interface TopicAgg {
  chapterId: string;
  topicId: string;
  attempted: number;
  correct: number;
}

export async function GET() {
  try {
    const auth = await requireRoles(['STUDENT']);
    if ('error' in auth) return auth.error;

    const db = getDb();
    const rows = db
      .prepare(
        `SELECT snapshot_json AS snapshotJson, created_at AS createdAt, chapter_id AS chapterId
         FROM assessment_snapshots WHERE student_id = ? ORDER BY datetime(created_at) ASC`
      )
      .all(auth.actor.userId) as { snapshotJson: string; createdAt: string; chapterId: string | null }[];

    const topics = new Map<string, TopicAgg>();
    let totalGraded = 0;
    let totalCorrect = 0;

    for (const row of rows) {
      let payload: { evaluatedQuestions?: unknown };
      try {
        payload = JSON.parse(row.snapshotJson);
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

        // Unanswered items are not evidence of weakness.
        const answer = typeof q.studentAnswer === 'string' ? q.studentAnswer.trim() : '';
        if (!answer || answer.toLowerCase() === 'unanswered') continue;

        const key = `${q.chapterId}::${q.topicId}`;
        const agg = topics.get(key) ?? { chapterId: q.chapterId, topicId: q.topicId, attempted: 0, correct: 0 };
        agg.attempted += 1;
        if (q.isCorrect === true) agg.correct += 1;
        topics.set(key, agg);

        totalGraded += 1;
        if (q.isCorrect === true) totalCorrect += 1;
      }
    }

    const chapterById = new Map(CLASS_9_CHAPTERS.map((c) => [c.id, c]));

    const recommendations = [...topics.values()]
      .map((agg) => {
        const chapter = chapterById.get(agg.chapterId);
        const topic = chapter?.topics.find((t) => t.id === agg.topicId);
        const accuracy = agg.attempted > 0 ? Math.round((agg.correct / agg.attempted) * 100) : null;
        return {
          chapterId: agg.chapterId,
          chapterTitle: chapter?.title ?? agg.chapterId,
          topicId: agg.topicId,
          topicTitle: topic?.title ?? agg.topicId,
          topicTitleTelugu: topic?.titleTelugu ?? null,
          attempted: agg.attempted,
          correct: agg.correct,
          accuracy,
          // Too little evidence to make a recommendation.
          sufficientData: agg.attempted >= 2,
          severity: accuracy === null ? 'UNKNOWN' : accuracy < 40 ? 'HIGH' : accuracy < 70 ? 'MEDIUM' : 'LOW',
        };
      })
      // Only genuine weak topics (below 70%), with enough evidence to say so.
      .filter((r) => r.sufficientData && r.accuracy !== null && (r.accuracy as number) < 70)
      .sort((a, b) => (a.accuracy as number) - (b.accuracy as number));

    const recentAttempts = rows.slice(-5).reverse().length;

    return NextResponse.json({
      recommendations,
      overallAccuracy: totalGraded > 0 ? Math.round((totalCorrect / totalGraded) * 100) : null,
      gradedAnswers: totalGraded,
      topicsObserved: topics.size,
      assessedAttempts: rows.length,
      recentAttempts,
      hasEnoughData: totalGraded > 0,
    });
  } catch (error) {
    console.error('[Recommendations API] Error:', error);
    return NextResponse.json({ error: 'Failed to build recommendations.' }, { status: 500 });
  }
}
