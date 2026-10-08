import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireRoles, requireSchoolId } from '@/lib/authz';

export async function GET() {
  try {
    const auth = await requireRoles(['PLATFORM_ADMIN', 'SCHOOL_ADMIN']);
    if ('error' in auth) return auth.error;
    const school = requireSchoolId(auth.actor);
    if ('error' in school) return school.error;

    const db = getDb();
    const isSchool = auth.actor.role === 'SCHOOL_ADMIN';
    const schoolId = school.schoolId;

    const passFailBreakdown = (isSchool
      ? db.prepare(`
          SELECT result_status, COUNT(*) AS count
          FROM assessment_snapshots a
          JOIN users u ON u.id = a.student_id
          WHERE u.school_id = ?
          GROUP BY result_status
        `).all(schoolId)
      : db.prepare(`
          SELECT result_status, COUNT(*) AS count
          FROM assessment_snapshots
          GROUP BY result_status
        `).all()
    ) as { result_status: string; count: number }[];

    const passCount = passFailBreakdown.find((r) => r.result_status === 'PASS')?.count ?? 0;
    const failCount = passFailBreakdown.find((r) => r.result_status === 'FAIL')?.count ?? 0;
    const totalAttempts = passCount + failCount;
    const passRate = totalAttempts > 0 ? Math.round((passCount / totalAttempts) * 100) : null;

    const scoreBuckets = (isSchool
      ? db.prepare(`
          SELECT
            CASE
              WHEN percentage >= 90 THEN '90-100'
              WHEN percentage >= 80 THEN '80-89'
              WHEN percentage >= 70 THEN '70-79'
              WHEN percentage >= 60 THEN '60-69'
              WHEN percentage >= 50 THEN '50-59'
              WHEN percentage >= 40 THEN '40-49'
              WHEN percentage >= 30 THEN '30-39'
              WHEN percentage >= 20 THEN '20-29'
              WHEN percentage >= 10 THEN '10-19'
              ELSE '0-9'
            END AS bucket,
            COUNT(*) AS count
          FROM assessment_snapshots a
          JOIN users u ON u.id = a.student_id
          WHERE u.school_id = ?
          GROUP BY bucket
          ORDER BY bucket DESC
        `).all(schoolId)
      : db.prepare(`
          SELECT
            CASE
              WHEN percentage >= 90 THEN '90-100'
              WHEN percentage >= 80 THEN '80-89'
              WHEN percentage >= 70 THEN '70-79'
              WHEN percentage >= 60 THEN '60-69'
              WHEN percentage >= 50 THEN '50-59'
              WHEN percentage >= 40 THEN '40-49'
              WHEN percentage >= 30 THEN '30-39'
              WHEN percentage >= 20 THEN '20-29'
              WHEN percentage >= 10 THEN '10-19'
              ELSE '0-9'
            END AS bucket,
            COUNT(*) AS count
          FROM assessment_snapshots
          GROUP BY bucket
          ORDER BY bucket DESC
        `).all()
    ) as { bucket: string; count: number }[];

    const typeBreakdown = (isSchool
      ? db.prepare(`
          SELECT type, COUNT(*) AS attempts,
                 ROUND(AVG(percentage), 1) AS avgScore,
                 ROUND(AVG(accuracy), 1) AS avgAccuracy,
                 SUM(CASE WHEN result_status = 'PASS' THEN 1 ELSE 0 END) AS passed,
                 SUM(CASE WHEN result_status = 'FAIL' THEN 1 ELSE 0 END) AS failed
          FROM assessment_snapshots a
          JOIN users u ON u.id = a.student_id
          WHERE u.school_id = ?
          GROUP BY type
          ORDER BY attempts DESC
        `).all(schoolId)
      : db.prepare(`
          SELECT type, COUNT(*) AS attempts,
                 ROUND(AVG(percentage), 1) AS avgScore,
                 ROUND(AVG(accuracy), 1) AS avgAccuracy,
                 SUM(CASE WHEN result_status = 'PASS' THEN 1 ELSE 0 END) AS passed,
                 SUM(CASE WHEN result_status = 'FAIL' THEN 1 ELSE 0 END) AS failed
          FROM assessment_snapshots
          GROUP BY type
          ORDER BY attempts DESC
        `).all()
    ) as {
      type: string;
      attempts: number;
      avgScore: number | null;
      avgAccuracy: number | null;
      passed: number;
      failed: number;
    }[];

    const boardBreakdown = (isSchool
      ? db.prepare(`
          SELECT sp.board, COUNT(*) AS students,
                 ROUND(AVG(sp.xp), 0) AS avgXP,
                 ROUND(AVG(sp.questions_solved), 0) AS avgQuestionsSolved
          FROM student_profiles sp
          JOIN users u ON u.id = sp.uid
          WHERE u.school_id = ?
          GROUP BY sp.board
        `).all(schoolId)
      : db.prepare(`
          SELECT board, COUNT(*) AS students,
                 ROUND(AVG(sp.xp), 0) AS avgXP,
                 ROUND(AVG(sp.questions_solved), 0) AS avgQuestionsSolved
          FROM student_profiles sp
          GROUP BY board
        `).all()
    ) as {
      board: string;
      students: number;
      avgXP: number;
      avgQuestionsSolved: number;
    }[];

    const topPerformers = (isSchool
      ? db.prepare(`
          SELECT sp.display_name AS name, sp.class_name AS className,
                 sp.board, sp.xp, sp.level, sp.questions_solved AS questionsSolved,
                 sp.streak_days AS streak
          FROM student_profiles sp
          JOIN users u ON u.id = sp.uid
          WHERE u.school_id = ?
          ORDER BY sp.xp DESC
          LIMIT 10
        `).all(schoolId)
      : db.prepare(`
          SELECT sp.display_name AS name, sp.class_name AS className,
                 sp.board, sp.xp, sp.level, sp.questions_solved AS questionsSolved,
                 sp.streak_days AS streak
          FROM student_profiles sp
          ORDER BY sp.xp DESC
          LIMIT 10
        `).all()
    ) as {
      name: string;
      className: string;
      board: string;
      xp: number;
      level: number;
      questionsSolved: number;
      streak: number;
    }[];

    const recentAssessments = (isSchool
      ? db.prepare(`
          SELECT a.id, sp.display_name AS studentName,
                 a.type, a.percentage, a.result_status AS resultStatus,
                 a.correct_count AS correct, a.total_questions AS total,
                 a.created_at AS createdAt
          FROM assessment_snapshots a
          JOIN student_profiles sp ON sp.uid = a.student_id
          JOIN users u ON u.id = a.student_id
          WHERE u.school_id = ?
          ORDER BY a.created_at DESC
          LIMIT 15
        `).all(schoolId)
      : db.prepare(`
          SELECT a.id, sp.display_name AS studentName,
                 a.type, a.percentage, a.result_status AS resultStatus,
                 a.correct_count AS correct, a.total_questions AS total,
                 a.created_at AS createdAt
          FROM assessment_snapshots a
          JOIN student_profiles sp ON sp.uid = a.student_id
          ORDER BY a.created_at DESC
          LIMIT 15
        `).all()
    ) as {
      id: string;
      studentName: string;
      type: string;
      percentage: number;
      resultStatus: string;
      correct: number;
      total: number;
      createdAt: string;
    }[];

    const activityTrend = (isSchool
      ? db.prepare(`
          SELECT DATE(activity.created_at) AS day, COUNT(*) AS count
          FROM activity_log activity
          JOIN users u ON u.id = activity.student_id
          WHERE activity.created_at >= datetime('now', '-7 days') AND u.school_id = ?
          GROUP BY DATE(activity.created_at)
          ORDER BY day ASC
        `).all(schoolId)
      : db.prepare(`
          SELECT DATE(created_at) AS day, COUNT(*) AS count
          FROM activity_log
          WHERE created_at >= datetime('now', '-7 days')
          GROUP BY DATE(created_at)
          ORDER BY day ASC
        `).all()
    ) as { day: string; count: number }[];

    const retestStats = (isSchool
      ? db.prepare(`
          SELECT COUNT(*) AS totalRetests,
                 SUM(CASE WHEN result_status = 'PASS' THEN 1 ELSE 0 END) AS retestPassed,
                 ROUND(AVG(percentage), 1) AS avgRetestScore
          FROM assessment_snapshots a
          JOIN users u ON u.id = a.student_id
          WHERE a.is_retest = 1 AND u.school_id = ?
        `).get(schoolId)
      : db.prepare(`
          SELECT COUNT(*) AS totalRetests,
                 SUM(CASE WHEN result_status = 'PASS' THEN 1 ELSE 0 END) AS retestPassed,
                 ROUND(AVG(percentage), 1) AS avgRetestScore
          FROM assessment_snapshots
          WHERE is_retest = 1
        `).get()
    ) as { totalRetests: number; retestPassed: number; avgRetestScore: number | null };

    return NextResponse.json({
      passFail: { passed: passCount, failed: failCount, total: totalAttempts, passRate },
      scoreBuckets,
      typeBreakdown,
      boardBreakdown,
      topPerformers,
      recentAssessments,
      activityTrend,
      retestStats,
    });
  } catch (error) {
    console.error('[Admin Analytics API] Error:', error);
    return NextResponse.json({ error: 'Failed to load analytics data.' }, { status: 500 });
  }
}
