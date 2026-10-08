/**
 * Read-only audit of local test data.
 *
 * Classifies every account as a genuine-looking login or an automated test
 * artifact, and reports the relationships that would be affected. Deletion is
 * handled separately by scripts/cleanup-test-accounts.mjs, which refuses to
 * touch any account involved in a parent_student_link.
 *
 * Usage: node scripts/audit-accounts.mjs
 */
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

register('./ts-alias-loader.mjs', pathToFileURL(path.join(import.meta.dirname, '/')));

const { getDb } = await import('../src/lib/db/index.ts');

const db = getDb();

/** Automated harnesses all used synthetic `@example.com` local addresses. */
const rows = db
  .prepare(
    `SELECT u.id, u.email, u.role, u.status, u.created_at AS createdAt, u.school_id AS schoolId,
            (SELECT COUNT(*) FROM student_profiles sp WHERE sp.uid = u.id) AS studentProfile,
            (SELECT COUNT(*) FROM teacher_profiles tp WHERE tp.uid = u.id) AS teacherProfile,
            (SELECT COUNT(*) FROM student_enrollments se WHERE se.student_id = u.id) AS enrolled,
            (SELECT COUNT(*) FROM teacher_assignments ta WHERE ta.teacher_id = u.id) AS teaching,
            (SELECT COUNT(*) FROM parent_student_links l WHERE l.parent_user_id = u.id) AS parentOf,
            (SELECT COUNT(*) FROM parent_student_links l WHERE l.student_user_id = u.id) AS childOf,
            (SELECT COUNT(*) FROM assessment_snapshots a WHERE a.student_id = u.id) AS assessments,
            (SELECT COUNT(*) FROM assignment_submissions s WHERE s.student_id = u.id) AS submissions,
            (SELECT COUNT(*) FROM activity_log g WHERE g.student_id = u.id) AS activity,
            (SELECT COUNT(*) FROM mistakes m WHERE m.student_id = u.id) AS mistakes,
            (SELECT COUNT(*) FROM ai_conversations c WHERE c.student_id = u.id) AS chats,
            (SELECT COUNT(*) FROM notifications n WHERE n.user_id = u.id) AS notifications
     FROM users u
     ORDER BY u.role, u.created_at`
  )
  .all();

const isTest = (email) =>
  email.endsWith('@example.com') || email.endsWith('@test.com') || email.endsWith('.test');

const test = rows.filter((r) => isTest(r.email));
const genuine = rows.filter((r) => !isTest(r.email));

console.log('=== ACCOUNT AUDIT ===\n');
console.log(`total accounts       : ${rows.length}`);
console.log(`genuine-looking      : ${genuine.length}`);
console.log(`automated test users : ${test.length}`);
console.log(`in parent/child link : ${rows.filter((r) => r.parentOf > 0 || r.childOf > 0).length}\n`);

console.log('--- PARENT-STUDENT LINKS (must be preserved) ---');
const links = db
  .prepare(
    `SELECT l.id, p.email AS parentEmail, s.email AS studentEmail,
            (SELECT display_name FROM student_profiles WHERE uid = l.student_user_id) AS studentName
     FROM parent_student_links l
     JOIN users p ON p.id = l.parent_user_id
     JOIN users s ON s.id = l.student_user_id`
  )
  .all();
for (const link of links) {
  console.log(`  ${link.parentEmail}  ->  ${link.studentEmail}  (${link.studentName ?? 'no profile'})`);
}
console.log('');

console.log('--- AUTOMATED TEST ACCOUNTS ---');
for (const row of test) {
  const rel = [
    row.studentProfile && 'studentProfile',
    row.teacherProfile && 'teacherProfile',
    row.enrolled && `enrolled:${row.enrolled}`,
    row.teaching && `teaching:${row.teaching}`,
    row.parentOf && `parentOf:${row.parentOf}`,
    row.childOf && `childOf:${row.childOf}`,
    row.assessments && `assessments:${row.assessments}`,
    row.submissions && `submissions:${row.submissions}`,
    row.activity && `activity:${row.activity}`,
    row.mistakes && `mistakes:${row.mistakes}`,
    row.chats && `chats:${row.chats}`,
    row.notifications && `notifications:${row.notifications}`,
  ].filter(Boolean);
  console.log(`  ${row.role.padEnd(13)} ${row.email.padEnd(46)} ${rel.join(' ') || '(no data)'}`);
}

console.log('\n--- GENUINE ACCOUNTS (kept) ---');
for (const row of genuine) {
  console.log(`  ${row.role.padEnd(13)} ${row.email}`);
}

console.log(`\nDeletable test accounts: ${test.filter((r) => r.parentOf === 0 && r.childOf === 0).length}`);
console.log(`Test accounts in a parent link (KEPT): ${test.filter((r) => r.parentOf > 0 || r.childOf > 0).length}`);