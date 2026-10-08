/**
 * Repairs school membership for accounts created before school assignment
 * existed. Without this, `requireSchoolId()` rejects every SCHOOL_ADMIN with
 * "School administrator is not assigned to a school." and the Teacher / School
 * Admin modules render empty.
 *
 * Strictly additive: it only fills in `users.school_id` and creates the
 * schools / classes / sections scaffolding. No user, curriculum or progress row
 * is deleted or otherwise modified.
 *
 * Usage:
 *   node --experimental-strip-types scripts/assign-schools.mjs
 *   node --experimental-strip-types scripts/assign-schools.mjs --no-teachers
 */
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

register('./ts-alias-loader.mjs', pathToFileURL(path.join(import.meta.dirname, '/')));

const { getDb } = await import('../src/lib/db/index.ts');
const { backfillSchoolMembership, needsSchoolBackfill } = await import('../src/lib/school.ts');

const assignTeachers = !process.argv.includes('--no-teachers');
const db = getDb();

console.log(needsSchoolBackfill(db) ? 'Repairing school membership...' : 'Already consistent; re-running for verification...');
const summary = backfillSchoolMembership(db, { assignTeachers });

const totals = db
  .prepare(
    `SELECT
       (SELECT COUNT(*) FROM schools)                            AS schools,
       (SELECT COUNT(*) FROM classes)                            AS classes,
       (SELECT COUNT(*) FROM sections)                           AS sections,
       (SELECT COUNT(*) FROM student_enrollments)                AS enrollments,
       (SELECT COUNT(*) FROM teacher_assignments)                AS teacherAssignments,
       (SELECT COUNT(*) FROM users
         WHERE school_id IS NULL AND role <> 'PLATFORM_ADMIN')  AS usersWithoutSchool,
       (SELECT COUNT(*) FROM users
         WHERE school_id IS NULL AND role = 'PLATFORM_ADMIN')   AS platformAdminsUnscoped`
  )
  .get();

console.log('Summary:', summary);
console.log('Totals: ', totals);
console.log(
  totals.usersWithoutSchool === 0
    ? 'OK: every school-scoped account now belongs to a school.'
    : 'WARNING: some school-scoped accounts still have no school.'
);
console.log(`(${totals.platformAdminsUnscoped} platform admins are intentionally unscoped.)`);

if (process.argv.includes('--verbose')) {
  console.log(db.prepare('SELECT id, name FROM schools').all());
  console.log(db.prepare("SELECT email, school_id FROM users WHERE role = 'SCHOOL_ADMIN'").all());
}