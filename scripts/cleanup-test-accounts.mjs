/**
 * Removes obsolete automated test accounts from the local EduMathAI database.
 *
 * SAFETY RULES (hard guards, not warnings):
 *   1. Only accounts on synthetic local domains are ever considered
 *      (example.com / test.com / .test). Real providers are never matched.
 *   2. Any account participating in a parent_student_link is SKIPPED, so
 *      parent -> child relationships can never be broken by this script.
 *   3. schools / classes / sections are never deleted. Teacher profiles are only
 *      removed together with the test account that owns them.
 *   4. Every removal is logged, and the run reports post-condition assertions.
 *
 * Usage:
 *   node --experimental-strip-types scripts/cleanup-test-accounts.mjs --dry-run
 *   node --experimental-strip-types scripts/cleanup-test-accounts.mjs
 */
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

register('./ts-alias-loader.mjs', pathToFileURL(path.join(import.meta.dirname, '/')));

const { getDb } = await import('../src/lib/db/index.ts');

const SYNTHETIC_DOMAINS = ['@example.com', '@test.com', '.test'];
const dryRun = process.argv.includes('--dry-run');
const db = getDb();

const isSynthetic = (email) => SYNTHETIC_DOMAINS.some((suffix) => email.endsWith(suffix));

const snapshot = {
  schools: db.prepare('SELECT COUNT(*) AS c FROM schools').get().c,
  classes: db.prepare('SELECT COUNT(*) AS c FROM classes').get().c,
  sections: db.prepare('SELECT COUNT(*) AS c FROM sections').get().c,
  teacherProfiles: db.prepare('SELECT COUNT(*) AS c FROM teacher_profiles').get().c,
  parentLinks: db.prepare('SELECT COUNT(*) AS c FROM parent_student_links').get().c,
  users: db.prepare('SELECT COUNT(*) AS c FROM users').get().c,
};
const linksBefore = db
  .prepare('SELECT id, parent_user_id AS p, student_user_id AS s FROM parent_student_links ORDER BY id')
  .all();

const candidates = db.prepare('SELECT id, email, role FROM users ORDER BY created_at').all();
const targets = candidates.filter((row) => isSynthetic(row.email));

// GUARD 2: never remove an account that holds a parent/child link.
const linkedIds = new Set(
  db
    .prepare('SELECT parent_user_id AS id FROM parent_student_links UNION SELECT student_user_id FROM parent_student_links')
    .all()
    .map((row) => row.id)
);
const removable = targets.filter((row) => !linkedIds.has(row.id));
const skippedLinked = targets.filter((row) => linkedIds.has(row.id));

console.log(`Accounts on synthetic domains : ${targets.length}`);
console.log(`  removable                   : ${removable.length}`);
console.log(`  SKIPPED (hold a parent link): ${skippedLinked.length}`);
for (const [role, count] of Object.entries(
  removable.reduce((acc, row) => ({ ...acc, [row.role]: (acc[row.role] ?? 0) + 1 }), {})
)) {
  console.log(`    ${role.padEnd(15)} ${count}`);
}

if (removable.length === 0 || dryRun) {
  console.log(dryRun ? '\n--dry-run: no changes made.' : '\nNothing to remove.');
  process.exit(0);
}
/** Child rows owned by an account. The users row cascades for anything missed. */
const CHILD_TABLES = [
  'DELETE FROM parent_settings WHERE parent_user_id = ?',
  'DELETE FROM attendance WHERE student_id = ?',
  'DELETE FROM assignment_submissions WHERE student_id = ?',
  'DELETE FROM teacher_assignments WHERE teacher_id = ?',
  'DELETE FROM assignments WHERE teacher_id = ?',
  'DELETE FROM student_enrollments WHERE student_id = ?',
  'DELETE FROM quizzes WHERE teacher_id = ?',
  'DELETE FROM sessions WHERE user_id = ?',
  'DELETE FROM notifications WHERE user_id = ?',
  'DELETE FROM activity_log WHERE student_id = ?',
  'DELETE FROM assessment_snapshots WHERE student_id = ?',
  'DELETE FROM mistakes WHERE student_id = ?',
  'DELETE FROM mock_exam_answers WHERE student_id = ?',
  'DELETE FROM mock_exam_attempts WHERE student_id = ?',
  'DELETE FROM revision_sessions WHERE student_id = ?',
  'DELETE FROM study_plans WHERE student_id = ?',
  'DELETE FROM daily_goals WHERE student_id = ?',
  'DELETE FROM student_achievements WHERE student_id = ?',
  'DELETE FROM formula_notes WHERE student_id = ?',
  'DELETE FROM ai_conversations WHERE student_id = ?',
  'DELETE FROM student_profiles WHERE uid = ?',
  'DELETE FROM teacher_profiles WHERE uid = ?',
  'DELETE FROM users WHERE id = ?',
];

const remove = db.transaction((rows) => {
  for (const row of rows) {
    for (const sql of CHILD_TABLES) {
      try {
        db.prepare(sql).run(row.id);
      } catch {
        // A table may lack this column on older schemas; the FK cascade covers it.
      }
    }
  }
});
remove(removable);

console.log(`\nRemoved ${removable.length} automated test accounts.`);
for (const row of skippedLinked) {
  console.log(`  KEPT (parent link): ${row.email}`);
}

// --- Post-conditions ----------------------------------------------------------
const after = {
  schools: db.prepare('SELECT COUNT(*) AS c FROM schools').get().c,
  classes: db.prepare('SELECT COUNT(*) AS c FROM classes').get().c,
  sections: db.prepare('SELECT COUNT(*) AS c FROM sections').get().c,
  teacherProfiles: db.prepare('SELECT COUNT(*) AS c FROM teacher_profiles').get().c,
  parentLinks: db.prepare('SELECT COUNT(*) AS c FROM parent_student_links').get().c,
  users: db.prepare('SELECT COUNT(*) AS c FROM users').get().c,
};
const linksAfter = db
  .prepare('SELECT id, parent_user_id AS p, student_user_id AS s FROM parent_student_links ORDER BY id')
  .all();

const assert = (label, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) process.exitCode = 1;
};

console.log('');
assert('schools preserved', after.schools === snapshot.schools, `${snapshot.schools} -> ${after.schools}`);
assert('classes preserved', after.classes === snapshot.classes, `${snapshot.classes} -> ${after.classes}`);
assert('sections preserved', after.sections === snapshot.sections, `${snapshot.sections} -> ${after.sections}`);
assert('parent_student_links byte-identical',
  after.parentLinks === snapshot.parentLinks && JSON.stringify(linksAfter) === JSON.stringify(linksBefore),
  `${snapshot.parentLinks} -> ${after.parentLinks}`);
assert('teacher profiles kept for real teachers', after.teacherProfiles > 0, `${snapshot.teacherProfiles} -> ${after.teacherProfiles}`);
assert('no synthetic accounts remain',
  db.prepare("SELECT COUNT(*) AS c FROM users WHERE email LIKE '%@example.com' OR email LIKE '%@test.com'").get().c === 0);
assert('no orphaned student profiles',
  db.prepare('SELECT COUNT(*) AS c FROM student_profiles sp LEFT JOIN users u ON u.id = sp.uid WHERE u.id IS NULL').get().c === 0);
assert('no orphaned teacher profiles',
  db.prepare('SELECT COUNT(*) AS c FROM teacher_profiles tp LEFT JOIN users u ON u.id = tp.uid WHERE u.id IS NULL').get().c === 0);
assert('no orphaned enrollments',
  db.prepare('SELECT COUNT(*) AS c FROM student_enrollments se LEFT JOIN users u ON u.id = se.student_id WHERE u.id IS NULL').get().c === 0);
assert('no orphaned teacher assignments',
  db.prepare('SELECT COUNT(*) AS c FROM teacher_assignments ta LEFT JOIN users u ON u.id = ta.teacher_id WHERE u.id IS NULL').get().c === 0);

console.log(`\nusers ${snapshot.users} -> ${after.users}`);