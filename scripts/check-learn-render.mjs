/**
 * Runtime proof for the /student/learn board filter.
 *
 *   node --experimental-strip-types scripts/check-learn-render.mjs
 *
 * Executes the exact filter expression used by src/app/student/learn/page.tsx
 * against the real curriculum data for both board selections, plus the search
 * filter and the lesson-link format.
 */
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

register('./ts-alias-loader.mjs', pathToFileURL(path.join(import.meta.dirname, '/')));

const { CLASS_9_CHAPTERS } = await import('../src/lib/curriculum-data.ts');

/** Mirrors the filter in src/app/student/learn/page.tsx exactly. */
function learnPageChapters(selectedBoard, searchQuery = '') {
  const boardChapters = CLASS_9_CHAPTERS.filter((c) => c.board === selectedBoard);
  const query = searchQuery.trim().toLowerCase();
  if (!query) return boardChapters;
  return boardChapters.filter(
    (c) =>
      String(c.title || '').toLowerCase().includes(query) ||
      String(c.description || '').toLowerCase().includes(query) ||
      String(c.chapterNumber || '').includes(query)
  );
}

let failures = 0;

console.log('=== /student/learn board filter (real data) ===');
for (const [board, label] of [
  ['AP_STATE_BOARD', 'AP State Board'],
  ['CBSE', 'CBSE'],
]) {
  const list = learnPageChapters(board);
  console.log('');
  console.log(`${label} -> ${list.length} chapters available`);
  list.forEach((c) =>
    console.log(`   ${String(c.chapterNumber).padStart(2)}. ${c.title}`)
  );
  const expected = board === 'AP_STATE_BOARD' ? 12 : 15;
  if (list.length !== expected) {
    console.log(`   ERROR expected ${expected}, got ${list.length}`);
    failures++;
  }
}

console.log('\n=== search filter ===');
const search = (q) => learnPageChapters('AP_STATE_BOARD', q).map((c) => c.title);
console.log(`  "circles" -> ${search('circles').join(', ') || '(none)'}`);
console.log(`  "7"      -> ${search('7').join(', ') || '(none)'}`);
console.log(`  "zzz"    -> ${search('zzz').length} results`);
if (search('circles').length !== 1) {
  console.log('  ERROR search should match exactly 1 AP chapter');
  failures++;
}
if (search('zzz').length !== 0) {
  console.log('  ERROR nonsense search should return 0');
  failures++;
}

console.log('\n=== lesson link format ===');
for (const board of ['AP_STATE_BOARD', 'CBSE']) {
  const prefix = board === 'CBSE' ? 'cbse' : 'ap';
  const first = learnPageChapters(board)[0];
  const href = `/student/learn/${prefix}-ch${first.chapterNumber}-l1`;
  const ok = /^(ap|cbse)-ch(\d+)(?:-l(\d+))?$/.test(href.replace('/student/learn/', ''));
  console.log(`  ${board.padEnd(15)} first href = ${href}  parses=${ok}`);
  if (!ok) failures++;
}

console.log('\n=== Telugu content preserved (AP chapter 1) ===');
const c1 = learnPageChapters('AP_STATE_BOARD')[0];
console.log(`  title          : ${c1.title}`);
console.log(`  titleTelugu    : ${c1.titleTelugu}`);
console.log(`  topics         : ${c1.topics.length}`);
console.log(`  topic1 Telugu  : ${c1.topics[0].titleTelugu}`);
console.log(`  topic1 lesson  : ${String(c1.topics[0].lessons[0].conceptTeluguHtml || '').slice(0, 70).replace(/\n/g, ' ')}`);
if (!c1.titleTelugu || !c1.topics[0].titleTelugu) {
  console.log('  ERROR Telugu content missing');
  failures++;
}

console.log(`\nRESULT: ${failures ? 'FAIL' : 'PASS'} (${failures} failures)`);
process.exit(failures ? 1 : 0);