import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { withAiAudit } from '@/lib/ai-audit';
import { groqJson, type GroqMessage } from '@/lib/groq';
import { requireRoles } from '@/lib/authz';
import { CLASS_9_CHAPTERS } from '@/lib/curriculum-data';
import type {
  BoardType,
  PaperDifficulty,
  PaperLanguage,
  PaperQuestion,
  PaperQuestionType,
  QuestionPaper,
} from '@/types';

// -----------------------------------------------------------------------------
// AI Question Paper Generator (Teacher)
//
// Strict grounding rules:
//   - Every requested chapter id must exist in CLASS_9_CHAPTERS for the chosen
//     board (400 otherwise) — the model can never pull in foreign syllabus.
//   - The model response is validated server-side: questions from chapters that
//     were not requested are dropped, MCQs must carry exactly 4 options, marks
//     are clamped, and numbering/totals are recomputed here (never trusted
//     from the model).
//   - The whole request runs inside withAiAudit('AI_QUESTION_PAPER', ...).
// -----------------------------------------------------------------------------

const QUESTION_TYPES: PaperQuestionType[] = ['MCQ', 'SHORT_ANSWER', 'LONG_ANSWER', 'NUMERICAL'];
const DIFFICULTIES: PaperDifficulty[] = ['EASY', 'MEDIUM', 'HARD', 'MIXED'];
const LANGUAGES: PaperLanguage[] = ['ENGLISH', 'TELUGU'];
const BOARDS: BoardType[] = ['CBSE', 'AP_STATE_BOARD'];

const MIN_QUESTIONS = 5;
const MAX_QUESTIONS = 40;

const DEFAULT_INSTRUCTIONS = [
  'All questions are compulsory unless a section states otherwise.',
  'Write neat, complete working for full marks.',
  'Non-calculator unless the question explicitly allows it.',
];

interface GeneratePaperBody {
  title?: unknown;
  board?: unknown;
  chapterIds?: unknown;
  questionCount?: unknown;
  difficulty?: unknown;
  language?: unknown;
}

/** Marks guidance per type — used in the prompt and as a server-side clamp. */
const MARKS_BY_TYPE: Record<PaperQuestionType, number> = {
  MCQ: 1,
  NUMERICAL: 2,
  SHORT_ANSWER: 3,
  LONG_ANSWER: 5,
};

function isBoard(value: unknown): value is BoardType {
  return typeof value === 'string' && (BOARDS as string[]).includes(value);
}

/**
 * Validates one model-produced question against the request.
 * Returns null when the question must be dropped (wrong chapter, bad shape,
 * missing options, …) — never throws, so one bad item can't fail the paper.
 */
function sanitizeQuestion(
  raw: unknown,
  allowedChapterIds: Set<string>,
  number: number
): PaperQuestion | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const q = raw as Record<string, unknown>;

  const type = q.type;
  if (typeof type !== 'string' || !(QUESTION_TYPES as string[]).includes(type)) return null;

  const chapterId = q.chapterId;
  if (typeof chapterId !== 'string' || !allowedChapterIds.has(chapterId)) return null;

  const question = typeof q.question === 'string' ? q.question.trim() : '';
  if (!question) return null;

  const marksRaw = typeof q.marks === 'number' ? q.marks : Number(q.marks);
  const marks = Number.isFinite(marksRaw) && marksRaw > 0 ? Math.min(10, Math.round(marksRaw)) : MARKS_BY_TYPE[type as PaperQuestionType];

  const answer = typeof q.answer === 'string' ? q.answer.trim() : '';

  if (type === 'MCQ') {
    if (!Array.isArray(q.options)) return null;
    const options = q.options.filter((o): o is string => typeof o === 'string' && o.trim().length > 0).map((o) => o.trim());
    if (options.length !== 4) return null;
    return { number, type: 'MCQ', chapterId, question, options, answer: answer || undefined, marks };
  }

  return {
    number,
    type: type as PaperQuestionType,
    chapterId,
    question,
    answer: answer || undefined,
    marks,
  };
}
/** System prompt grounding the model to only the selected chapters. */
function buildMessages(
  board: BoardType,
  language: PaperLanguage,
  difficulty: PaperDifficulty,
  questionCount: number,
  chapters: { id: string; title: string; topics: string[] }[]
): GroqMessage[] {
  const boardLabel = board === 'CBSE' ? 'CBSE (2026-27 syllabus)' : 'AP State Board (SCERT Andhra Pradesh)';
  const chapterLines = chapters
    .map((c, i) => `${i + 1}. [${c.id}] ${c.title} — topics: ${c.topics.join(', ') || 'n/a'}`)
    .join('\n');

  const system =
    `You are an exam paper setter for Class 9 Mathematics (${boardLabel}). ` +
    `Create a complete question paper in ${language === 'TELUGU' ? 'Telugu (తెలుగు)' : 'English'} ` +
    `with difficulty "${difficulty}". ` +
    `Use ONLY the chapters and topics listed below — never invent chapters, never include any other class, subject or board, ` +
    `and keep every question within the Class 9 syllabus of the selected board. ` +
    `Respond with STRICT JSON only: {"instructions": string[], "questions": [{"number": number, "type": "MCQ"|"SHORT_ANSWER"|"LONG_ANSWER"|"NUMERICAL", "chapterId": string, "question": string, "options": string[], "answer": string, "marks": number}]}. ` +
    `Rules: exactly ${questionCount} questions; every chapterId must be one of the ids listed; ` +
    `MCQs need exactly 4 options (one clearly correct) and marks ${MARKS_BY_TYPE.MCQ}; ` +
    `NUMERICAL ${MARKS_BY_TYPE.NUMERICAL} marks; SHORT_ANSWER ${MARKS_BY_TYPE.SHORT_ANSWER} marks; LONG_ANSWER ${MARKS_BY_TYPE.LONG_ANSWER} marks. ` +
    `Provide a model "answer" for every question. Omit the "options" key for non-MCQ questions. ` +
    `instructions: 3-5 general exam instructions for students.`;

  const user = `Selected chapters:\n${chapterLines}\n\nTotal questions: ${questionCount}. Board: ${board}. Language: ${language}. Difficulty: ${difficulty}.`;

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

async function handleGenerate(req: NextRequest): Promise<NextResponse> {
  const auth = await requireRoles(['TEACHER', 'PLATFORM_ADMIN']);
  if ('error' in auth) return auth.error;

  let body: GeneratePaperBody;
  try {
    body = (await req.json()) as GeneratePaperBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!isBoard(body.board)) {
    return NextResponse.json({ error: 'board must be CBSE or AP_STATE_BOARD.' }, { status: 400 });
  }
  const board = body.board;

  if (
    !Array.isArray(body.chapterIds) ||
    body.chapterIds.length === 0 ||
    !body.chapterIds.every((id) => typeof id === 'string')
  ) {
    return NextResponse.json({ error: 'Select at least one chapter.' }, { status: 400 });
  }
  const chapterIds = body.chapterIds as string[];

  const difficulty: PaperDifficulty =
    typeof body.difficulty === 'string' && (DIFFICULTIES as string[]).includes(body.difficulty)
      ? (body.difficulty as PaperDifficulty)
      : 'MIXED';
  const language: PaperLanguage =
    typeof body.language === 'string' && (LANGUAGES as string[]).includes(body.language)
      ? (body.language as PaperLanguage)
      : 'ENGLISH';

  const requestedCount = Math.round(Number(body.questionCount));
  const questionCount = Number.isFinite(requestedCount)
    ? Math.min(MAX_QUESTIONS, Math.max(MIN_QUESTIONS, requestedCount))
    : 10;

  const title =
    typeof body.title === 'string' && body.title.trim()
      ? body.title.trim().slice(0, 200)
      : 'Class 9 Mathematics Question Paper';

  // Grounding: every chapter must exist in this board's Class 9 curriculum.
  const boardChapters = CLASS_9_CHAPTERS.filter((c) => c.board === board);
  const boardById = new Map(boardChapters.map((c) => [c.id, c]));
  const invalidIds = chapterIds.filter((id) => !boardById.has(id));
  if (invalidIds.length > 0) {
    return NextResponse.json(
      { error: `Unknown chapter(s) for ${board === 'CBSE' ? 'CBSE' : 'AP State Board'}: ${invalidIds.join(', ')}.` },
      { status: 400 }
    );
  }

  const selectedChapters = chapterIds.map((id) => boardById.get(id)!);
  const allowedChapterIds = new Set(chapterIds);
  const promptChapters = selectedChapters.map((c) => ({
    id: c.id,
    title: c.title,
    topics: (c.topics ?? []).slice(0, 20).map((t) => t.title).filter(Boolean),
  }));
  // AI call — runs inside withAiAudit, so failures are recorded as FAILED.
  const raw = await groqJson<{ instructions?: unknown; questions?: unknown }>(
    buildMessages(board, language, difficulty, questionCount, promptChapters)
  );

  const instructions = Array.isArray(raw.instructions)
    ? raw.instructions
        .filter((i): i is string => typeof i === 'string' && i.trim().length > 0)
        .map((i) => i.trim())
        .slice(0, 8)
    : [];
  const rawQuestions = Array.isArray(raw.questions) ? raw.questions : [];

  const questions: PaperQuestion[] = [];
  for (const rawQ of rawQuestions) {
    if (questions.length >= questionCount) break;
    const clean = sanitizeQuestion(rawQ, allowedChapterIds, questions.length + 1);
    if (clean) questions.push(clean);
  }

  if (questions.length === 0) {
    return NextResponse.json(
      { error: 'The AI could not produce questions from the selected chapters. Please try again.' },
      { status: 502 }
    );
  }

  const paper: QuestionPaper = {
    id: uuidv4(),
    title,
    board,
    className: 'Class 9',
    subject: 'Mathematics',
    language,
    difficulty,
    chapters: selectedChapters.map((c) => ({ id: c.id, title: c.title })),
    instructions: instructions.length > 0 ? instructions : DEFAULT_INSTRUCTIONS,
    questions,
    totalMarks: questions.reduce((sum, q) => sum + q.marks, 0),
    generatedAt: new Date().toISOString(),
  };

  return NextResponse.json({ paper, generatedCount: questions.length, requestedCount: questionCount });
}

export async function POST(req: NextRequest) {
  return withAiAudit('AI_QUESTION_PAPER', () => handleGenerate(req));
}
