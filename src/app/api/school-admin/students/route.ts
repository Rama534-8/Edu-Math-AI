import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireRoles, requireSchoolId } from '@/lib/authz';

interface StudentRow {
  id: string;
  displayName: string;
  email: string;
  className: string | null;
  board: string | null;
  medium: string | null;
  studentCode: string | null;
  schoolName: string | null;
  xp: number;
  level: number;
  streakDays: number;
  questionsSolved: number;
  totalStudyMinutes: number;
  sectionName: string | null;
  classId: string | null;
  sectionId: string | null;
  quizAttempts: number;
  averageScore: number | null;
  bestScore: number | null;
  attendancePresent: number;
  attendanceTotal: number;
  createdAt: string;
}

/**
 * Students inside the caller's school, with the aggregates the Students table
 * and Reports screen need. Scoped by `users.school_id`, so a school admin can
 * never read another school's students.
 */
export async function GET(req: Request) {
  try {
    const auth = await requireRoles(['SCHOOL_ADMIN', 'PLATFORM_ADMIN']);
    if ('error' in auth) return auth.error;
    const school = requireSchoolId(auth.actor);
    if ('error' in school) return school.error;

    const url = new URL(req.url);
    const search = (url.searchParams.get('search') ?? '').trim();
    const classFilter = url.searchParams.get('classId') ?? '';
    const boardFilter = url.searchParams.get('board') ?? '';
    const isSchoolScope = auth.actor.role === 'SCHOOL_ADMIN';

    const params: unknown[] = [];
    const where: string[] = ["u.role = 'STUDENT'", "u.status = 'ACTIVE'"];
    if (isSchoolScope) {
      where.push('u.school_id = ?');
      params.push(school.schoolId);
    } else if (school.schoolId) {
      where.push('u.school_id = ?');
      params.push(school.schoolId);
    }
    if (search) {
      where.push('(sp.display_name LIKE ? OR u.email LIKE ? OR sp.student_code LIKE ?)');
      const like = `%${search}%`;
      params.push(like, like, like);
    }
    if (classFilter) {
      where.push('c.id = ?');
      params.push(classFilter);
    }
    if (boardFilter) {
      where.push('sp.board = ?');
      params.push(boardFilter);
    }

    const rows = getDb()
      .prepare(
        `SELECT sp.uid AS id,
                COALESCE(sp.display_name, u.email) AS displayName,
                u.email,
                sp.class_name AS className,
                sp.board,
                sp.medium,
                sp.student_code AS studentCode,
                sp.school_name AS schoolName,
                sp.xp, sp.level, sp.streak_days AS streakDays,
                sp.questions_solved AS questionsSolved,
                sp.total_study_minutes AS totalStudyMinutes,
                s.name AS sectionName,
                c.id AS classId,
                s.id AS sectionId,
                (SELECT COUNT(*) FROM assessment_snapshots a WHERE a.student_id = sp.uid) AS quizAttempts,
                (SELECT ROUND(AVG(a.percentage), 1) FROM assessment_snapshots a WHERE a.student_id = sp.uid) AS averageScore,
                (SELECT MAX(a.percentage) FROM assessment_snapshots a WHERE a.student_id = sp.uid) AS bestScore,
                (SELECT COUNT(*) FROM attendance att
                  WHERE att.student_id = sp.uid AND att.status IN ('PRESENT', 'LATE')) AS attendancePresent,
                (SELECT COUNT(*) FROM attendance att WHERE att.student_id = sp.uid) AS attendanceTotal,
                u.created_at AS createdAt
         FROM student_profiles sp
         JOIN users u ON u.id = sp.uid
         LEFT JOIN student_enrollments se ON se.student_id = sp.uid
         LEFT JOIN sections s ON s.id = se.section_id
         LEFT JOIN classes c ON c.id = s.class_id
         WHERE ${where.join(' AND ')}
         ORDER BY sp.display_name COLLATE NOCASE`
      )
      .all(...params) as StudentRow[];

    const classes = getDb()
      .prepare(
        `SELECT c.id AS classId, c.name AS className, s.id AS sectionId, s.name AS sectionName,
                (SELECT COUNT(*) FROM student_enrollments se2 WHERE se2.section_id = s.id) AS studentCount
         FROM classes c
         LEFT JOIN sections s ON s.class_id = c.id
         WHERE c.school_id = ?
         ORDER BY c.name, s.name`
      )
      .all(school.schoolId) as Record<string, unknown>[];

    return NextResponse.json({ students: rows, classes, schoolId: school.schoolId });
  } catch (error) {
    console.error('[School Admin Students API] Error:', error);
    return NextResponse.json({ error: 'Failed to load students.' }, { status: 500 });
  }
}