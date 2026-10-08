import { NextResponse } from 'next/server';
import { requireRoles } from '@/lib/authz';
import { getDb } from '@/lib/db';
import { CLASS_9_CHAPTERS } from '@/lib/curriculum-data';

export async function GET() {
  try {
    // 401 for anonymous callers, 403 for authenticated non-students.
    // Previously a teacher/parent hitting this route got a confusing 404
    // "Profile not found" because there was no role check before the
    // student_profiles lookup.
    const auth = await requireRoles(['STUDENT']);
    if ('error' in auth) return auth.error;

    const userId = auth.actor.userId;
    const db = getDb();

    // 1. Get Student Profile
    const profile = db.prepare('SELECT * FROM student_profiles WHERE uid = ?').get(userId) as any;
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // 2. Load the correct curriculum for student's board
    const curriculum = CLASS_9_CHAPTERS.filter(c => c.board === profile.board);

    // 3. Get existing Revision Sessions
    const revisionSessions = db.prepare('SELECT * FROM revision_sessions WHERE student_id = ?').all(userId) as any[];
    const revisionMap = new Map(revisionSessions.map(s => [s.chapter_id, s]));

    // 4. Get Assessment Snapshots to find weak areas
    const snapshots = db.prepare('SELECT * FROM assessment_snapshots WHERE student_id = ? ORDER BY created_at DESC').all(userId) as any[];
    
    // Also consider Mock Exams. NOTE: SQL string literals must use single quotes --
    // SQLite reads double quotes as an identifier, which threw "no such column".
    const mockExams = db
      .prepare("SELECT * FROM mock_exam_attempts WHERE student_id = ? AND status = 'SUBMITTED' ORDER BY submitted_at DESC")
      .all(userId) as { chapter_id: string | null; percentage: number }[];

    // Calculate priority per chapter
    const chapterStats = new Map<string, { accuracy: number; attempts: number; latestScore: number }>();

    for (const snap of snapshots) {
      if (!snap.chapter_id) continue;
      const stats = chapterStats.get(snap.chapter_id) || { accuracy: 0, attempts: 0, latestScore: snap.percentage };
      stats.accuracy = ((stats.accuracy * stats.attempts) + snap.percentage) / (stats.attempts + 1);
      stats.attempts++;
      chapterStats.set(snap.chapter_id, stats);
    }

    for (const mock of mockExams) {
      if (!mock.chapter_id) continue;
      const stats = chapterStats.get(mock.chapter_id) || { accuracy: 0, attempts: 0, latestScore: mock.percentage };
      stats.accuracy = ((stats.accuracy * stats.attempts) + mock.percentage) / (stats.attempts + 1);
      stats.attempts++;
      chapterStats.set(mock.chapter_id, stats);
    }

    // 5. Build Recommendations list
    const recommendations = curriculum.map((chap) => {
      const stats = chapterStats.get(chap.id);
      const revision = revisionMap.get(chap.id);
      
      let priority = 'low';
      let reason = 'Keep practicing to stay sharp';
      let status = 'Not Started';

      if (revision && revision.sessions_completed > 0) {
        status = 'In Progress';
        const daysSinceRev = (Date.now() - new Date(revision.last_revised_at).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceRev < 3) {
          status = 'Recently Revised';
        }
      }

      if (stats) {
        if (stats.latestScore < 50) {
          priority = 'high';
          reason = 'Low recent test score';
          status = 'Needs Revision';
        } else if (stats.latestScore < 75) {
          priority = 'medium';
          reason = 'Room for improvement based on recent performance';
        } else {
          status = 'Strong';
        }
      }

      if (revision && revision.best_quiz_score >= 80) {
        status = 'Strong';
        priority = 'low';
      }

      return {
        chapterId: chap.id,
        // Chapter exposes `title`, not `name` -- reading `name` gave blank labels.
        chapterName: chap.title,
        board: profile.board,
        priority,
        reason,
        status,
        stats: stats ? { accuracy: Math.round(stats.accuracy) } : null,
        revision: revision || null
      };
    });

    // Sort: High priority first, then Medium, then Low
    recommendations.sort((a: { priority: string }, b: { priority: string }) => {
      const pMap: Record<string, number> = { high: 3, medium: 2, low: 1 };
      return (pMap[b.priority] || 0) - (pMap[a.priority] || 0);
    });

    return NextResponse.json({
      recommendations,
      overallStats: {
        totalSessions: revisionSessions.reduce((sum, s) => sum + s.sessions_completed, 0),
        chaptersRevised: revisionSessions.length
      }
    });

  } catch (error: unknown) {
    console.error('Revision Hub API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
