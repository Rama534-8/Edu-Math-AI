import type Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import type { Actor } from '@/lib/session';

export const ANNOUNCEMENT_TYPES = [
  'GENERAL',
  'IMPORTANT',
  'EXAM',
  'HOLIDAY',
  'ASSIGNMENT',
  'EVENT',
] as const;
export type AnnouncementType = (typeof ANNOUNCEMENT_TYPES)[number];

export const ANNOUNCEMENT_AUDIENCES = [
  'EVERYONE',
  'STUDENTS',
  'TEACHERS',
  'PARENTS',
  'SCHOOL',
  'CLASS',
  'SECTION',
] as const;
export type AnnouncementAudience = (typeof ANNOUNCEMENT_AUDIENCES)[number];

export interface AnnouncementRow {
  id: string;
  schoolId: string | null;
  authorId: string | null;
  authorName: string | null;
  title: string;
  message: string;
  type: AnnouncementType;
  audience: AnnouncementAudience;
  targetClassId: string | null;
  targetSectionId: string | null;
  className: string | null;
  sectionName: string | null;
  schoolName: string | null;
  isPinned: boolean;
  isActive: boolean;
  publishAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export function isAnnouncementType(value: unknown): value is AnnouncementType {
  return typeof value === 'string' && (ANNOUNCEMENT_TYPES as readonly string[]).includes(value);
}

export function isAnnouncementAudience(value: unknown): value is AnnouncementAudience {
  return typeof value === 'string' && (ANNOUNCEMENT_AUDIENCES as readonly string[]).includes(value);
}

/**
 * Normalises the free-form date inputs the admin form submits into a single
 * comparable ISO string. Blank/invalid input becomes null so the column simply
 * stays NULL rather than storing an unparsable value.
 */
export function normaliseTimestamp(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const parsed = new Date(value.trim());
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

/** Shared projection so every announcements surface returns identical keys. */
const SELECT_ANNOUNCEMENT = `
  SELECT an.id,
         an.school_id AS schoolId,
         an.author_id AS authorId,
         COALESCE(sp.display_name, tp.display_name, au.email, 'EduMathAI') AS authorName,
         an.title,
         an.message,
         an.type,
         an.audience,
         an.target_class_id AS targetClassId,
         an.target_section_id AS targetSectionId,
         c.name AS className,
         s.name AS sectionName,
         sc.name AS schoolName,
         an.is_pinned AS isPinned,
         an.is_active AS isActive,
         an.publish_at AS publishAt,
         an.expires_at AS expiresAt,
         an.created_at AS createdAt
  FROM announcements an
  LEFT JOIN users au ON au.id = an.author_id
  LEFT JOIN student_profiles sp ON sp.uid = an.author_id
  LEFT JOIN teacher_profiles tp ON tp.uid = an.author_id
  LEFT JOIN schools sc ON sc.id = an.school_id
  LEFT JOIN classes c ON c.id = an.target_class_id
  LEFT JOIN sections s ON s.id = an.target_section_id
`;

/**
 * SQLite has no native BOOLEAN - is_pinned / is_active come back as 1 / 0.
 * The API contract (and the UI) expects real booleans, so every row leaving
 * this module is normalised here in one place.
 */
function toAnnouncementRow(row: Record<string, unknown>): AnnouncementRow {
  return {
    ...(row as unknown as AnnouncementRow),
    isPinned: (row as { isPinned?: unknown }).isPinned === true || (row as { isPinned?: unknown }).isPinned === 1,
    isActive: !((row as { isActive?: unknown }).isActive === false || (row as { isActive?: unknown }).isActive === 0),
  };
}

export function activeOrdering(alias = 'an'): string {
  return `${alias}.is_pinned DESC, datetime(COALESCE(${alias}.publish_at, ${alias}.created_at)) DESC`;
}

export function activeWindowClause(alias = 'an'): string {
  const A = alias;
  return `(${A}.is_active = 1
    AND (${A}.publish_at IS NULL OR datetime(${A}.publish_at) <= datetime('now'))
    AND (${A}.expires_at IS NULL OR datetime(${A}.expires_at) >= datetime('now')))`;
}

/**
 * The audience clause restricting a query to rows `actor` may read.
 *
 * Rules mirror the brief:
 *  - EVERYONE is visible to student, teacher and parent.
 *  - Role audiences only match the matching role.
 *  - SCHOOL/CLASS/SECTION require matching membership (via the real
 *    enrollment / teacher_assignment / parent link rows).
 *  - A school admin sees everything addressed to their school.
 *  - A platform admin sees everything, since they moderate the platform.
 *
 * Returns a SQL fragment plus its bound parameters in order.
 */
export function visibilityClause(actor: Actor, alias = 'an'): { clause: string; params: unknown[] } {
  const A = alias;

  if (actor.role === 'PLATFORM_ADMIN') return { clause: '1 = 1', params: [] };

  const params: unknown[] = [];

  /**
   * Each audience branch carries its OWN school scoping. A single global
   * `OR school_id IS NULL` would let a platform-wide notice bypass audience
   * filtering entirely (every row would match), so scoping must never be
   * hoisted out of the audience conditions.
   */
  const schoolScope = (): string => {
    if (actor.role === 'SCHOOL_ADMIN') {
      if (!actor.schoolId) return '0 = 1';
      params.push(actor.schoolId);
      return `${A}.school_id = ?`;
    }
    if (actor.schoolId) {
      params.push(actor.schoolId);
      return `(${A}.school_id IS NULL OR ${A}.school_id = ?)`;
    }
    return `${A}.school_id IS NULL`;
  };

  const checks: string[] = [];

  // Everyone (student + teacher + parent), within scope.
  checks.push(`(${A}.audience = 'EVERYONE' AND ${schoolScope()})`);

  // The actor's own role audience.
  const roleAudience =
    actor.role === 'STUDENT'
      ? 'STUDENTS'
      : actor.role === 'TEACHER'
        ? 'TEACHERS'
        : actor.role === 'PARENT'
          ? 'PARENTS'
          : null;

  if (roleAudience) {
    params.push(roleAudience);
    const scope = schoolScope();
    checks.push(`(${A}.audience = ? AND ${scope})`);
  }

  // Whole-school addressing.
  {
    const scope = schoolScope();
    checks.push(`(${A}.audience = 'SCHOOL' AND ${scope})`);
  }

  // Class addressing, proven through real membership.
  if (actor.role === 'STUDENT') {
    params.push(actor.userId);
    checks.push(`(${A}.audience = 'CLASS' AND EXISTS (
      SELECT 1 FROM student_enrollments se
      WHERE se.student_id = ? AND ${A}.target_class_id IN (
        SELECT s2.class_id FROM sections s2 WHERE s2.id = se.section_id)
    ))`);
  } else if (actor.role === 'TEACHER') {
    params.push(actor.userId);
    checks.push(`(${A}.audience = 'CLASS' AND EXISTS (
      SELECT 1 FROM teacher_assignments ta
      WHERE ta.teacher_id = ? AND ${A}.target_class_id IN (
        SELECT s3.class_id FROM sections s3 WHERE s3.id = ta.section_id)
    ))`);
  } else if (actor.role === 'PARENT') {
    params.push(actor.userId);
    checks.push(`(${A}.audience = 'CLASS' AND EXISTS (
      SELECT 1 FROM parent_student_links psl
      JOIN student_enrollments se ON se.student_id = psl.student_user_id
      WHERE psl.parent_user_id = ? AND ${A}.target_class_id IN (
        SELECT s4.class_id FROM sections s4 WHERE s4.id = se.section_id)
    ))`);
  }

  // Section addressing, proven through real membership.
  if (actor.role === 'STUDENT') {
    params.push(actor.userId);
    checks.push(`(${A}.audience = 'SECTION' AND EXISTS (
      SELECT 1 FROM student_enrollments se
      WHERE se.student_id = ? AND ${A}.target_section_id = se.section_id
    ))`);
  } else if (actor.role === 'TEACHER') {
    params.push(actor.userId);
    checks.push(`(${A}.audience = 'SECTION' AND EXISTS (
      SELECT 1 FROM teacher_assignments ta
      WHERE ta.teacher_id = ? AND ${A}.target_section_id = ta.section_id
    ))`);
  } else if (actor.role === 'PARENT') {
    params.push(actor.userId);
    checks.push(`(${A}.audience = 'SECTION' AND EXISTS (
      SELECT 1 FROM parent_student_links psl
      JOIN student_enrollments se ON se.student_id = psl.student_user_id
      WHERE psl.parent_user_id = ? AND ${A}.target_section_id = se.section_id
    ))`);
  }

  return { clause: `(${checks.join(' OR ')})`, params };
}

export function queryAnnouncementsForActor(
  db: Database.Database,
  actor: Actor,
  options: { onlyActiveWindow?: boolean; limit?: number } = {}
): AnnouncementRow[] {
  const { onlyActiveWindow = false, limit = 100 } = options;
  const vis = visibilityClause(actor, 'an');
  const where = [vis.clause];
  const params = [...vis.params];
  if (onlyActiveWindow) where.push(activeWindowClause('an'));

  const rows = db
    .prepare(`${SELECT_ANNOUNCEMENT} WHERE ${where.join(' AND ')} ORDER BY ${activeOrdering('an')} LIMIT ?`)
    .all(...params, limit) as unknown as Record<string, unknown>[];
  return rows.map(toAnnouncementRow);
}

export interface NormalisedAnnouncement {
  title: string;
  message: string;
  type: AnnouncementType;
  audience: AnnouncementAudience;
  targetClassId: string | null;
  targetSectionId: string | null;
  isPinned: boolean;
  isActive: boolean;
  publishAt: string | null;
  expiresAt: string | null;
}

export interface AnnouncementValidation {
  ok: boolean;
  error?: string;
  value?: NormalisedAnnouncement;
}

/**
 * Validates and normalises an announcement payload. Class/section audiences
 * require their target id, and any target must belong to the author's school so
 * nobody can address a class outside their own scope.
 */
export function validateAnnouncement(
  db: Database.Database,
  body: Record<string, unknown>,
  schoolId: string | null
): AnnouncementValidation {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (!title) return { ok: false, error: 'Title is required.' };
  if (title.length > 200) return { ok: false, error: 'Title must be 200 characters or fewer.' };
  if (!message) return { ok: false, error: 'Message is required.' };
  if (message.length > 5000) return { ok: false, error: 'Message must be 5000 characters or fewer.' };

  const type = body.type ?? 'GENERAL';
  if (!isAnnouncementType(type)) return { ok: false, error: 'Invalid announcement type.' };

  const audience = body.audience ?? 'EVERYONE';
  if (!isAnnouncementAudience(audience)) return { ok: false, error: 'Invalid target audience.' };

  const targetClassId =
    typeof body.targetClassId === 'string' && body.targetClassId.trim() ? body.targetClassId.trim() : null;
  const targetSectionId =
    typeof body.targetSectionId === 'string' && body.targetSectionId.trim() ? body.targetSectionId.trim() : null;

  if (audience === 'CLASS' && !targetClassId) {
    return { ok: false, error: 'Select a class for this audience.' };
  }
  if (audience === 'SECTION' && !targetSectionId) {
    return { ok: false, error: 'Select a section for this audience.' };
  }

  if (targetClassId) {
    const row = db.prepare('SELECT school_id AS schoolId FROM classes WHERE id = ?').get(targetClassId) as
      | { schoolId: string }
      | undefined;
    if (!row) return { ok: false, error: 'Selected class was not found.' };
    if (schoolId && row.schoolId !== schoolId) {
      return { ok: false, error: 'Selected class is outside your school.' };
    }
  }

  if (targetSectionId) {
    const row = db
      .prepare('SELECT c.school_id AS schoolId FROM sections s JOIN classes c ON c.id = s.class_id WHERE s.id = ?')
      .get(targetSectionId) as { schoolId: string } | undefined;
    if (!row) return { ok: false, error: 'Selected section was not found.' };
    if (schoolId && row.schoolId !== schoolId) {
      return { ok: false, error: 'Selected section is outside your school.' };
    }
  }

  const publishAt = normaliseTimestamp(body.publishAt);
  const expiresAt = normaliseTimestamp(body.expiresAt);
  if (publishAt && expiresAt && new Date(expiresAt) <= new Date(publishAt)) {
    return { ok: false, error: 'Expiry must be after the publish date.' };
  }

  return {
    ok: true,
    value: {
      title,
      message,
      type,
      audience,
      targetClassId,
      targetSectionId,
      isPinned: body.isPinned === true,
      isActive: body.isActive !== false,
      publishAt,
      expiresAt,
    },
  };
}

export function insertAnnouncement(
  db: Database.Database,
  authorId: string | null,
  schoolId: string | null,
  value: NormalisedAnnouncement
): string {
  const id = randomUUID();
  db.prepare(
    `INSERT INTO announcements
       (id, school_id, author_id, title, message, type, audience,
        target_class_id, target_section_id, is_pinned, is_active, publish_at, expires_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
  ).run(
    id,
    schoolId,
    authorId,
    value.title,
    value.message,
    value.type,
    value.audience,
    value.targetClassId,
    value.targetSectionId,
    value.isPinned ? 1 : 0,
    value.isActive ? 1 : 0,
    value.publishAt,
    value.expiresAt
  );
  return id;
}

/** Resolves the real user ids an announcement should notify. */
export function resolveRecipients(
  db: Database.Database,
  audience: AnnouncementAudience,
  target: { classId: string | null; sectionId: string | null; schoolId: string | null }
): string[] {
  const ids = new Set<string>();
  const add = (rows: { id: string }[]) => rows.forEach((row) => ids.add(row.id));

  if (audience === 'EVERYONE') {
    add(
      db
        .prepare(
          `SELECT id FROM users WHERE status = 'ACTIVE' AND role IN ('STUDENT','TEACHER','PARENT')
           ${target.schoolId ? 'AND school_id = ?' : ''}`
        )
        .all(...(target.schoolId ? [target.schoolId] : [])) as { id: string }[]
    );
  }

  if (audience === 'STUDENTS' || audience === 'TEACHERS' || audience === 'PARENTS') {
    const role = audience === 'STUDENTS' ? 'STUDENT' : audience === 'TEACHERS' ? 'TEACHER' : 'PARENT';
    add(
      db
        .prepare(
          `SELECT id FROM users WHERE status = 'ACTIVE' AND role = ?
           ${target.schoolId ? 'AND school_id = ?' : ''}`
        )
        .all(...(target.schoolId ? [role, target.schoolId] : [role])) as { id: string }[]
    );
  }

  if (audience === 'SECTION' && target.sectionId) {
    // Students-only: the verification contract requires that only students
    // enrolled in the target section are notified.
    add(
      db
        .prepare(
          `SELECT DISTINCT se.student_id AS id FROM student_enrollments se WHERE se.section_id = ?`
        )
        .all(target.sectionId) as { id: string }[]
    );
  }

  if (audience === 'CLASS' && target.classId) {
    // Students-only for the same reason as SECTION.
    add(
      db
        .prepare(
          `SELECT DISTINCT se.student_id AS id
           FROM student_enrollments se JOIN sections s ON s.id = se.section_id WHERE s.class_id = ?`
        )
        .all(target.classId) as { id: string }[]
    );
  }

  if (audience === 'SCHOOL' && target.schoolId) {
    add(
      db
        .prepare(
          `SELECT id FROM users WHERE status = 'ACTIVE' AND school_id = ?
           AND role IN ('STUDENT','TEACHER','PARENT')`
        )
        .all(target.schoolId) as { id: string }[]
    );
  }

  return [...ids];
}

/**
 * Fans an announcement out to its real, in-scope recipients as notifications.
 *
 * Recipients come from live membership rows - nothing is fabricated, and users
 * outside the target receive nothing. Notifications are de-duplicated per
 * (user, announcement) using the announcement id encoded in the link, so
 * re-publishing after an edit cannot spam the same user.
 *
 * Returns the number of notifications created.
 */
export function notifyAnnouncementAudience(
  db: Database.Database,
  announcement: {
    id: string;
    title: string;
    type: AnnouncementType;
    audience: AnnouncementAudience;
    targetClassId: string | null;
    targetSectionId: string | null;
    schoolId: string | null;
  }
): number {
  const recipients = resolveRecipients(db, announcement.audience, {
    classId: announcement.targetClassId,
    sectionId: announcement.targetSectionId,
    schoolId: announcement.audience === 'SCHOOL' ? announcement.schoolId : null,
  });
  if (recipients.length === 0) return 0;

  const link = `/announcements#${announcement.id}`;
  const insert = db.prepare(
    `INSERT INTO notifications (id, user_id, type, title, message, link)
     VALUES (?, ?, 'ANNOUNCEMENT', ?, ?, ?)`
  );

  const run = db.transaction(() => {
    let created = 0;
    for (const userId of recipients) {
      const existing = db
        .prepare(
          `SELECT 1 AS ok FROM notifications WHERE user_id = ? AND link = ? LIMIT 1`
        )
        .get(userId, link);
      if (existing) continue;
      insert.run(
        randomUUID(),
        userId,
        announcement.title,
        `New ${announcement.type.toLowerCase()} announcement`,
        link
      );
      created += 1;
    }
    return created;
  });

  return run();
}
