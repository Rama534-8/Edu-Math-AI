/**
 * Validates the generated curriculum modules.
 *
 *   node scripts/validate-curriculum.mjs
 *
 * Checks: board/chapter coverage against the official syllabus, empty topics
 * arrays, duplicate ids, broken chapterId/topicId references, and Telugu
 * coverage. Exits non-zero if any structural check fails.
 */
// Node cannot resolve the Next.js "@/" path alias, so register a resolve hook
// that maps it onto ./src. This lets the validator import the real modules.
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

register('./ts-alias-loader.mjs', pathToFileURL(path.join(import.meta.dirname, '/')));

/**
 * Language check: all programming code (identifiers, keys, comments, file
 * names, ids) must be English. Telugu is only allowed in the student-facing
 * content fields listed below.
 */
const TELUGU = /[\u0C00-\u0C7F]/;
const TELUGU_CONTENT_KEYS = new Set([
  'titleTelugu',
  'descriptionTelugu',
  'conceptsTelugu',
  'learningObjectivesTelugu',
  'learningOutcomesTelugu',
  'conceptTeluguHtml',
  'questionTelugu',
  'questionTextTelugu',
  'correctAnswerExplanationTelugu',
  'unitLabelTelugu',
]);

function checkEnglishOnlyCode(ts, fs) {
  const files = [
    'src/lib/curriculum/cbse-seed.ts',
    'src/lib/curriculum/ap-state-board-seed.ts',
    'src/lib/curriculum/builders.ts',
    'src/lib/curriculum/cbse.ts',
    'src/lib/curriculum/ap-state-board.ts',
    'src/lib/curriculum-data.ts',
    'src/types/index.ts',
    'scripts/cbse-data.mjs',
    'scripts/ap-data.mjs',
    'scripts/build-cbse.mjs',
    'scripts/build-ap.mjs',
    'scripts/build-all.mjs',
  ];

  const problems = [];

  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    const sf = ts.createSourceFile(
      file,
      src,
      ts.ScriptTarget.ESNext,
      true,
      file.endsWith('.mjs') ? ts.ScriptKind.JS : ts.ScriptKind.TS
    );

    const line = (pos) => sf.getLineAndCharacterOfPosition(pos).line + 1;

    // Identifiers and comments must be English.
    const visit = (node) => {
      if (ts.isIdentifier(node) && TELUGU.test(node.text)) {
        problems.push(`${file}:${line(node.getStart(sf))} Telugu identifier "${node.text}"`);
      }
      for (const r of ts.getLeadingCommentRanges(src, node.getFullStart()) ?? []) {
        const text = src.slice(r.pos, r.end);
        if (TELUGU.test(text)) {
          problems.push(`${file}:${line(r.pos)} Telugu in comment: ${text.slice(0, 50)}`);
        }
      }
      // Telugu is only allowed in the approved content fields.
      if (ts.isPropertyAssignment(node) && node.initializer) {
        const name = node.name;
        const key =
          ts.isIdentifier(name) || ts.isStringLiteral(name) ? name.text : '?';
        const value = node.initializer;
        const isLeafString =
          ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value);
        if (isLeafString && TELUGU.test(value.text) && !TELUGU_CONTENT_KEYS.has(key)) {
          problems.push(`${file}:${line(node.getStart(sf))} Telugu in non-content field "${key}"`);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }

  return problems;
}

// Dynamic import so the loader above is registered before the graph is loaded.
const { CLASS_9_CHAPTERS, SAMPLE_QUESTIONS_BANK } = await import(
  '../src/lib/curriculum-data.ts'
);

const languageProblems = checkEnglishOnlyCode(
  (await import('typescript')).default ?? (await import('typescript')),
  fs
);

const EXPECTED_CBSE = [
  'ch-real-numbers', 'ch-polynomials', 'ch-sequences-progressions',
  'ch-algebraic-identities', 'ch-linear-equations', 'ch-coordinate-geometry',
  'ch-euclids-geometry', 'ch-lines-angles', 'ch-triangles', 'ch-quadrilaterals',
  'ch-circles', 'ch-herons-formula', 'ch-surface-areas', 'ch-statistics',
  'ch-probability',
];

const EXPECTED_AP = [
  'ch-ap-s1-number-systems', 'ch-ap-s1-polynomials', 'ch-ap-s1-coordinate-geometry',
  'ch-ap-s1-linear-equations', 'ch-ap-s1-euclids-geometry', 'ch-ap-s1-lines-angles',
  'ch-ap-s2-triangles', 'ch-ap-s2-quadrilaterals', 'ch-ap-s2-circles',
  'ch-ap-s2-herons-formula', 'ch-ap-s2-surface-areas-volumes', 'ch-ap-s2-statistics',
];

const problems = [];
const note = (m) => problems.push(m);

function stats(chapters, label) {
  let topics = 0, lessons = 0, formulas = 0, examples = 0;
  let teChapters = 0, teTopics = 0;
  for (const ch of chapters) {
    if (ch.titleTelugu) teChapters++;
    if (!ch.topics.length) note(`${label}: chapter ${ch.id} has an empty topics array`);
    topics += ch.topics.length;
    for (const t of ch.topics) {
      if (t.titleTelugu) teTopics++;
      if (!t.descriptionTelugu) note(`${label}: topic ${t.id} missing descriptionTelugu`);
      lessons += t.lessons?.length ?? 0;
      formulas += t.formulas?.length ?? 0;
      examples += t.examples?.length ?? 0;
      if (!(t.lessons?.length)) note(`${label}: topic ${t.id} has no lessons`);
      if (!t.concepts?.length) note(`${label}: topic ${t.id} has no concepts`);
    }
  }
  return { label, chapters: chapters.length, topics, lessons, formulas, examples, teChapters, teTopics };
}

const cbse = CLASS_9_CHAPTERS.filter((c) => c.board === 'CBSE');
const ap = CLASS_9_CHAPTERS.filter((c) => c.board === 'AP_STATE_BOARD');

for (const [label, list, expected] of [['CBSE', cbse, EXPECTED_CBSE], ['AP', ap, EXPECTED_AP]]) {
  const ids = list.map((c) => c.id);
  for (const id of expected) if (!ids.includes(id)) note(`${label}: missing chapter ${id}`);
  for (const id of ids) if (!expected.includes(id)) note(`${label}: unexpected chapter ${id}`);
}

// duplicate + reference checks across the whole curriculum
const chIds = new Set();
const topIds = new Set();
for (const ch of CLASS_9_CHAPTERS) {
  if (chIds.has(ch.id)) note(`duplicate chapter id ${ch.id}`);
  chIds.add(ch.id);
  if (ch.totalTopics !== ch.topics.length) {
    note(`${ch.id}: totalTopics=${ch.totalTopics} but topics.length=${ch.topics.length}`);
  }
  for (const t of ch.topics) {
    if (topIds.has(t.id)) note(`duplicate topic id ${t.id}`);
    topIds.add(t.id);
    if (t.chapterId !== ch.id) note(`${t.id}: chapterId ${t.chapterId} != owning chapter ${ch.id}`);
  }
}

const qIds = new Set();
for (const q of SAMPLE_QUESTIONS_BANK) {
  if (qIds.has(q.id)) note(`duplicate question id ${q.id}`);
  qIds.add(q.id);
  if (!chIds.has(q.chapterId)) note(`question ${q.id}: unknown chapterId ${q.chapterId}`);
  if (!topIds.has(q.topicId)) note(`question ${q.id}: unknown topicId ${q.topicId}`);
  else {
    const ch = CLASS_9_CHAPTERS.find((c) => c.id === q.chapterId);
    const ok = ch?.topics.some((t) => t.id === q.topicId);
    if (!ok) note(`question ${q.id}: topicId ${q.topicId} does not belong to chapter ${q.chapterId}`);
  }
}

const rows = [stats(cbse, 'CBSE'), stats(ap, 'AP')];
console.log('\n=== CURRICULUM VALIDATION ===');
for (const r of rows) {
  console.log(`\n${r.label}`);
  console.log(`  chapters      : ${r.chapters}`);
  console.log(`  topics        : ${r.topics}`);
  console.log(`  lessons       : ${r.lessons}`);
  console.log(`  formulas      : ${r.formulas}`);
  console.log(`  worked examples: ${r.examples}`);
  console.log(`  Telugu chapters: ${r.teChapters}/${r.chapters}`);
  console.log(`  Telugu topics  : ${r.teTopics}/${r.topics}`);
}
const teQ = SAMPLE_QUESTIONS_BANK.filter((q) => q.questionTextTelugu).length;
const bq = SAMPLE_QUESTIONS_BANK.filter((q) => q.board).length;
console.log(`\nQuestions total : ${SAMPLE_QUESTIONS_BANK.length}`);
console.log(`  with Telugu   : ${teQ}`);
console.log(`  with board tag: ${bq}`);

console.log(`\n=== PROBLEMS: ${problems.length} ===`);
for (const p of problems.slice(0, 40)) console.log('  - ' + p);
if (problems.length > 40) console.log(`  ... and ${problems.length - 40} more`);

console.log(`\n=== LANGUAGE CHECK (English code / Telugu content) ===`);
console.log(`  language problems: ${languageProblems.length}`);
for (const p of languageProblems.slice(0, 20)) console.log('  - ' + p);

const exitCode = problems.length + languageProblems.length ? 1 : 0;
console.log(`\nRESULT: ${exitCode === 0 ? 'PASS' : 'FAIL'}`);
process.exit(exitCode);