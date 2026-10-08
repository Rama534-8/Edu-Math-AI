/**
 * Takes a consistent snapshot of the live database using SQLite's VACUUM INTO.
 *
 * Copying edumathai.db alone loses anything still sitting in the uncheckpointed
 * -wal file, so verification runs must use this snapshot instead.
 *
 * Usage: node scripts/snapshot-db.mjs scratch/<name>.db
 */
import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

const target = process.argv[2] ?? 'scratch/snapshot.db';
const source = process.env.EDU_MATHAI_DB_PATH ?? path.join(process.cwd(), 'data', 'edumathai.db');

fs.mkdirSync(path.dirname(target), { recursive: true });
for (const suffix of ['', '-wal', '-shm']) {
  const stale = `${target}${suffix}`;
  if (fs.existsSync(stale)) fs.rmSync(stale);
}

const db = new Database(source, { readonly: true });
db.exec(`VACUUM INTO '${target.replace(/'/g, "''")}'`);
const tables = db
  .prepare("SELECT COUNT(*) AS c FROM sqlite_master WHERE type = 'table'")
  .get().c;
const announcements = (() => {
  try {
    return db.prepare('SELECT COUNT(*) AS c FROM school_announcements').get().c;
  } catch {
    return 'n/a (already migrated)';
  }
})();

console.log(`snapshot written : ${target}`);
console.log(`tables           : ${tables}`);
console.log(`announcements    : ${announcements}`);
db.close();