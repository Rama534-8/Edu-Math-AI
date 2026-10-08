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

    const roleCounts = (auth.actor.role === 'SCHOOL_ADMIN'
      ? db.prepare('SELECT role, COUNT(*) AS count FROM users u WHERE u.school_id = ? GROUP BY role').all(school.schoolId)
      : db.prepare('SELECT role, COUNT(*) AS count FROM users GROUP BY role').all()
    ) as { role: string; count: number }[];

    const countForRole = (role: string) => roleCounts.find((item) => item.role === role)?.count ?? 0;
    const studentCount = countForRole('STUDENT');

    const assessmentStats = (auth.actor.role === 'SCHOOL_ADMIN'
      ? db.prepare(`
          SELECT COUNT(*) AS attempts,
                 COUNT(DISTINCT student_id) AS participants,
                 ROUND(AVG(percentage), 1) AS averageScore,
                 ROUND(AVG(accuracy), 1) AS averageAccuracy
          FROM assessment_snapshots a
          JOIN users u ON u.id = a.student_id
          WHERE u.school_id = ?
        `).get(school.schoolId)
      : db.prepare(`
          SELECT COUNT(*) AS attempts,
                 COUNT(DISTINCT student_id) AS participants,
                 ROUND(AVG(percentage), 1) AS averageScore,
                 ROUND(AVG(accuracy), 1) AS averageAccuracy
          FROM assessment_snapshots
        `).get()
    ) as {
      attempts: number;
      participants: number;
      averageScore: number | null;
      averageAccuracy: number | null;
    };

    const activeStudents = (auth.actor.role === 'SCHOOL_ADMIN'
      ? db.prepare(`
          SELECT COUNT(DISTINCT activity.student_id) AS count
          FROM activity_log activity
          JOIN users u ON u.id = activity.student_id
          WHERE activity.created_at >= datetime('now', '-7 days') AND u.school_id = ?
        `).get(school.schoolId)
      : db.prepare(`
          SELECT COUNT(DISTINCT student_id) AS count
          FROM activity_log
          WHERE created_at >= datetime('now', '-7 days')
        `).get()
    ) as { count: number };

    const recentActivity = (auth.actor.role === 'SCHOOL_ADMIN'
      ? db.prepare(`
          SELECT activity.id, profile.display_name AS studentName,
                 activity.activity_type AS activityType, activity.created_at AS createdAt
          FROM activity_log activity
          JOIN student_profiles profile ON profile.uid = activity.student_id
          JOIN users u ON u.id = activity.student_id
          WHERE u.school_id = ?
          ORDER BY activity.created_at DESC
          LIMIT 8
        `).all(school.schoolId)
      : db.prepare(`
          SELECT activity.id, profile.display_name AS studentName,
                 activity.activity_type AS activityType, activity.created_at AS createdAt
          FROM activity_log activity
          JOIN student_profiles profile ON profile.uid = activity.student_id
          ORDER BY activity.created_at DESC
          LIMIT 8
        `).all()
    ) as {
      id: string;
      studentName: string;
      activityType: string;
      createdAt: string;
    }[];

    // Phase 12 - real institution metrics. Every number below is a COUNT over an
    // existing table; nothing is estimated or hard-coded.
    const schoolScoped = auth.actor.role === 'SCHOOL_ADMIN';
    const schoolId = school.schoolId;

    const institution = (schoolScoped
      ? db.prepare(
          `SELECT
             (SELECT COUNT(*) FROM schools) AS schools,
             (SELECT COUNT(*) FROM classes WHERE school_id = ?) AS classes,
             (SELECT COUNT(*) FROM sections WHERE class_id IN (SELECT id FROM classes WHERE school_id = ?)) AS sections,
             (SELECT COUNT(*) FROM announcements WHERE school_id = ? AND is_active = 1) AS activeAnnouncements,
             (SELECT COUNT(*) FROM assignments WHERE school_id = ?) AS assignments,
             (SELECT COUNT(*) FROM assessment_snapshots a JOIN users u ON u.id = a.student_id WHERE u.school_id = ?) AS quizAttempts,
             (SELECT COUNT(*) FROM notifications) AS notifications`
        ).get(schoolId, schoolId, schoolId, schoolId, schoolId)
      : db.prepare(
          `SELECT
             (SELECT COUNT(*) FROM schools) AS schools,
             (SELECT COUNT(*) FROM classes) AS classes,
             (SELECT COUNT(*) FROM sections) AS sections,
             (SELECT COUNT(*) FROM announcements WHERE is_active = 1) AS activeAnnouncements,
             (SELECT COUNT(*) FROM assignments) AS assignments,
             (SELECT COUNT(*) FROM assessment_snapshots) AS quizAttempts,
             (SELECT COUNT(*) FROM notifications) AS notifications`
        ).get()) as {
      schools: number;
      classes: number;
      sections: number;
      activeAnnouncements: number;
      assignments: number;
      quizAttempts: number;
      notifications: number;
    };

    const learningActivity = (schoolScoped
      ? db.prepare(
          `SELECT activity_type AS activityType, COUNT(*) AS count
           FROM activity_log a JOIN users u ON u.id = a.student_id
           WHERE u.school_id = ? GROUP BY activity_type ORDER BY count DESC`
        ).all(schoolId)
      : db.prepare(
          `SELECT activity_type AS activityType, COUNT(*) AS count
           FROM activity_log GROUP BY activity_type ORDER BY count DESC`
        ).all()) as { activityType: string; count: number }[];

    return NextResponse.json({
      scope: auth.actor.role === 'SCHOOL_ADMIN' ? 'SCHOOL' : 'PLATFORM',
      schoolId: auth.actor.role === 'SCHOOL_ADMIN' ? school.schoolId : null,
      users: {
        total: roleCounts.reduce((total, item) => total + item.count, 0),
        students: studentCount,
        teachers: countForRole('TEACHER'),
        parents: countForRole('PARENT'),
        schoolAdmins: countForRole('SCHOOL_ADMIN'),
        platformAdmins: auth.actor.role === 'PLATFORM_ADMIN' ? countForRole('PLATFORM_ADMIN') : 0,
      },
      activity: {
        activeStudentsLast7Days: activeStudents.count,
        assessmentParticipants: assessmentStats.participants,
        participationRate: studentCount
          ? Math.round(assessmentStats.participants / studentCount * 100)
          : null,
        recent: recentActivity,
      },
      institution,
      learningActivity,
      assessments: assessmentStats,
    });
  } catch (error) {
    console.error('[Platform Admin Overview] Error:', error);
    return NextResponse.json({ error: 'Failed to load platform overview.' }, { status: 500 });
  }
}
