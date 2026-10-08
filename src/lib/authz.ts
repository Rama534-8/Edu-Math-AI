import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { lookupSession, type Actor } from '@/lib/session';

export type { Actor };

export async function requireAuth(): Promise<{ actor: Actor } | { error: NextResponse }> {
  const lookup = await lookupSession();
  if (lookup.type === 'unauthenticated') {
    return { error: NextResponse.json({ error: 'Not authenticated.' }, { status: 401 }) };
  }
  if (lookup.type === 'inactive') {
    return { error: NextResponse.json({ error: 'Account is not active.' }, { status: 403 }) };
  }
  return { actor: lookup.actor };
}

export async function requireRoles(
  roles: readonly string[]
): Promise<{ actor: Actor } | { error: NextResponse }> {
  const auth = await requireAuth();
  if ('error' in auth) return auth;
  if (!roles.includes(auth.actor.role)) {
    return { error: NextResponse.json({ error: 'Forbidden.' }, { status: 403 }) };
  }
  return auth;
}

export function requireSchoolId(actor: Actor): { schoolId: string } | { error: NextResponse } {
  if (actor.role === 'PLATFORM_ADMIN') {
    return { schoolId: actor.schoolId ?? '' };
  }
  if (actor.role !== 'SCHOOL_ADMIN') {
    return { error: NextResponse.json({ error: 'Forbidden.' }, { status: 403 }) };
  }
  if (!actor.schoolId) {
    return { error: NextResponse.json({ error: 'School administrator is not assigned to a school.' }, { status: 403 }) };
  }
  return { schoolId: actor.schoolId };
}

export function schoolUserFilter(actor: Actor): { clause: string; params: string[] } {
  if (actor.role === 'PLATFORM_ADMIN') {
    return { clause: '', params: [] };
  }
  if (actor.role === 'SCHOOL_ADMIN' && actor.schoolId) {
    return { clause: 'AND u.school_id = ?', params: [actor.schoolId] };
  }
  return { clause: 'AND 1 = 0', params: [] };
}

export function teacherCanAccessStudent(teacherId: string, studentId: string): boolean {
  const row = getDb().prepare(`
    SELECT 1 AS ok
    FROM teacher_assignments ta
    JOIN student_enrollments se ON se.section_id = ta.section_id
    WHERE ta.teacher_id = ? AND se.student_id = ?
    LIMIT 1
  `).get(teacherId, studentId);
  return Boolean(row);
}

export function teacherCanAccessSection(teacherId: string, sectionId: string): boolean {
  const row = getDb()
    .prepare('SELECT 1 AS ok FROM teacher_assignments WHERE teacher_id = ? AND section_id = ? LIMIT 1')
    .get(teacherId, sectionId);
  return Boolean(row);
}

export function parentLinkedToStudent(parentId: string, studentId: string): boolean {
  const row = getDb()
    .prepare(
      'SELECT 1 AS ok FROM parent_student_links WHERE parent_user_id = ? AND student_user_id = ? LIMIT 1'
    )
    .get(parentId, studentId);
  return Boolean(row);
}

export function sectionBelongsToSchool(sectionId: string, schoolId: string): boolean {
  const row = getDb().prepare(`
    SELECT 1 AS ok
    FROM sections s
    JOIN classes c ON c.id = s.class_id
    WHERE s.id = ? AND c.school_id = ?
    LIMIT 1
  `).get(sectionId, schoolId);
  return Boolean(row);
}

export function userBelongsToSchool(userId: string, schoolId: string): boolean {
  const row = getDb()
    .prepare('SELECT 1 AS ok FROM users WHERE id = ? AND school_id = ? LIMIT 1')
    .get(userId, schoolId);
  return Boolean(row);
}

export function teacherAssignmentBelongsToSchool(assignmentId: string, schoolId: string): boolean {
  const row = getDb().prepare(`
    SELECT 1 AS ok
    FROM teacher_assignments ta
    JOIN sections s ON s.id = ta.section_id
    JOIN classes c ON c.id = s.class_id
    WHERE ta.id = ? AND c.school_id = ?
    LIMIT 1
  `).get(assignmentId, schoolId);
  return Boolean(row);
}

export function quizBelongsToSchool(quizId: string, schoolId: string): boolean {
  const row = getDb().prepare(`
    SELECT 1 AS ok
    FROM quizzes q
    JOIN sections s ON s.id = q.section_id
    JOIN classes c ON c.id = s.class_id
    WHERE q.id = ? AND c.school_id = ?
    LIMIT 1
  `).get(quizId, schoolId);
  return Boolean(row);
}

export function sanitizePrivilegedClientFields(body: Record<string, unknown>): void {
  const blocked = [
    'role', 'userId', 'schoolId', 'studentId', 'teacherId', 'parentId',
    'xp', 'level', 'score', 'percentage', 'resultStatus', 'result_status',
    'permissions', 'status', 'streakDays', 'streak_days', 'totalStudyMinutes',
    'questionsSolved', 'questions_solved',
  ];
  for (const key of blocked) {
    if (key in body) delete body[key];
  }
}
