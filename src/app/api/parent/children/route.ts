import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';
import { deadlineInfo } from '@/lib/deadlines';

async function getAuthenticatedParentId() {
  const session = await getSessionFromRequest();
  if (!session) return { error: NextResponse.json({ error: 'Not authenticated.' }, { status: 401 }) };

  const user = getDb().prepare('SELECT role FROM users WHERE id = ?').get(session.userId) as
    | { role: string }
    | undefined;
  if (user?.role !== 'PARENT') {
    return { error: NextResponse.json({ error: 'Parent access required.' }, { status: 403 }) };
  }
  return { parentId: session.userId };
}

export async function GET() {
  try {
    const auth = await getAuthenticatedParentId();
    if ('error' in auth) return auth.error;

    const db = getDb();
    const students = db.prepare(`
      SELECT sp.uid AS id, sp.display_name AS displayName,
             sp.parent_guardian_name AS parentGuardianName,
             sp.profile_picture AS profilePicture, sp.class_name AS className,
             sp.board, sp.medium, sp.xp, sp.level,
             sp.streak_days AS streakDays, sp.questions_solved AS questionsSolved
      FROM parent_student_links link
      JOIN users u ON u.id = link.student_user_id AND u.role = 'STUDENT'
      JOIN student_profiles sp ON sp.uid = u.id
      WHERE link.parent_user_id = ?
      ORDER BY sp.display_name COLLATE NOCASE
    `).all(auth.parentId) as {
      id: string;
      displayName: string;
      parentGuardianName: string | null;
      profilePicture: string | null;
      className: string;
      board: string;
      medium: string;
      xp: number;
      level: number;
      streakDays: number;
      questionsSolved: number;
    }[];

    const performance = students.map((student) => {
      const snapshots = db.prepare(`
        SELECT percentage, total_questions AS totalQuestions, correct_count AS correctCount,
               incorrect_count AS incorrectCount, snapshot_json AS snapshotJson,
               is_baseline AS isBaseline, created_at AS createdAt
        FROM assessment_snapshots
        WHERE student_id = ?
        ORDER BY created_at ASC
      `).all(student.id) as {
        percentage: number;
        totalQuestions: number;
        correctCount: number;
        incorrectCount: number;
        snapshotJson: string;
        isBaseline: number;
        createdAt: string;
      }[];
      const correctCount = snapshots.reduce((total, snapshot) => total + snapshot.correctCount, 0);
      const incorrectCount = snapshots.reduce((total, snapshot) => total + snapshot.incorrectCount, 0);
      const answeredCount = correctCount + incorrectCount;
      const chapterStats = new Map<string, {
        attempted: number;
        correct: number;
        topics: Map<string, { attempted: number; correct: number }>;
        mistakes: Map<string, number>;
      }>();

      for (const snapshot of snapshots) {
        let payload: { evaluatedQuestions?: unknown };
        try {
          payload = JSON.parse(snapshot.snapshotJson);
        } catch {
          continue;
        }
        if (!Array.isArray(payload.evaluatedQuestions)) continue;

        for (const value of payload.evaluatedQuestions) {
          if (!value || typeof value !== 'object') continue;
          const question = value as {
            chapterId?: unknown;
            topicId?: unknown;
            studentAnswer?: unknown;
            isCorrect?: unknown;
            mistakeCategory?: unknown;
          };
          const answer = typeof question.studentAnswer === 'string' ? question.studentAnswer.trim() : '';
          if (!answer || answer.toLowerCase() === 'unanswered' || typeof question.chapterId !== 'string') continue;

          const chapter = chapterStats.get(question.chapterId) ?? {
            attempted: 0,
            correct: 0,
            topics: new Map<string, { attempted: number; correct: number }>(),
            mistakes: new Map<string, number>(),
          };
          chapter.attempted += 1;
          if (question.isCorrect === true) chapter.correct += 1;
          else if (typeof question.mistakeCategory === 'string') {
            chapter.mistakes.set(question.mistakeCategory, (chapter.mistakes.get(question.mistakeCategory) ?? 0) + 1);
          }
          if (typeof question.topicId === 'string') {
            const topic = chapter.topics.get(question.topicId) ?? { attempted: 0, correct: 0 };
            topic.attempted += 1;
            if (question.isCorrect === true) topic.correct += 1;
            chapter.topics.set(question.topicId, topic);
          }
          chapterStats.set(question.chapterId, chapter);
        }
      }

      const chapters = Array.from(chapterStats, ([id, chapter]) => ({
        id,
        attempted: chapter.attempted,
        correct: chapter.correct,
        incorrect: chapter.attempted - chapter.correct,
        accuracy: Math.round(chapter.correct / chapter.attempted * 100),
        commonMistakes: Array.from(chapter.mistakes.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name),
        weakConcepts: Array.from(chapter.topics.entries())
          .filter(([, topic]) => topic.attempted > 0 && topic.correct / topic.attempted < 0.7)
          .map(([topicId]) => topicId),
      }));

      const baseline = snapshots.find((snapshot) => snapshot.isBaseline === 1);
      const latestAfter = baseline
        ? [...snapshots].reverse().find((snapshot) =>
            snapshot.isBaseline === 0 && snapshot.createdAt > baseline.createdAt
          )
        : undefined;
      const accuracy = answeredCount
        ? correctCount / answeredCount * 100
        : null;

      return {
        ...student,
        accuracy,
        questionsAttempted: answeredCount,
        correctAnswers: correctCount,
        incorrectAnswers: incorrectCount,
        chapters,
        beforeScore: baseline?.percentage ?? null,
        afterScore: latestAfter?.percentage ?? null,
        improvement: baseline && latestAfter ? latestAfter.percentage - baseline.percentage : null,
        latestAssessment: snapshots.at(-1)?.percentage ?? null,
      };
    });

    const activitiesThisWeek = db.prepare(`
      SELECT COUNT(*) AS count
      FROM activity_log
      WHERE student_id IN (
        SELECT student_user_id FROM parent_student_links WHERE parent_user_id = ?
      ) AND created_at >= datetime('now', '-7 days')
    `).get(auth.parentId) as { count: number };

    const recentActivities = db.prepare(`
      SELECT activity.id, activity.activity_type AS activityType,
             activity.created_at AS createdAt, profile.display_name AS studentName
      FROM activity_log activity
      JOIN parent_student_links link ON link.student_user_id = activity.student_id
      JOIN student_profiles profile ON profile.uid = activity.student_id
      WHERE link.parent_user_id = ?
      ORDER BY activity.created_at DESC
      LIMIT 100
    `).all(auth.parentId) as {
      id: string;
      activityType: string;
      createdAt: string;
      studentName: string;
    }[];

    const availableImprovements = performance
      .map((student) => student.improvement)
      .filter((improvement): improvement is number => improvement !== null);

    // Phase 11 - pending assignments for linked children, derived from the
    // real assignments/assignments_submissions rows (never fabricated).
    const pendingAssignments = db
      .prepare(
        `SELECT a.id, a.title, a.due_date AS dueDate, a.subject,
                c.name AS className, s.name AS sectionName,
                COALESCE(sp.display_name, u.email) AS studentName,
                u.id AS studentId
         FROM assignments a
         JOIN parent_student_links link ON link.parent_user_id = ?
         JOIN student_enrollments se
              ON se.section_id = a.section_id AND se.student_id = link.student_user_id
         JOIN users u ON u.id = link.student_user_id
         LEFT JOIN student_profiles sp ON sp.uid = u.id
         JOIN sections s ON s.id = a.section_id
         JOIN classes c ON c.id = s.class_id
         LEFT JOIN assignment_submissions sub
              ON sub.assignment_id = a.id AND sub.student_id = link.student_user_id
         WHERE sub.id IS NULL OR sub.status = 'PENDING'
         ORDER BY datetime(a.due_date) ASC
         LIMIT 25`
      )
      .all(auth.parentId) as {
        id: string;
        title: string;
        dueDate: string | null;
        subject: string | null;
        className: string | null;
        sectionName: string | null;
        studentName: string | null;
        studentId: string;
      }[];

    // Achievements earned by linked children (real rows only).
    const achievements = db
      .prepare(
        `SELECT sa.badge_code AS badgeCode, sa.earned_at AS earnedAt,
                COALESCE(sp.display_name, u.email) AS studentName
         FROM student_achievements sa
         JOIN parent_student_links link ON link.student_user_id = sa.student_id
         JOIN users u ON u.id = sa.student_id
         LEFT JOIN student_profiles sp ON sp.uid = u.id
         WHERE link.parent_user_id = ?
         ORDER BY datetime(sa.earned_at) DESC
         LIMIT 25`
      )
      .all(auth.parentId) as {
        badgeCode: string;
        earnedAt: string;
        studentName: string | null;
      }[];

    return NextResponse.json({
      children: performance,
      recentActivities,
      pendingAssignments: pendingAssignments.map((a) => ({
        ...a,
        deadline: deadlineInfo(a.dueDate),
      })),
      achievements,
      summary: {
        studentsCount: performance.length,
        activitiesThisWeek: activitiesThisWeek.count,
        pendingAssignments: pendingAssignments.length,
        achievements: achievements.length,
        averageImprovement: performance.length === 0
          ? 0
          : availableImprovements.length
            ? availableImprovements.reduce((total, value) => total + value, 0) / availableImprovements.length
            : null,
      },
    });
  } catch (error) {
    console.error('[Parent Children API] Error:', error);
    return NextResponse.json({ error: 'Failed to load linked students.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedParentId();
    if ('error' in auth) return auth.error;

    const body = await req.json().catch(() => null) as { studentCode?: unknown } | null;
    if (typeof body?.studentCode !== 'string') {
      return NextResponse.json({ error: 'Enter a valid student code.' }, { status: 400 });
    }
    const studentCode = body.studentCode.trim().toUpperCase();
    if (!/^EDU-[2-9A-HJ-NP-Z]{6}$/.test(studentCode)) {
      return NextResponse.json({ error: 'Enter a valid student code.' }, { status: 400 });
    }

    const db = getDb();
    const student = db.prepare(`
      SELECT u.id
      FROM users u
      JOIN student_profiles sp ON sp.uid = u.id
      WHERE u.role = 'STUDENT' AND sp.student_code = ?
    `).get(studentCode) as { id: string } | undefined;
    if (!student) {
      return NextResponse.json({ error: 'No student account matches that code.' }, { status: 404 });
    }

    const result = db.prepare(`
      INSERT OR IGNORE INTO parent_student_links (id, parent_user_id, student_user_id)
      VALUES (?, ?, ?)
    `).run(randomUUID(), auth.parentId, student.id);
    if (result.changes === 0) {
      return NextResponse.json({ error: 'This student is already linked to your account.' }, { status: 409 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('[Parent Link API] Error:', error);
    return NextResponse.json({ error: 'Failed to link student.' }, { status: 500 });
  }
}
