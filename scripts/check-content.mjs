/**
 * Runtime content check for the curriculum.
 *
 *   node --experimental-strip-types scripts/check-content.mjs
 *
 * Imports the real modules (via ts-alias-loader) and verifies that every
 * chapter has topics, and that every topic carries English AND Telugu
 * titles, descriptions and lesson content.
 */
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

register('./ts-alias-loader.mjs', pathToFileURL(path.join(import.meta.dirname, '/')));

const { CLASS_9_CHAPTERS } = await import('../src/lib/curriculum-data.ts');

const REQUIRED_IDS = [
  // CBSE
  'ch-euclids-geometry', 'ch-lines-angles', 'ch-triangles', 'ch-quadrilaterals',
  'ch-circles', 'ch-herons-formula', 'ch-surface-areas', 'ch-statistics', 'ch-probability',
  // AP State Board
  'ch-ap-s1-coordinate-geometry', 'ch-ap-s1-linear-equations', 'ch-ap-s1-euclids-geometry',
  'ch-ap-s1-lines-angles', 'ch-ap-s2-triangles', 'ch-ap-s2-quadrilaterals', 'ch-ap-s2-circles',
  'ch-ap-s2-herons-formula', 'ch-ap-s2-surface-areas-volumes', 'ch-ap-s2-statistics',
];

let failures = 0;

console.log('=== RUNTIME CONTENT CHECK ===');
for (const id of REQUIRED_IDS) {
  const chapter = CLASS_9_CHAPTERS.find((c) => c.id === id);
  if (!chapter) {
    console.log(`[MISSING] ${id}`);
    failures++;
    continue;
  }

  const topics = chapter.topics;
  const missingEnglish = topics.filter((t) => !t.title || !t.description || !t.lessons?.length).length;
  const missingTelugu = topics.filter((t) => !t.titleTelugu || !t.descriptionTelugu).length;
  const missingTeluguLesson = topics.filter((t) => !t.lessons?.some((l) => l.conceptTeluguHtml)).length;
  const formulas = topics.reduce((sum, t) => sum + (t.formulas?.length || 0), 0);
  const examples = topics.reduce((sum, t) => sum + (t.examples?.length || 0), 0);

  const ok = topics.length > 0 && !missingEnglish && !missingTelugu && !missingTeluguLesson;
  if (!ok) failures++;

  console.log(
    `${ok ? '[OK] ' : '[!!] '}${id.padEnd(34)}topics=${String(topics.length).padEnd(3)}` +
      `formulas=${String(formulas).padEnd(3)}examples=${String(examples).padEnd(3)}` +
      `EN-missing=${missingEnglish} TE-missing=${missingTelugu} TE-lesson-missing=${missingTeluguLesson}`
  );
}

const totalTopics = CLASS_9_CHAPTERS.reduce((sum, c) => sum + c.topics.length, 0);
console.log('');
console.log(`chapters failing content check : ${failures}`);
console.log(`total chapters                 : ${CLASS_9_CHAPTERS.length}`);
console.log(`total topics                   : ${totalTopics}`);
process.exit(failures ? 1 : 0);