import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { getDb } from '@/lib/db';

interface DashboardStats {
  assignedStudents: number;
  assignedClasses: number;
  assignments: number;
  pendingSubmissions: number;
  quizzes: number;
}

export async function GET() {
  try {
    const session = await getSessionFromRequest();
    if (!session || !['TEACHER', 'SCHOOL_ADMIN', 'PLATFORM_ADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    const db = getDb();

    if (session.role !== 'TEACHER') {
      // Admins see school-wide totals instead of a personal workload.
      const schoolId = session.schoolId;
      const scopedUsers = db.prepare(
        schoolId
          ? 'SELECT COUNT(*) AS count FROM users WHERE school_id = ? AND role = ?'
          : 'SELECT COUNT(*) AS count FROM users WHERE school_id IS NULL AND role = ?'
      );
      const students = scopedUsers.get(...(schoolId ? [schoolId, 'STUDENT'] : [null, 'STUDENT'])) as { count: number };
      const teachers = scopedUsers.get(...(schoolId ? [schoolId, 'TEACHER'] : [null, 'TEACHER'])) as { count: number };

      const classes = db
        .prepare(schoolId ? 'SELECT COUNT(*) AS count FROM classes WHERE school_id = ?' : 'SELECT COUNT(*) AS count FROM classes')
        .get(...(schoolId ? [schoolId] : [])) as { count: number };
      const assignments = db
        .prepare(schoolId ? 'SELECT COUNT(*) AS count FROM assignments WHERE school_id = ?' : 'SELECT COUNT(*) AS count FROM assignments')
        .get(...(schoolId ? [schoolId] : [])) as { count: number };
      const pendingSubmissions = db
        .prepare(
          schoolId
            ? `SELECT COUNT(*) AS count FROM assignment_submissions sub
               JOIN assignments a ON a.id = sub.assignment_id
               WHERE a.school_id = ? AND sub.status = 'PENDING'`
            : `SELECT COUNT(*) AS count FROM assignment_submissions WHERE status = 'PENDING'`
        )
        .get(...(schoolId ? [schoolId] : [])) as { count: number };
      const quizzes = db
        .prepare(
          schoolId
            ? `SELECT COUNT(*) AS count FROM quizzes q
               JOIN sections s ON s.id = q.section_id
               JOIN classes c ON c.id = s.class_id
               WHERE c.school_id = ?`
            : 'SELECT COUNT(*) AS count FROM quizzes'
        )
        .get(...(schoolId ? [schoolId] : [])) as { count: number };

      const stats: DashboardStats = {
        assignedStudents: students.count || 0,
        assignedClasses: classes.count || 0,
        assignments: assignments.count || 0,
        pendingSubmissions: pendingSubmissions.count || 0,
        quizzes: quizzes.count || 0,
      };
      return NextResponse.json({ stats });
    }

    const studentCount = db
      .prepare(
        `SELECT COUNT(DISTINCT se.student_id) as count
         FROM teacher_assignments ta
         JOIN student_enrollments se ON ta.section_id = se.section_id
         WHERE ta.teacher_id = ?`
      )
      .get(session.userId) as { count: number };

    const classCount = db
      .prepare(
        `SELECT COUNT(DISTINCT ta.section_id) as count
         FROM teacher_assignments ta
         WHERE ta.teacher_id = ?`
      )
      .get(session.userId) as { count: number };

    const assignmentCount = db
      .prepare('SELECT COUNT(id) as count FROM assignments WHERE teacher_id = ?')
      .get(session.userId) as { count: number };

    const submissionCount = db
      .prepare(
        `SELECT COUNT(sub.id) as count
         FROM assignment_submissions sub
         JOIN assignments a ON sub.assignment_id = a.id
         WHERE a.teacher_id = ? AND sub.status = 'PENDING'`
      )
      .get(session.userId) as { count: number };

    const quizCount = db
      .prepare('SELECT COUNT(id) as count FROM quizzes WHERE teacher_id = ?')
      .get(session.userId) as { count: number };

    const stats: DashboardStats = {
      assignedStudents: studentCount.count || 0,
      assignedClasses: classCount.count || 0,
      assignments: assignmentCount.count || 0,
      pendingSubmissions: submissionCount.count || 0,
      quizzes: quizCount.count || 0,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('[Dashboard API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats.' }, { status: 500 });
  }
}
