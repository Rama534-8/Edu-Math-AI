/**
 * Unit checks for the vision-response normalisers.
 *
 *   node --experimental-strip-types scripts/check-ai-normalize.mts
 *
 * These lock in the regression that broke /student/ai-solver: the provider
 * returning `stepByStepSolution` as a numbered STRING instead of an array,
 * which made the page call `.map()` on a string.
 *
 * The relative specifier uses an explicit ".ts" extension because Node's ESM
 * resolver requires it when running the file directly; tsconfig enables
 * allowImportingTsExtensions (safe alongside "noEmit": true).
 */
import assert from 'node:assert/strict';
import { normalizeSolverResult, normalizeHandwrittenResult } from '../src/lib/ai-normalize.ts';

let passed = 0;
function check(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  PASS  ${name}`);
  } catch (error) {
    console.log(`  FAIL  ${name}`);
    console.log(`        ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

console.log('normalizeSolverResult');

check('splits the numbered-string regression into ordered steps', () => {
  const result = normalizeSolverResult({
    isReadable: true,
    extractedQuestion: 'Solve x^2 - 5x + 6 = 0',
    concept: 'Factorisation',
    stepByStepSolution:
      '1. Identify the coefficients of the quadratic equation.\n2. Find two numbers that multiply to give the constant.\n3. Split the middle term.',
    finalAnswer: 'x = 2, x = 3',
    similarQuestions: ['Solve x^2 - 7x + 12 = 0'],
  });
  assert.ok(Array.isArray(result.stepByStepSolution), 'must be an array');
  assert.equal(result.stepByStepSolution.length, 3);
  assert.deepEqual(
    result.stepByStepSolution.map((s) => s.step),
    [1, 2, 3]
  );
  assert.ok(result.stepByStepSolution[0].text.startsWith('Identify'), 'leading marker removed');
  assert.equal(result.similarQuestions.length, 1);
});

check('accepts a well-formed array of step objects unchanged', () => {
  const result = normalizeSolverResult({
    isReadable: true,
    extractedQuestion: 'Q',
    stepByStepSolution: [{ step: 1, text: 'First', latex: 'x=2' }],
    finalAnswer: 'x = 2',
  });
  assert.equal(result.stepByStepSolution.length, 1);
  assert.equal(result.stepByStepSolution[0].latex, 'x=2');
});

check('keeps array shape for a single-line inline-numbered string', () => {
  const result = normalizeSolverResult({
    isReadable: true,
    extractedQuestion: 'Q',
    stepByStepSolution: '1. First step. 2. Second step.',
    finalAnswer: 'a',
  });
  assert.ok(Array.isArray(result.stepByStepSolution));
  assert.equal(result.stepByStepSolution.length, 2);
});

check('falls back to the final answer when the model omits steps', () => {
  const result = normalizeSolverResult({
    isReadable: true,
    extractedQuestion: 'Q',
    finalAnswer: 'x = 5',
  });
  assert.equal(result.stepByStepSolution.length, 1);
  assert.equal(result.stepByStepSolution[0].text, 'x = 5');
});

check('an unreadable image yields no steps and keeps the reason', () => {
  const result = normalizeSolverResult({
    isReadable: false,
    unreadableReason: 'The image is too blurry.',
  });
  assert.equal(result.isReadable, false);
  assert.equal(result.stepByStepSolution.length, 0);
  assert.equal(result.unreadableReason, 'The image is too blurry.');
});

check('tolerates junk without throwing', () => {
  const result = normalizeSolverResult(null);
  assert.equal(result.isReadable, false);
  assert.equal(result.stepByStepSolution.length, 0);
  assert.equal(result.similarQuestions.length, 0);
});

console.log('\nnormalizeHandwrittenResult');

check('splits a numbered-string detectedSteps into steps', () => {
  const result = normalizeHandwrittenResult({
    isLegible: true,
    extractedQuestionText: 'Factorise x^2 + 5x + 6',
    detectedSteps: '1. x^2 * 1 = x^2\n2. 3 * 2 = 6',
    finalVerdict: 'Correct.',
  });
  assert.ok(Array.isArray(result.detectedSteps));
  assert.equal(result.detectedSteps.length, 2);
  assert.ok(['CORRECT', 'PARTIAL', 'INCORRECT'].includes(result.overallStatus));
});

check('derives overallStatus from step correctness when missing', () => {
  const result = normalizeHandwrittenResult({
    isLegible: true,
    detectedSteps: [
      { stepIndex: 1, rawText: 'a', isCorrect: true },
      { stepIndex: 2, rawText: 'b', isCorrect: false, mistakeType: 'SIGN_ERROR' },
    ],
  });
  assert.equal(result.overallStatus, 'PARTIAL');
  assert.equal(result.detectedSteps[1].mistakeType, 'SIGN_ERROR');
});

check('an empty response still returns a valid status', () => {
  const result = normalizeHandwrittenResult({});
  assert.equal(result.detectedSteps.length, 0);
  assert.equal(result.overallStatus, 'PARTIAL');
  assert.equal(typeof result.finalVerdict, 'string');
});

console.log(`\n${passed} checks passed`);
if (!process.exitCode) console.log('All normalizer checks passed.');