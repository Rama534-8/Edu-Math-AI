import type Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

export const ACTIVITY_XP = {
  PRACTICE: 15,
  QUIZ: 10,
  LESSON: 5,
  REVISION: 8,
  STUDY_TICK: 0,
} as const;

export type ActivityEventType = keyof typeof ACTIVITY_XP;

export function levelFromXp(xp: number): number {
  return Math.floor(Math.max(0, xp) / 1000) + 1;
}

export function computeStreak(
  lastActiveDate: string | null | undefined,
  currentStreak: number,
  now = new Date()
): { streak: number; occurredOn: string } {
  const today = now.toISOString().slice(0, 10);
  const last = lastActiveDate?.slice(0, 10) || null;
  let streak = Number.isFinite(currentStreak) ? currentStreak : 0;
  if (!last) {
    streak = 1;
  } else if (last !== today) {
    const lastMs = Date.parse(`${last}T00:00:00.000Z`);
    const todayMs = Date.parse(`${today}T00:00:00.000Z`);
    const diffDays = Math.round((todayMs - lastMs) / 86_400_000);
    streak = diffDays === 1 ? streak + 1 : 1;
  }
  return { streak, occurredOn: now.toISOString() };
}

export function awardXp(
  db: Database.Database,
  studentId: string,
  amount: number,
  options?: { questions?: number }
): { xp: number; level: number; awarded: number } {
  const profile = db.prepare(
    'SELECT xp FROM student_profiles WHERE uid = ?'
  ).get(studentId) as { xp: number } | undefined;
  if (!profile) {
    throw new Error('Student profile not found.');
  }
  const awarded = Math.max(0, Math.floor(amount));
  const xp = profile.xp + awarded;
  const level = levelFromXp(xp);
  const questions = options?.questions ?? 0;
  db.prepare(`
    UPDATE student_profiles
    SET xp = ?, level = ?, questions_solved = questions_solved + ?
    WHERE uid = ?
  `).run(xp, level, questions, studentId);
  return { xp, level, awarded };
}

export function applyStudentActivity(
  db: Database.Database,
  studentId: string,
  eventType: ActivityEventType
): {
  xp: number;
  level: number;
  streakDays: number;
  totalStudyMinutes: number;
  xpAwarded: number;
} {
  const profile = db.prepare(
    'SELECT xp, streak_days, last_active_date, questions_solved, total_study_minutes FROM student_profiles WHERE uid = ?'
  ).get(studentId) as {
    xp: number;
    streak_days: number;
    last_active_date: string | null;
    questions_solved: number;
    total_study_minutes: number;
  } | undefined;
  if (!profile) {
    throw new Error('Student profile not found.');
  }

  const xpAwarded = ACTIVITY_XP[eventType];
  const { streak, occurredOn } = computeStreak(profile.last_active_date, profile.streak_days);
  const questionsDelta = eventType === 'PRACTICE' || eventType === 'QUIZ' ? 1 : 0;
  const minutesDelta = eventType === 'LESSON' || eventType === 'REVISION' || eventType === 'STUDY_TICK' ? 1 : 0;
  const xp = profile.xp + xpAwarded;
  const level = levelFromXp(xp);

  db.prepare(`
    UPDATE student_profiles
    SET xp = ?, level = ?, streak_days = ?, last_active_date = ?,
        questions_solved = questions_solved + ?, total_study_minutes = total_study_minutes + ?
    WHERE uid = ?
  `).run(xp, level, streak, occurredOn, questionsDelta, minutesDelta, studentId);

  db.prepare(
    'INSERT INTO activity_log (id, student_id, activity_type) VALUES (?, ?, ?)'
  ).run(randomUUID(), studentId, eventType);

  return {
    xp,
    level,
    streakDays: streak,
    totalStudyMinutes: profile.total_study_minutes + minutesDelta,
    xpAwarded,
  };
}

export function touchStreak(db: Database.Database, studentId: string): void {
  const profile = db.prepare(
    'SELECT streak_days, last_active_date FROM student_profiles WHERE uid = ?'
  ).get(studentId) as { streak_days: number; last_active_date: string | null } | undefined;
  if (!profile) return;
  const { streak, occurredOn } = computeStreak(profile.last_active_date, profile.streak_days);
  db.prepare(
    'UPDATE student_profiles SET streak_days = ?, last_active_date = ? WHERE uid = ?'
  ).run(streak, occurredOn, studentId);
}
