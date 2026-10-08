import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { randomBytes } from 'crypto';
// Explicit relative specifier (not the "@/" alias) so this module stays loadable
// by standalone Node verification scripts. Every other module uses "@/"; this one is
// imported directly by scripts/*.mjs, which do not run the bundler.
import { backfillSchoolMembership, needsSchoolBackfill } from '../school.ts';

// Ensure the data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'profile');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

let _db: Database.Database | null = null;

function resolveDbPath(): string {
  return process.env.EDU_MATHAI_DB_PATH || path.join(dataDir, 'edumathai.db');
}

export function getDb(): Database.Database {
  if (!_db) {
    const dbPath = resolveDbPath();
    const dir = path.dirname(dbPath);
    if (dbPath !== ':memory:' && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    _db = new Database(dbPath);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    initDb(_db);
  }
  return _db;
}

/** Test-only: close the singleton so the next getDb() opens a fresh file. */
export function resetDbForTests(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}

export function generateStudentCode(db: Database.Database): string {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code: string;
  do {
    const suffix = Array.from(randomBytes(6), (byte) => alphabet[byte % alphabet.length]).join('');
    code = `EDU-${suffix}`;
  } while (db.prepare('SELECT 1 FROM student_profiles WHERE student_code = ?').get(code));
  return code;
}

/**
 * Phase 1/7/6 migrations.
 *
 * `announcements` supersedes `school_announcements`. The legacy table is read
 * once and its real rows are copied across (mapping audience 'ALL' ->
 * 'EVERYONE'), then the legacy table is dropped so there is exactly one source
 * of truth. No announcement content is invented or discarded here.
 *
 * SQLite cannot widen an existing CHECK constraint, so the new table is created
 * with the full audience vocabulary instead of altering the old one.
 */
function migrateAnnouncements(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      school_id TEXT,
      author_id TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'GENERAL'
        CHECK (type IN ('GENERAL', 'IMPORTANT', 'EXAM', 'HOLIDAY', 'ASSIGNMENT', 'EVENT')),
      audience TEXT NOT NULL DEFAULT 'EVERYONE'
        CHECK (audience IN ('EVERYONE', 'STUDENTS', 'TEACHERS', 'PARENTS', 'SCHOOL', 'CLASS', 'SECTION')),
      target_class_id TEXT,
      target_section_id TEXT,
      is_pinned INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      publish_at TEXT,
      expires_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT,
      FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_announcements_school
      ON announcements(school_id, is_active, is_pinned, created_at);
    CREATE INDEX IF NOT EXISTS idx_announcements_section
      ON announcements(target_section_id);

    -- Phase 7: student bookmarks for lessons, formulas and questions.
    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      item_type TEXT NOT NULL
        CHECK (item_type IN ('LESSON', 'FORMULA', 'QUESTION')),
      item_id TEXT NOT NULL,
      board TEXT,
      chapter_id TEXT,
      topic_id TEXT,
      title TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(student_id, item_type, item_id)
    );

    CREATE INDEX IF NOT EXISTS idx_bookmarks_student
      ON bookmarks(student_id, created_at);

    -- Phase 6/8: per-lesson study state. This is what powers "Continue
    -- Learning" (the latest lesson not yet completed) and the lesson/chapter
    -- achievement checks. It records genuine student activity only.
    CREATE TABLE IF NOT EXISTS lesson_progress (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      board TEXT,
      chapter_id TEXT,
      topic_id TEXT,
      status TEXT NOT NULL DEFAULT 'IN_PROGRESS'
        CHECK (status IN ('IN_PROGRESS', 'COMPLETED')),
      started_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(student_id, lesson_id)
    );

    CREATE INDEX IF NOT EXISTS idx_lesson_progress_student
      ON lesson_progress(student_id, status, started_at);
  `);

  // One-time import of real legacy announcements, if any survive.
  const legacy = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='school_announcements'")
    .get() as { name: string } | undefined;
  if (!legacy) return;

  try {
    db.exec(`
      INSERT OR IGNORE INTO announcements
        (id, school_id, author_id, title, message, type, audience, is_pinned, is_active, created_at)
      SELECT id,
             school_id,
             author_id,
             title,
             body,
             'GENERAL',
             CASE audience WHEN 'ALL' THEN 'EVERYONE' ELSE audience END,
             0,
             1,
             created_at
      FROM school_announcements;
    `);
  } catch (error) {
    // A malformed legacy row must not block startup; the copy is best-effort
    // and the legacy table is only dropped once the import has run.
    console.error('[db] Announcement migration skipped:', error);
    return;
  }
  db.exec('DROP TABLE school_announcements');
}

function initDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'STUDENT',
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      school_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS student_profiles (
      uid TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      phone_number TEXT,
      class_name TEXT DEFAULT 'Class 9',
      board TEXT DEFAULT 'CBSE',
      medium TEXT DEFAULT 'ENGLISH',
      profile_picture TEXT,
      parent_guardian_name TEXT,
      student_code TEXT,
      school_name TEXT,
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      streak_days INTEGER DEFAULT 0,
      last_active_date TEXT,
      questions_solved INTEGER DEFAULT 0,
      total_study_minutes INTEGER DEFAULT 0,
      onboarding_completed INTEGER DEFAULT 0,
      baseline_completed INTEGER DEFAULT 0,
      baseline_score REAL,
      learning_goals TEXT DEFAULT '[]',
      FOREIGN KEY (uid) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS teacher_profiles (
      uid TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      phone_number TEXT,
      profile_picture TEXT,
      FOREIGN KEY (uid) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS assessment_snapshots (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      quiz_id TEXT,
      quiz_title TEXT,
      type TEXT,
      board TEXT,
      grade INTEGER DEFAULT 9,
      chapter_id TEXT,
      topic_id TEXT,
      total_questions INTEGER DEFAULT 0,
      correct_count INTEGER DEFAULT 0,
      incorrect_count INTEGER DEFAULT 0,
      unanswered_count INTEGER DEFAULT 0,
      score REAL DEFAULT 0,
      max_score REAL DEFAULT 0,
      percentage REAL DEFAULT 0,
      accuracy REAL DEFAULT 0,
      time_spent_seconds INTEGER DEFAULT 0,
      pass_threshold REAL DEFAULT 40,
      result_status TEXT DEFAULT 'FAIL',
      attempt_number INTEGER DEFAULT 1,
      is_retest INTEGER DEFAULT 0,
      previous_attempt_id TEXT,
      completed_at TEXT DEFAULT (datetime('now')),
      is_baseline INTEGER DEFAULT 0,
      snapshot_json TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      activity_type TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS mistakes (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      question_id TEXT,
      chapter_id TEXT,
      topic_id TEXT,
      student_answer TEXT,
      correct_answer TEXT,
      mistake_category TEXT,
      what_went_wrong TEXT,
      why_it_happened TEXT,
      correct_approach TEXT,
      concept_to_revise TEXT,
      resolved INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ai_conversations (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      title TEXT,
      context_chapter_id TEXT,
      context_topic_id TEXT,
      language TEXT DEFAULT 'ENGLISH',
      messages_json TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS formula_notes (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      formula_id TEXT,
      formula_title TEXT,
      latex TEXT,
      personal_notes TEXT,
      is_favorite INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS parent_student_links (
      id TEXT PRIMARY KEY,
      parent_user_id TEXT NOT NULL,
      student_user_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(parent_user_id, student_user_id),
      FOREIGN KEY (parent_user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (student_user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS parent_settings (
      parent_user_id TEXT PRIMARY KEY,
      report_frequency TEXT NOT NULL DEFAULT 'NEVER'
        CHECK (report_frequency IN ('NEVER', 'WEEKLY', 'MONTHLY')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (parent_user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_parent_student_links_parent
      ON parent_student_links(parent_user_id);
    CREATE INDEX IF NOT EXISTS idx_parent_student_links_student
      ON parent_student_links(student_user_id);

    CREATE TABLE IF NOT EXISTS schools (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sections (
      id TEXT PRIMARY KEY,
      class_id TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS teacher_assignments (
      id TEXT PRIMARY KEY,
      teacher_id TEXT NOT NULL,
      section_id TEXT NOT NULL,
      subject TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
      UNIQUE(teacher_id, section_id, subject)
    );

    CREATE TABLE IF NOT EXISTS student_enrollments (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      section_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
      UNIQUE(student_id, section_id)
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id TEXT PRIMARY KEY,
      teacher_id TEXT NOT NULL,
      school_id TEXT NOT NULL,
      class_id TEXT NOT NULL,
      section_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      subject TEXT,
      board TEXT,
      chapter TEXT,
      total_marks REAL DEFAULT 100,
      due_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
      FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS assignment_submissions (
      id TEXT PRIMARY KEY,
      assignment_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      answer_text TEXT,
      submitted_at TEXT DEFAULT (datetime('now')),
      status TEXT DEFAULT 'PENDING',
      marks REAL,
      feedback TEXT,
      graded_at TEXT,
      graded_by TEXT,
      FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(assignment_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS daily_goals (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      target_minutes INTEGER DEFAULT 30,
      completed_minutes INTEGER DEFAULT 0,
      goal_date TEXT NOT NULL,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(student_id, goal_date)
    );

    CREATE TABLE IF NOT EXISTS study_plans (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      plan_date TEXT NOT NULL,
      plan_json TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(student_id, plan_date)
    );

    CREATE TABLE IF NOT EXISTS student_achievements (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      badge_code TEXT NOT NULL,
      earned_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(student_id, badge_code)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      link TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_notifications_user
      ON notifications(user_id, is_read, created_at);

    CREATE TABLE IF NOT EXISTS mock_exam_attempts (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      board TEXT NOT NULL,
      class_name TEXT NOT NULL DEFAULT 'Class 9',
      subject TEXT NOT NULL DEFAULT 'Mathematics',
      exam_type TEXT NOT NULL DEFAULT 'FULL',
      chapter_id TEXT,
      chapter_title TEXT,
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      submitted_at TEXT,
      duration_minutes INTEGER NOT NULL DEFAULT 30,
      status TEXT NOT NULL DEFAULT 'IN_PROGRESS',
      total_questions INTEGER DEFAULT 0,
      total_marks REAL DEFAULT 0,
      obtained_marks REAL DEFAULT 0,
      percentage REAL DEFAULT 0,
      pass_threshold REAL DEFAULT 40,
      result_status TEXT DEFAULT 'PENDING',
      questions_json TEXT NOT NULL DEFAULT '[]',
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_mock_exam_attempts_student
      ON mock_exam_attempts(student_id, started_at);

    CREATE TABLE IF NOT EXISTS mock_exam_answers (
      id TEXT PRIMARY KEY,
      attempt_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      selected_answer TEXT DEFAULT '',
      correct_answer TEXT NOT NULL,
      is_correct INTEGER DEFAULT 0,
      marks_awarded REAL DEFAULT 0,
      max_marks REAL DEFAULT 1,
      marked_for_review INTEGER DEFAULT 0,
      chapter_id TEXT,
      topic_id TEXT,
      question_text TEXT,
      explanation TEXT,
      FOREIGN KEY (attempt_id) REFERENCES mock_exam_attempts(id) ON DELETE CASCADE,
      UNIQUE(attempt_id, question_id)
    );
    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      teacher_id TEXT NOT NULL,
      section_id TEXT NOT NULL,
      title TEXT NOT NULL,
      subject TEXT,
      total_marks REAL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS quiz_questions (
      id TEXT PRIMARY KEY,
      quiz_id TEXT NOT NULL,
      question_text TEXT NOT NULL,
      options TEXT,
      correct_answer TEXT,
      marks REAL,
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      section_id TEXT NOT NULL,
      attendance_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PRESENT'
        CHECK (status IN ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED')),
      remarks TEXT,
      marked_by TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
      UNIQUE(student_id, attendance_date)
    );

    CREATE INDEX IF NOT EXISTS idx_attendance_section_date
      ON attendance(section_id, attendance_date);

    CREATE TABLE IF NOT EXISTS revision_sessions (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      chapter_id TEXT NOT NULL,
      board TEXT NOT NULL,
      sessions_completed INTEGER DEFAULT 0,
      practice_attempted INTEGER DEFAULT 0,
      practice_correct INTEGER DEFAULT 0,
      best_quiz_score REAL DEFAULT 0,
      last_revised_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(student_id, chapter_id)
    );

    -- Additive audit trail for AI feature requests (admin AI Moderation module).
    -- Metadata only: no prompts, responses, tokens or credentials are stored.
    -- user_id has no foreign key on purpose so audit rows survive account
    -- removal; user_email is a snapshot taken at request time.
    -- moderation_status defaults to NOT_EVALUATED: a request is only ever
    -- marked SAFE/FLAGGED when a real moderation result exists.
    CREATE TABLE IF NOT EXISTS ai_audit_logs (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      user_id TEXT,
      user_email TEXT,
      role TEXT,
      feature TEXT NOT NULL,
      request_status TEXT NOT NULL DEFAULT 'FAILED'
        CHECK (request_status IN ('SUCCESS', 'FAILED', 'REJECTED')),
      http_status INTEGER,
      moderation_status TEXT NOT NULL DEFAULT 'NOT_EVALUATED'
        CHECK (moderation_status IN ('NOT_EVALUATED', 'SAFE', 'FLAGGED')),
      flagged INTEGER NOT NULL DEFAULT 0,
      reason TEXT,
      duration_ms INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_ai_audit_logs_created_at
      ON ai_audit_logs(created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_ai_audit_logs_feature
      ON ai_audit_logs(feature);

    -- AI Question Paper Generator (Teacher): saved papers.
    -- Additive table: nothing existing is modified, dropped or reset.
    CREATE TABLE IF NOT EXISTS question_papers (
      id TEXT PRIMARY KEY,
      teacher_id TEXT NOT NULL,
      school_id TEXT,
      title TEXT NOT NULL,
      board TEXT NOT NULL,
      class_name TEXT NOT NULL DEFAULT 'Class 9',
      subject TEXT NOT NULL DEFAULT 'Mathematics',
      language TEXT NOT NULL DEFAULT 'ENGLISH',
      difficulty TEXT NOT NULL DEFAULT 'MEDIUM',
      chapters_json TEXT NOT NULL DEFAULT '[]',
      questions_json TEXT NOT NULL DEFAULT '[]',
      instructions_json TEXT NOT NULL DEFAULT '[]',
      total_marks REAL NOT NULL DEFAULT 0,
      question_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_question_papers_teacher
      ON question_papers(teacher_id, created_at DESC);
  `);

  migrateAnnouncements(db);

  const userColumns = new Set(
    (db.prepare('PRAGMA table_info(users)').all() as { name: string }[])
      .map((column) => column.name)
  );
  if (!userColumns.has('status')) {
    db.exec(`ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'ACTIVE'`);
  }
  if (!userColumns.has('school_id')) {
    db.exec('ALTER TABLE users ADD COLUMN school_id TEXT');
  }
  db.exec(`UPDATE users SET status = 'ACTIVE' WHERE status IS NULL OR status = ''`);
  db.exec('CREATE INDEX IF NOT EXISTS idx_users_school_id ON users(school_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)');

  const profileColumns = new Set(
    (db.prepare('PRAGMA table_info(student_profiles)').all() as { name: string }[])
      .map((column) => column.name)
  );
  if (!profileColumns.has('parent_guardian_name')) {
    db.exec('ALTER TABLE student_profiles ADD COLUMN parent_guardian_name TEXT');
  }
  if (!profileColumns.has('student_code')) {
    db.exec('ALTER TABLE student_profiles ADD COLUMN student_code TEXT');
  }

  const snapshotColumns = new Set(
    (db.prepare('PRAGMA table_info(assessment_snapshots)').all() as { name: string }[])
      .map((column) => column.name)
  );
  if (!snapshotColumns.has('pass_threshold')) {
    db.exec('ALTER TABLE assessment_snapshots ADD COLUMN pass_threshold REAL DEFAULT 40');
  }
  if (!snapshotColumns.has('result_status')) {
    db.exec('ALTER TABLE assessment_snapshots ADD COLUMN result_status TEXT DEFAULT "FAIL"');
  }
  if (!snapshotColumns.has('attempt_number')) {
    db.exec('ALTER TABLE assessment_snapshots ADD COLUMN attempt_number INTEGER DEFAULT 1');
  }
  if (!snapshotColumns.has('is_retest')) {
    db.exec('ALTER TABLE assessment_snapshots ADD COLUMN is_retest INTEGER DEFAULT 0');
  }
  if (!snapshotColumns.has('previous_attempt_id')) {
    db.exec('ALTER TABLE assessment_snapshots ADD COLUMN previous_attempt_id TEXT');
  }
  if (!snapshotColumns.has('completed_at')) {
    db.exec('ALTER TABLE assessment_snapshots ADD COLUMN completed_at TEXT');
    db.exec('UPDATE assessment_snapshots SET completed_at = created_at WHERE completed_at IS NULL');
  }

  const teacherProfileColumns = new Set(
    (db.prepare('PRAGMA table_info(teacher_profiles)').all() as { name: string }[])
      .map((column) => column.name)
  );
  if (!teacherProfileColumns.has('school_name')) {
    db.exec('ALTER TABLE teacher_profiles ADD COLUMN school_name TEXT');
  }

  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_student_profiles_student_code
    ON student_profiles(student_code)`);

  const missingCodes = db.prepare(
    "SELECT uid FROM student_profiles WHERE student_code IS NULL OR student_code = ''"
  ).all() as { uid: string }[];
  const updateCode = db.prepare(
    'UPDATE student_profiles SET student_code = ? WHERE uid = ?'
  );
  for (const { uid } of missingCodes) {
    updateCode.run(generateStudentCode(db), uid);
  }

  // Repair accounts created before school assignment existed, so the Teacher and
  // School Admin modules resolve a real `school_id` without a manual migration step.
  if (needsSchoolBackfill(db)) {
    try {
      const summary = backfillSchoolMembership(db);
      console.log('[db] School membership backfill:', summary);
    } catch (error) {
      console.error('[db] School membership backfill failed:', error);
    }
  }
}

export default getDb;
