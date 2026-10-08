import type { HandwrittenCheckResult, MistakeCategory } from '@/types';

/**
 * Normalisation for the two multimodal (vision) AI routes.
 *
 * Vision calls are sent to Groq as multimodal messages and the provider is
 * free to choose the JSON *shape* even when a JSON object is requested. In
 * practice the model regularly returns fields such as `stepByStepSolution`
 * as a single numbered string instead of an array of step objects. Passing
 * that straight through to the UI caused runtime crashes such as
 * "solverResult.stepByStepSolution.map is not a function".
 *
 * These helpers coerce whatever the provider returned into the exact shapes
 * the screens consume, so the UI can rely on `Array.isArray(...)` and on
 * string fields. They are pure and isomorphic (no server-only imports), so the
 * same guarantees apply on the server and in the browser.
 */

export interface SolverStep {
  step: number;
  text: string;
  latex?: string;
}

export interface SolverResult {
  isReadable: boolean;
  unreadableReason?: string;
  extractedQuestion: string;
  concept: string;
  stepByStepSolution: SolverStep[];
  finalAnswer: string;
  similarQuestions: string[];
}

const MISTAKE_CATEGORIES: readonly MistakeCategory[] = [
  'CONCEPT_ERROR',
  'CALCULATION_ERROR',
  'SIGN_ERROR',
  'FORMULA_ERROR',
  'READING_ERROR',
  'UNIT_ERROR',
  'LOGIC_ERROR',
  'CARELESS_ERROR',
  'TIMEOUT',
  'UNKNOWN',
];

const OVERALL_STATUSES = ['CORRECT', 'PARTIAL', 'INCORRECT'] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Coerces provider scalars (string/number) to a trimmed string. */
function asString(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

/** Returns the first non-empty string among the candidate keys. */
function pickString(source: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = asString(source[key]);
    if (value) return value;
  }
  return '';
}

/** Coerces provider booleans, including the "true"/"false" strings models emit. */
function asBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return undefined;
}

/**
 * Pulls a LaTeX expression out of free-form step text so the UI can render it
 * with MathRenderer. Only used when the provider did not supply its own latex.
 */
function extractLatex(text: string): string | undefined {
  const patterns = [
    /\$\$([\s\S]+?)\$\$/,
    /\\\(([\s\S]+?)\\\)/,
    /\\\[([\s\S]+?)\\\]/,
    /(?<!\$)\$([^$\n]+)\$(?!\$)/,
  ];
  for (const pattern of patterns) {
    const latex = text.match(pattern)?.[1]?.trim();
    if (latex) return latex;
  }
  return undefined;
}

/** Removes a leading marker such as "Step 3:", "2.", or "3)" from a step line. */
function stripLeadingMarker(line: string): string {
  return line.replace(/^\s*(?:step\s*)?\d+\s*[.):\-]?\s*/i, '').trim();
}

/**
 * Splits a single provider string into individual steps. Newlines are the
 * primary separator; a single-line response that still carries inline
 * numbering ("1. ... 2. ...") is split as a fallback.
 */
function splitNumberedText(text: string): string[] {
  const byLine = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (byLine.length > 1) return byLine;

  const byInlineNumber = text
    .split(/(?=(?:^|\s)\d{1,2}\s*[.)]\s)/)
    .map((line) => stripLeadingMarker(line))
    .filter(Boolean);

  return byInlineNumber.length > 1 ? byInlineNumber : byLine;
}

/** Accepts an array, a numbered string, or a numeric-keyed object of steps. */
function collectStepEntries(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;

  if (typeof value === 'string' && value.trim()) return splitNumberedText(value);

  if (isRecord(value)) {
    // Some responses wrap the list: { "steps": [...] }.
    for (const key of ['steps', 'solution', 'stepByStep', 'workings']) {
      const nested = value[key];
      if (Array.isArray(nested)) return nested;
      if (typeof nested === 'string' && nested.trim()) return splitNumberedText(nested);
    }

    // Numeric-keyed map: { "1": "...", "2": "..." }.
    const numericKeys = Object.keys(value).filter((key) => /^\d+$/.test(key));
    if (numericKeys.length > 0) {
      return numericKeys
        .sort((a, b) => Number(a) - Number(b))
        .map((key) => ({ step: Number(key), text: value[key] }));
    }
  }

  return [];
}

/** Normalises one solver step entry into `{ step, text, latex? }`. */
function toSolverStep(entry: unknown, index: number): SolverStep | null {
  if (typeof entry === 'string') {
    const text = stripLeadingMarker(entry);
    if (!text) return null;
    const latex = extractLatex(text);
    return latex ? { step: index + 1, text, latex } : { step: index + 1, text };
  }

  if (!isRecord(entry)) return null;

  const text = pickString(entry, ['text', 'description', 'explanation', 'content', 'step', 'detail']);
  if (!text) return null;

  const rawIndex = pickString(entry, ['step', 'stepNumber', 'stepIndex', 'index', 'number']);
  const parsedIndex = Number(rawIndex || index + 1);

  const step: SolverStep = {
    step: Number.isFinite(parsedIndex) && parsedIndex > 0 ? Math.trunc(parsedIndex) : index + 1,
    text,
  };

  const latex =
    pickString(entry, ['latex', 'latexForm', 'formula', 'expression', 'equation']) || extractLatex(text);
  if (latex) step.latex = latex;

  return step;
}

/** Accepts an array of strings/objects or a single newline-separated string. */
function collectTextList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (isRecord(item) ? pickString(item, ['text', 'question', 'title']) : asString(item)))
      .filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(/\r?\n/)
      .map((line) => stripLeadingMarker(line))
      .filter(Boolean);
  }
  if (isRecord(value)) {
    return Object.values(value)
      .map((item) => asString(item))
      .filter(Boolean);
  }
  return [];
}

/**
 * Normalises the image-solver payload into a strictly typed result.
 * Never throws: a partially usable response degrades into safe defaults.
 */
export function normalizeSolverResult(raw: unknown): SolverResult {
  const source = isRecord(raw) ? raw : {};

  const extractedQuestion = pickString(source, [
    'extractedQuestion',
    'question',
    'problem',
    'problemStatement',
  ]);
  const finalAnswer = pickString(source, ['finalAnswer', 'answer', 'solution']);
  const concept = pickString(source, ['concept', 'topic', 'chapter', 'conceptName']);
  const unreadableReason = pickString(source, ['unreadableReason', 'reason', 'note']) || undefined;

  // Trust an explicit boolean; otherwise infer readability from the payload.
  const isReadable =
    asBoolean(source.isReadable) ??
    asBoolean(source.isReadableImage) ??
    extractedQuestion.length > 0;

  const steps = collectStepEntries(source.stepByStepSolution)
    .map((entry, index) => toSolverStep(entry, index))
    .filter((step): step is SolverStep => step !== null);

  return {
    isReadable,
    unreadableReason,
    extractedQuestion,
    concept,
    // A readable image must at least surface the final answer as a step.
    stepByStepSolution:
      steps.length > 0 ? steps : isReadable && finalAnswer ? [{ step: 1, text: finalAnswer }] : [],
    finalAnswer,
    similarQuestions: collectTextList(source.similarQuestions),
  };
}

/** Normalises one handwritten step into the `HandwrittenCheckResult` entry. */
function toDetectedStep(entry: unknown, index: number): HandwrittenCheckResult['detectedSteps'][number] {
  const asStepObject = isRecord(entry);
  const rawText = asStepObject
    ? pickString(entry, ['rawText', 'text', 'description', 'content', 'step', 'answer'])
    : stripLeadingMarker(asString(entry));

  const rawIndex = asStepObject
    ? pickString(entry, ['stepIndex', 'step', 'stepNumber', 'index', 'number'])
    : '';
  const parsedIndex = Number(rawIndex || index + 1);

  const isCorrect = asStepObject ? (asBoolean(entry.isCorrect) ?? asBoolean(entry.correct) ?? false) : false;

  const latexForm = asStepObject
    ? pickString(entry, ['latexForm', 'latex', 'formula', 'expression', 'equation']) || extractLatex(rawText)
    : extractLatex(rawText);

  const candidateCategory = asStepObject ? asString(entry.mistakeType).toUpperCase() : '';
  const mistakeType = MISTAKE_CATEGORIES.includes(candidateCategory as MistakeCategory)
    ? (candidateCategory as MistakeCategory)
    : isCorrect
      ? undefined
      : 'UNKNOWN';

  return {
    stepIndex: Number.isFinite(parsedIndex) && parsedIndex > 0 ? Math.trunc(parsedIndex) : index + 1,
    rawText,
    ...(latexForm ? { latexForm } : {}),
    isCorrect,
    mistakeType,
    feedback: asStepObject
      ? pickString(entry, ['feedback', 'comment', 'remark', 'correction', 'explanation'])
      : '',
  };
}

/** Derives the overall status from step correctness when it is not supplied. */
function deriveOverallStatus(
  steps: HandwrittenCheckResult['detectedSteps']
): HandwrittenCheckResult['overallStatus'] {
  if (steps.length === 0) return 'PARTIAL';
  const correct = steps.filter((step) => step.isCorrect).length;
  if (correct === steps.length) return 'CORRECT';
  if (correct === 0) return 'INCORRECT';
  return 'PARTIAL';
}

/**
 * Normalises the handwritten-checker payload into `HandwrittenCheckResult`.
 * `overallStatus` is always one of CORRECT/PARTIAL/INCORRECT so the status
 * badge and the per-step breakdown cannot disagree.
 */
export function normalizeHandwrittenResult(raw: unknown): HandwrittenCheckResult {
  const source = isRecord(raw) ? raw : {};

  const steps = collectStepEntries(source.detectedSteps)
    .map((entry, index) => toDetectedStep(entry, index))
    .filter((step) => step.rawText.length > 0);

  const suppliedStatus = asString(source.overallStatus ?? source.status).toUpperCase();
  const overallStatus = OVERALL_STATUSES.includes(suppliedStatus as HandwrittenCheckResult['overallStatus'])
    ? (suppliedStatus as HandwrittenCheckResult['overallStatus'])
    : deriveOverallStatus(steps);

  const extractedQuestionText = pickString(source, [
    'extractedQuestionText',
    'question',
    'extractedQuestion',
  ]);

  return {
    isLegible:
      asBoolean(source.isLegible) ??
      asBoolean(source.isReadable) ??
      (steps.length > 0 || extractedQuestionText.length > 0),
    extractedQuestionText,
    detectedSteps: steps,
    overallStatus,
    finalVerdict: pickString(source, ['finalVerdict', 'verdict', 'comment']),
    recommendedRevisionTopic: pickString(source, ['recommendedRevisionTopic', 'revisionTopic', 'topic']),
  };
}