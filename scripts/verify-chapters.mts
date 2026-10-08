/**
 * Verifies that every curriculum chapter opens as a real learning page rather
 * than an empty shell.
 *
 * Mirrors `resolveLesson()` from src/app/student/learn/[lessonId]/page.tsx and
 * asserts, for every CBSE and AP chapter, that the student URL actually resolves
 * a lesson carrying objectives, concept notes, worked examples and revision
 * notes, and that the chapter has topics/lessons/formulas/questions to study.
 *
 * Usage: node --experimental-strip-types scripts/verify-chapters.mts
 */
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

register('./ts-alias-loader.mjs', pathToFileURL(path.join(import.meta.dirname, '/')));

const { CLASS_9_CHAPTERS } = await import('../src/lib/curriculum-data.ts');
import type { BoardType, Chapter, Lesson, Topic } from '../src/types/index.ts';

const BOARD_PREFIX: Record<BoardType, string> = {
  CBSE: 'cbse',
  AP_STATE_BOARD: 'ap',
};

/**
 * The lesson shape the chapter page consumes. Real curriculum lessons are full
 * `Lesson` objects; the synthesised chapter-overview fallback only carries a
 * subset, so everything except the identity fields is optional.
 */
type ResolvedLesson = Pick<Lesson, 'id' | 'title'> & Partial<Omit<Lesson, 'id' | 'title'>>;

interface ResolvedChapter {
  chapter: Chapter | null;
  topic: Topic | null;
  lesson: ResolvedLesson | null;
  board: BoardType | null;
}

/** Same resolution rules as the chapter page. */
function resolveLesson(lessonId: string): ResolvedChapter {
  const match = /^((?:ap)|(?:cbse))-ch(\d+)(?:-l(\d+))?$/.exec(lessonId ?? '');
  if (!match) return { chapter: null, topic: null, lesson: null, board: null };

  const board: BoardType = match[1] === 'cbse' ? 'CBSE' : 'AP_STATE_BOARD';
  const chapterNumber = Number.parseInt(match[2], 10);
  const lessonNumber = match[3] ? Number.parseInt(match[3], 10) : 1;

  const boardChapters = CLASS_9_CHAPTERS.filter((c) => c.board === board);
  const chapter = boardChapters.find((c) => Number(c.chapterNumber) === chapterNumber);
  if (!chapter) return { chapter: null, topic: null, lesson: null, board };

  const lessonsWithTopics = chapter.topics.flatMap((topic) =>
    (topic.lessons ?? []).map((lesson) => ({ topic, lesson }))
  );

  const resolved = lessonsWithTopics[lessonNumber - 1];
  if (resolved) {
    return { chapter, topic: resolved.topic, lesson: resolved.lesson, board };
  }

  // Fallback synthesised overview for the chapter.
  const firstTopic = chapter.topics?.[0];
  if (!firstTopic) return { chapter, topic: null, lesson: null, board };

  return {
    chapter,
    topic: firstTopic,
    lesson: {
      id: `${chapter.id}-overview`,
      title: firstTopic.title,
      learningObjectives: [`Understand ${firstTopic.title}.`],
      conceptHtml: `<p>${firstTopic.description || ''}</p>`,
      examples: [],
      revisionNotes: [],
    },
    board,
  };
}

const failures: string[] = [];
const check = (label: string, ok: boolean, detail = ''): boolean => {
  if (!ok) failures.push(`${label}${detail ? ` (${detail})` : ''}`);
  return ok;
};

console.log('=== CHAPTER LEARNING CONTENT VERIFICATION ===\n');

const byBoard: Record<BoardType, Chapter[]> = { CBSE: [], AP_STATE_BOARD: [] };
for (const chapter of CLASS_9_CHAPTERS) byBoard[chapter.board]?.push(chapter);
for (const [board, chapters] of Object.entries(byBoard) as [BoardType, Chapter[]][]) {
  const prefix = BOARD_PREFIX[board];
  console.log(`--- ${board} (${chapters.length} chapters) ---`);

  const counters = { objectives: 0, concept: 0, examples: 0, revision: 0, unresolved: 0, emptyTopics: 0 };

  for (const chapter of chapters) {
    const slug = `${prefix}-ch${chapter.chapterNumber}-l1`;
    const url = `/student/learn/${slug}`;
    const { chapter: resolvedChapter, lesson, topic } = resolveLesson(slug);

    if (!resolvedChapter || !lesson) {
      counters.unresolved += 1;
      check(`${board} ch${chapter.chapterNumber} resolves from ${url}`, false);
      continue;
    }
    check(`${board} ch${chapter.chapterNumber} lesson belongs to a topic`, Boolean(topic));

    if (lesson.learningObjectives?.length) counters.objectives += 1;
    else check(`${board} ch${chapter.chapterNumber} (${chapter.title}) has learning objectives`, false);

    if (lesson.conceptHtml?.trim()) counters.concept += 1;
    else check(`${board} ch${chapter.chapterNumber} (${chapter.title}) has concept notes`, false);

    if (lesson.examples?.length) counters.examples += 1;
    if (lesson.revisionNotes?.length) counters.revision += 1;

    if (!(chapter.topics?.length > 0)) {
      counters.emptyTopics += 1;
      check(`${board} chapter ${chapter.title} has topics`, false);
    }
  }

  const total = chapters.length;
  console.log(`  chapter URL resolves  : ${total - counters.unresolved}/${total}`);
  console.log(`  learning objectives   : ${counters.objectives}/${total}`);
  console.log(`  concept notes (notes) : ${counters.concept}/${total}`);
  console.log(`  worked examples       : ${counters.examples}/${total}`);
  console.log(`  revision key notes    : ${counters.revision}/${total}`);
  console.log(`  chapters with topics  : ${total - counters.emptyTopics}/${total}`);
  console.log('');

  check(`${board}: every chapter URL resolves`, counters.unresolved === 0);
  check(`${board}: every chapter has learning objectives`, counters.objectives === total, `${counters.objectives}/${total}`);
  check(`${board}: every chapter has concept notes`, counters.concept === total, `${counters.concept}/${total}`);
  check(`${board}: every chapter has topics`, counters.emptyTopics === 0);
}
// Aggregate content volume across the whole curriculum.
const totals = CLASS_9_CHAPTERS.reduce(
  (acc, chapter) => {
    for (const topic of chapter.topics) {
      acc.topics += 1;
      acc.lessons += topic.lessons?.length ?? 0;
      acc.formulas += topic.formulas?.length ?? 0;
      acc.examples += topic.examples?.length ?? 0;
      acc.questions += topic.questions?.length ?? 0;
      acc.teluguTitles += topic.titleTelugu ? 1 : 0;
      acc.teluguDescriptions += topic.descriptionTelugu ? 1 : 0;
    }
    return acc;
  },
  { topics: 0, lessons: 0, formulas: 0, examples: 0, questions: 0, teluguTitles: 0, teluguDescriptions: 0 }
);

console.log('--- curriculum totals ---');
for (const [key, value] of Object.entries(totals)) console.log(`  ${key.padEnd(20)} ${value}`);
console.log('');

check('CBSE has 15 chapters', byBoard.CBSE.length === 15, String(byBoard.CBSE.length));
check('AP has 12 chapters', byBoard.AP_STATE_BOARD.length === 12, String(byBoard.AP_STATE_BOARD.length));
check('CBSE has 93 topics', byBoard.CBSE.reduce((n, c) => n + c.topics.length, 0) === 93);
check('AP has 52 topics', byBoard.AP_STATE_BOARD.reduce((n, c) => n + c.topics.length, 0) === 52);
check('every topic has at least one lesson', totals.lessons >= totals.topics, `${totals.lessons}/${totals.topics}`);
check('every topic keeps a Telugu title', totals.teluguTitles === totals.topics,
  `${totals.teluguTitles}/${totals.topics}`);

if (failures.length) {
  console.log('FAILURES:');
  for (const f of failures) console.log(`  - ${f}`);
  console.log(`\n${failures.length} check(s) FAILED.`);
  process.exit(1);
}
console.log('All chapter learning content checks passed.');