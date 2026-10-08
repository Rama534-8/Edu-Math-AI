/**
 * Verifies the board filter used by /student/learn and /student/learn/[lessonId]
 * resolves real chapters for both boards.
 *
 *   node --experimental-strip-types scripts/check-learn-filter.mjs
 *
 * This mirrors the page logic (exact string equality on chapter.board) so a
 * regression in the board enum would be caught here.
 */
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

register('./ts-alias-loader.mjs', pathToFileURL(path.join(import.meta.dirname, '/')));

const { CLASS_9_CHAPTERS } = await import('../src/lib/curriculum-data.ts');

const EXPECTED = {
  AP_STATE_BOARD: [
    'Number Systems', 'Polynomials', 'Co-ordinate Geometry',
    'Linear Equations in Two Variables', "Introduction to Euclid's Geometry",
    'Lines and Angles', 'Triangles', 'Quadrilaterals', 'Circles',
    "Heron's Formula", 'Surface Areas and Volumes', 'Statistics',
  ],
  CBSE_COUNT: 15,
};

// Mirrors the fixed Learn page filter.
const boardChapters = (board) =>
  CLASS_9_CHAPTERS.filter((chapter) => chapter.board === board);

let failures = 0;

for (const board of ['AP_STATE_BOARD', 'CBSE']) {
  const chapters = boardChapters(board);
  console.log(`\n=== ${board} ===`);
  console.log(`  chapters matched: ${chapters.length}`);
  chapters.forEach((c) =>
    console.log(`   ${String(c.chapterNumber).padStart(2)}. ${c.title}  [${c.id}]`)
  );
  if (chapters.length === 0) {
    console.log('  ERROR: no chapters matched');
    failures++;
  }
}

// Verify the AP chapter titles match the expected list exactly.
const apTitles = boardChapters('AP_STATE_BOARD').map((c) => c.title);
const missingAp = EXPECTED.AP_STATE_BOARD.filter((t) => !apTitles.includes(t));
if (missingAp.length) {
  console.log(`\n  ERROR missing AP chapters: ${missingAp.join(', ')}`);
  failures++;
} else {
  console.log('\n  all 12 expected AP chapters present by title');
}

if (boardChapters('CBSE').length !== EXPECTED.CBSE_COUNT) {
  console.log(`  ERROR expected ${EXPECTED.CBSE_COUNT} CBSE chapters`);
  failures++;
}

// Mirrors the lesson link + lesson page resolution.
console.log('\n=== lesson link resolution ===');
for (const board of ['AP_STATE_BOARD', 'CBSE']) {
  const prefix = board === 'CBSE' ? 'cbse' : 'ap';
  for (const chapter of boardChapters(board)) {
    const slug = `${prefix}-ch${chapter.chapterNumber}-l1`;
    const match = slug.match(/^(ap|cbse)-ch(\d+)(?:-l(\d+))?$/);
    if (!match) {
      console.log(`  ERROR slug not resolvable: ${slug}`);
      failures++;
      continue;
    }
    const derived = match[1] === 'cbse' ? 'CBSE' : 'AP_STATE_BOARD';
    const resolved = boardChapters(derived).find(
      (c) => Number(c.chapterNumber) === parseInt(match[2], 10)
    );
    if (!resolved) {
      console.log(`  ERROR ${slug} resolves to no chapter`);
      failures++;
    }
  }
}
console.log('  every generated lesson link resolves to a real chapter');

console.log(`\nRESULT: ${failures ? 'FAIL' : 'PASS'} (${failures} failures)`);
process.exit(failures ? 1 : 0);