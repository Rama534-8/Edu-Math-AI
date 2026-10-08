/**
 * Phase 1 migration check (runs against a COPY of the real database).
 *
 * Verifies that the legacy `school_announcements` rows are carried into the new
 * `announcements` table with audience 'ALL' mapped to 'EVERYONE', that the
 * legacy table is dropped, and that the bookmark store exists. Read-only with
 * respect to production data - it never writes to data/edumathai.db.
 *
 * Usage: $env:EDU_MATHAI_DB_PATH='...copy.db'; node --experimental-strip-types scripts/verify-announcement-migration.mts
 */
import { getDb } from '../src/lib/db/index.ts';

const db = getDb();

const migrated = db
  .prepare(
    `SELECT id, title, message, type, audience, is_pinned, is_active, created_at
     FROM announcements ORDER BY created_at`
  )
  .all() as Record<string, unknown>[];

const legacy = db
  .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'school_announcements'")
  .get();

const bookmarks = db
  .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'bookmarks'")
  .get();

console.log('=== ANNOUNCEMENT MIGRATION CHECK ===\n');
console.log(`announcements rows      : ${migrated.length}`);
console.log(`legacy table present    : ${legacy ? 'YES (bad)' : 'no (dropped)'}`);
console.log(`bookmarks table present : ${bookmarks ? 'yes' : 'NO (bad)'}`);

const failures: string[] = [];
if (legacy) failures.push('legacy school_announcements table still exists');
if (!bookmarks) failures.push('bookmarks table was not created');
if (migrated.length === 0) failures.push('no announcements survived the migration');

for (const row of migrated) {
  const okAudience = ['EVERYONE', 'STUDENTS', 'TEACHERS', 'PARENTS', 'SCHOOL', 'CLASS', 'SECTION'].includes(
    String(row.audience)
  );
  const okType = ['GENERAL', 'IMPORTANT', 'EXAM', 'HOLIDAY', 'ASSIGNMENT', 'EVENT'].includes(String(row.type));
  if (!okAudience) failures.push(`row ${row.id} has invalid audience ${row.audience}`);
  if (!okType) failures.push(`row ${row.id} has invalid type ${row.type}`);
  if (!row.message) failures.push(`row ${row.id} has no message`);
  console.log(`  - ${row.title} | ${row.type} | ${row.audience} | pinned=${row.is_pinned} | active=${row.is_active}`);
}

console.log('');
if (failures.length) {
  for (const failure of failures) console.log(`  FAIL ${failure}`);
  console.log(`\n${failures.length} check(s) FAILED.`);
  process.exit(1);
}
console.log('All announcement migration checks passed.');