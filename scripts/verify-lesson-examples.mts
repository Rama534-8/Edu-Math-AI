/**
 * Verifies the Bug 1 data boundary: every worked example the lesson page renders
 * must expose `steps[].explanation` (a string) and `finalAnswer` (a string),
 * because the page passes those into <MixedMathText text={...} />.
 *
 * If this passes, MixedMathText can never receive a non-string from the lesson
 * page, so `text.split is not a function` cannot recur.
 *
 * Usage: node --experimental-strip-types scripts/verify-lesson-examples.mts
 */
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

register('./ts-alias-loader.mjs', pathToFileURL(path.join(import.meta.dirname, '/')));

const { CLASS_9_CHAPTERS } = await import('../src/lib/curriculum-data.ts');
import type { Chapter, WorkedExample } from '../src/types/index.ts';

const failures: string[] = [];
const check = (label: string, ok: boolean, detail = ''): boolean => {
  if (!ok) failures.push(`${label}${detail ? ` (${detail})` : ''}`);
  return ok;
};

let examples = 0;
let steps = 0;
let badStepExplanation = 0;
let badFinalAnswer = 0;
let badQuestion = 0;

console.log('=== LESSON WORKED-EXAMPLE RENDER CONTRACT ===\n');

const allExamples: { chapter: Chapter; example: WorkedExample }[] = [];
for (const chapter of CLASS_9_CHAPTERS) {
  for (const topic of chapter.topics) {
    for (const lesson of topic.lessons ?? []) {
      for (const example of lesson.examples ?? []) {
        allExamples.push({ chapter, example });
      }
    }
  }
}

for (const { chapter, example } of allExamples) {
  examples += 1;
  if (typeof example.question !== 'string' || !example.question.trim()) {
    badQuestion += 1;
    check(`question text is a string (${chapter.title})`, false);
  }
  if (typeof example.finalAnswer !== 'string') {
    badFinalAnswer += 1;
    check(`finalAnswer is a string (${chapter.title})`, false);
  }
  for (const step of example.steps ?? []) {
    steps += 1;
    if (typeof step.explanation !== 'string') {
      badStepExplanation += 1;
      check(`step.explanation is a string (${chapter.title})`, false);
    }
  }
}

console.log(`worked examples scanned : ${examples}`);
console.log(`solution steps scanned : ${steps}`);
console.log(`non-string question    : ${badQuestion}`);
console.log(`non-string finalAnswer : ${badFinalAnswer}`);
console.log(`non-string explanation : ${badStepExplanation}`);
console.log('');

check('at least one worked example exists', examples > 0, String(examples));
check('all question texts are strings', badQuestion === 0);
check('all finalAnswer values are strings', badFinalAnswer === 0);
check('all step explanations are strings', badStepExplanation === 0);

if (failures.length) {
  console.log('FAILURES:');
  for (const f of failures.slice(0, 20)) console.log(`  - ${f}`);
  console.log(`\n${failures.length} check(s) FAILED.`);
  process.exit(1);
}
console.log('All lesson render-contract checks passed.');