import type Database from 'better-sqlite3';

/**
 * School / class / section provisioning.
 *
 * Accounts are grouped under a school (`users.school_id`), and class features
 * (teacher assignments, attendance, reports) hang off
 * `schools -> classes -> sections`. Every helper here is idempotent so it can be
 * re-run from registration, from an API route, or from a backfill script
 * without ever creating duplicate rows.
 */

export const DEFAULT_SCHOOL_NAME = 'EduMathAI School';
export const DEFAULT_CLASS_NAME = 'Class 9';
export const DEFAULT_SECTION_NAME = 'A';
export const DEFAULT_SUBJECT = 'Mathematics';

/**
 * Shortest school name we are willing to trust. Existing test data contains
 * values such as "S" which would otherwise explode into one school per typo.
 */
const MIN_SCHOOL_NAME_LENGTH = 3;

export interface SchoolRow {
  id: string;
  name: string;
}

export interface ProvisionedStructure {
  classId: string;
  sectionId: string;
}

export interface BackfillSummary {
  schoolsCreated: number;
  usersAssigned: number;
  classesCreated: number;
  sectionsCreated: number;
  enrollmentsCreated: number;
}

export interface BackfillOptions {
  /** Assign teachers with no teacher_assignments row to their school's sections. */
  assignTeachers?: boolean;
}

export function normalizeSchoolName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}

export function isUsableSchoolName(raw: unknown): raw is string {
  return typeof raw === 'string' && normalizeSchoolName(raw).length >= MIN_SCHOOL_NAME_LENGTH;
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'school';
}

/** `table` is always one of our own internal literals, never user input. */
function uniqueId(db: Database.Database, table: string, baseId: string): string {
  const exists = db.prepare(`SELECT 1 AS ok FROM ${table} WHERE id = ?`);
  let candidate = baseId;
  let suffix = 2;
  while (exists.get(candidate)) {
    candidate = `${baseId}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

export function findSchoolByName(db: Database.Database, name: string): SchoolRow | undefined {
  const normalized = normalizeSchoolName(name);
  if (!normalized) return undefined;
  return db
    .prepare('SELECT id, name FROM schools WHERE name = ? COLLATE NOCASE LIMIT 1')
    .get(normalized) as SchoolRow | undefined;
}

export function getSchoolById(db: Database.Database, schoolId: string): SchoolRow | undefined {
  return db.prepare('SELECT id, name FROM schools WHERE id = ?').get(schoolId) as SchoolRow | undefined;
}

/** Find the school by name, creating it when it does not exist yet. */
export function ensureSchool(db: Database.Database, rawName?: string | null): SchoolRow {
  const name = isUsableSchoolName(rawName) ? normalizeSchoolName(rawName) : DEFAULT_SCHOOL_NAME;
  const existing = findSchoolByName(db, name);
  if (existing) return existing;

  const id = uniqueId(db, 'schools', `school-${slugify(name)}`);
  db.prepare('INSERT INTO schools (id, name) VALUES (?, ?)').run(id, name);
  return { id, name };
}

export function ensureClass(db: Database.Database, schoolId: string, rawName?: string | null): string {
  const name = (rawName && rawName.trim()) || DEFAULT_CLASS_NAME;
  const existing = db
    .prepare('SELECT id FROM classes WHERE school_id = ? AND name = ? COLLATE NOCASE LIMIT 1')
    .get(schoolId, name) as { id: string } | undefined;
  if (existing) return existing.id;

  const id = uniqueId(db, 'classes', `class-${slugify(name)}-${slugify(schoolId)}`);
  db.prepare('INSERT INTO classes (id, school_id, name) VALUES (?, ?, ?)').run(id, schoolId, name);
  return id;
}

export function ensureSection(db: Database.Database, classId: string, rawName?: string | null): string {
  const name = (rawName && rawName.trim()) || DEFAULT_SECTION_NAME;
  const existing = db
    .prepare('SELECT id FROM sections WHERE class_id = ? AND name = ? COLLATE NOCASE LIMIT 1')
    .get(classId, name) as { id: string } | undefined;
  if (existing) return existing.id;

  const id = uniqueId(db, 'sections', `section-${slugify(classId)}-${slugify(name)}`);
  db.prepare('INSERT INTO sections (id, class_id, name) VALUES (?, ?, ?)').run(id, classId, name);
  return id;
}

/** Ensure a class plus its default section exist for a school. */
export function ensureClassStructure(
  db: Database.Database,
  schoolId: string,
  className?: string | null
): ProvisionedStructure {
  const classId = ensureClass(db, schoolId, className);
  const sectionId = ensureSection(db, classId);
  return { classId, sectionId };
}

export function enrollStudent(
  db: Database.Database,
  studentId: string,
  schoolId: string,
  className?: string | null
): void {
  const { sectionId } = ensureClassStructure(db, schoolId, className);
  db.prepare(
    'INSERT OR IGNORE INTO student_enrollments (id, student_id, section_id) VALUES (?, ?, ?)'
  ).run(`enr-${studentId}-${sectionId}`, studentId, sectionId);
}
/**
 * Give a teacher access to every section in their school.
 *
 * Teachers register against a school just like students do, so they are enrolled
 * into that school's sections the same way students are enrolled into their
 * class. School admins can still re-scope teachers from the Teacher Assignments
 * page, which writes `teacher_assignments` directly.
 */
export function assignTeacherToSchoolSections(
  db: Database.Database,
  teacherId: string,
  schoolId: string
): number {
  const sections = db
    .prepare(
      `SELECT s.id FROM sections s
       JOIN classes c ON c.id = s.class_id
       WHERE c.school_id = ?`
    )
    .all(schoolId) as { id: string }[];

  for (const section of sections) {
    db.prepare(
      `INSERT OR IGNORE INTO teacher_assignments (id, teacher_id, section_id, subject)
       VALUES (?, ?, ?, ?)`
    ).run(
      `ta-${teacherId}-${section.id}-${slugify(DEFAULT_SUBJECT)}`,
      teacherId,
      section.id,
      DEFAULT_SUBJECT
    );
  }
  return sections.length;
}

/**
 * Attach a freshly registered account to a school and, for students, make sure a
 * matching class/section exists and the student is enrolled in it.
 */
export function provisionUserSchool(
  db: Database.Database,
  userId: string,
  options: { schoolName?: string | null; role: string; className?: string | null }
): string {
  const school = ensureSchool(db, options.schoolName);
  db.prepare('UPDATE users SET school_id = ? WHERE id = ?').run(school.id, userId);

  if (options.role === 'STUDENT') {
    enrollStudent(db, userId, school.id, options.className);
    db.prepare(
      `UPDATE student_profiles SET school_name = ?
       WHERE uid = ? AND (school_name IS NULL OR TRIM(school_name) = '')`
    ).run(school.name, userId);
  } else if (options.role === 'TEACHER') {
    assignTeacherToSchoolSections(db, userId, school.id);
    db.prepare(
      `UPDATE teacher_profiles SET school_name = ?
       WHERE uid = ? AND (school_name IS NULL OR TRIM(school_name) = '')`
    ).run(school.name, userId);
  }

  return school.id;
}

type UserRow = {
  id: string;
  role: string;
  school_id: string | null;
  school_name: string | null;
  class_name: string | null;
};
/**
 * Repair accounts that were created before school assignment existed.
 *
 * Strictly additive: it only fills in `users.school_id` and creates the
 * class/section scaffolding the reporting features need. No user, curriculum or
 * progress row is ever deleted or altered beyond the school back-reference.
 */
export function backfillSchoolMembership(
  db: Database.Database,
  options: BackfillOptions = {}
): BackfillSummary {
  const summary: BackfillSummary = {
    schoolsCreated: 0,
    usersAssigned: 0,
    classesCreated: 0,
    sectionsCreated: 0,
    enrollmentsCreated: 0,
  };

  const countOf = (table: string) =>
    (db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as { count: number }).count;

  const before = {
    schools: countOf('schools'),
    classes: countOf('classes'),
    sections: countOf('sections'),
    enrollments: countOf('student_enrollments'),
  };

  // 1. Give every unassigned account a school.
  const unassigned = db
    .prepare(
      `SELECT u.id, u.role, u.school_id, sp.school_name, sp.class_name
       FROM users u
       LEFT JOIN student_profiles sp ON sp.uid = u.id
       WHERE u.school_id IS NULL
       ORDER BY u.created_at ASC`
    )
    .all() as UserRow[];

  for (const user of unassigned) {
    if (user.role === 'PLATFORM_ADMIN') continue; // Platform admins are not school scoped.

    let school: SchoolRow;
    if (user.role === 'PARENT') {
      // Parents inherit the school of the child they are linked to.
      const linked = db
        .prepare(
          `SELECT u2.school_id
           FROM parent_student_links l
           JOIN users u2 ON u2.id = l.student_user_id
           WHERE l.parent_user_id = ? AND u2.school_id IS NOT NULL
           LIMIT 1`
        )
        .get(user.id) as { school_id: string } | undefined;
      const linkedSchool = linked ? getSchoolById(db, linked.school_id) : undefined;
      school = linkedSchool ?? ensureSchool(db, DEFAULT_SCHOOL_NAME);
    } else if (user.role === 'STUDENT') {
      school = ensureSchool(db, user.school_name);
    } else {
      school = ensureSchool(db, DEFAULT_SCHOOL_NAME);
    }

    db.prepare('UPDATE users SET school_id = ? WHERE id = ?').run(school.id, user.id);
    summary.usersAssigned += 1;
  }

  summary.schoolsCreated = countOf('schools') - before.schools;

  // 2. Make sure every school has a Class 9 structure and every student is enrolled.
  for (const { id: schoolId } of db.prepare('SELECT id FROM schools').all() as { id: string }[]) {
    const classNames = db
      .prepare(
        `SELECT DISTINCT sp.class_name AS className
         FROM student_profiles sp
         JOIN users u ON u.id = sp.uid
         WHERE u.school_id = ? AND sp.class_name IS NOT NULL AND TRIM(sp.class_name) <> ''`
      )
      .all(schoolId) as { className: string }[];

    for (const className of new Set([DEFAULT_CLASS_NAME, ...classNames.map((row) => row.className)])) {
      ensureClassStructure(db, schoolId, className);
    }
  }

  const students = db
    .prepare(
      `SELECT u.id, u.school_id, sp.class_name
       FROM users u
       LEFT JOIN student_profiles sp ON sp.uid = u.id
       WHERE u.role = 'STUDENT' AND u.school_id IS NOT NULL`
    )
    .all() as { id: string; school_id: string; class_name: string | null }[];

  for (const student of students) {
    enrollStudent(db, student.id, student.school_id, student.class_name);
  }

  // 3. Optionally give unassigned teachers their school's sections.
  if (options.assignTeachers) {
    const teachers = db
      .prepare("SELECT id, school_id FROM users WHERE role = 'TEACHER' AND school_id IS NOT NULL")
      .all() as { id: string; school_id: string }[];

    for (const teacher of teachers) {
      const already = db
        .prepare('SELECT COUNT(*) AS count FROM teacher_assignments WHERE teacher_id = ?')
        .get(teacher.id) as { count: number };
      if (already.count > 0) continue;

      const sections = db
        .prepare(
          `SELECT s.id FROM sections s
           JOIN classes c ON c.id = s.class_id
           WHERE c.school_id = ?`
        )
        .all(teacher.school_id) as { id: string }[];
      for (const section of sections) {
        db.prepare(
          `INSERT OR IGNORE INTO teacher_assignments (id, teacher_id, section_id, subject)
           VALUES (?, ?, ?, ?)`
        ).run(
          `ta-${teacher.id}-${section.id}-${slugify(DEFAULT_SUBJECT)}`,
          teacher.id,
          section.id,
          DEFAULT_SUBJECT
        );
      }
    }
  }

  summary.classesCreated = countOf('classes') - before.classes;
  summary.sectionsCreated = countOf('sections') - before.sections;
  summary.enrollmentsCreated = countOf('student_enrollments') - before.enrollments;

  return summary;
}

/** True when at least one account still has no school and needs repairing. */
export function needsSchoolBackfill(db: Database.Database): boolean {
  const row = db
    .prepare("SELECT COUNT(*) AS count FROM users WHERE school_id IS NULL AND role <> 'PLATFORM_ADMIN'")
    .get() as { count: number };
  return row.count > 0;
}