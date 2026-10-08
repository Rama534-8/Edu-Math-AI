import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { getDb } from '@/lib/db';
import { randomUUID } from 'crypto';

type IncomingQuestion = Record<string, unknown>;

interface PreparedQuestion {
  questionText: string;
  options: string | null;
  answer: string;
  marks: number;
  explanation: string | null;
}

function getMarks(question: IncomingQuestion): number {
  const marks = question.marks;
  return typeof marks === 'number' && Number.isFinite(marks) && marks > 0 ? marks : 2;
}

function getExplanation(question: IncomingQuestion): string | null {
  for (const key of ['correctAnswerExplanation', 'explanation'] as const) {
    const value = question[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

/**
 * `quiz_questions.options` is stored as a JSON string array and the drill-down
 * view compares `correct_answer` against those exact strings. Question-bank
 * items carry `{ id, text }` option objects with `correctAnswer` holding the
 * option *id*, so both shapes are flattened here to keep the highlight truthful.
 */
function normaliseOptions(question: IncomingQuestion): { texts: string[]; answer: string } {
  const answer = typeof question.correctAnswer === 'string' ? question.correctAnswer.trim() : '';
  const raw = question.options;
  if (!Array.isArray(raw)) return { texts: [], answer };

  const texts: string[] = [];
  const textById = new Map<string, string>();
  for (const item of raw as unknown[]) {
    if (typeof item === 'string') {
      if (item.trim()) texts.push(item.trim());
      continue;
    }
    if (!item || typeof item !== 'object') continue;
    const option = item as IncomingQuestion;
    const text = typeof option.text === 'string' ? option.text.trim() : '';
    if (!text) continue;
    texts.push(text);
    if (typeof option.id === 'string') textById.set(option.id, text);
  }
  return { texts, answer: textById.get(answer) ?? answer };
}

function prepareQuestions(input: unknown[]): PreparedQuestion[] {
  const prepared: PreparedQuestion[] = [];
  for (const item of input) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const question = item as IncomingQuestion;
    const questionText = typeof question.questionText === 'string' ? question.questionText.trim() : '';
    if (!questionText) continue;
    const { texts, answer } = normaliseOptions(question);
    prepared.push({
      questionText,
      options: texts.length > 0 ? JSON.stringify(texts) : null,
      answer,
      marks: getMarks(question),
      explanation: getExplanation(question),
    });
  }
  return prepared;
}

export async function POST(req: Request) {
  try {
    const session = await getSessionFromRequest();
    if (!session || session.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as {
      questions?: unknown;
      title?: unknown;
      sectionId?: unknown;
    } | null;

    const questions: unknown[] = Array.isArray(body?.questions) ? body.questions : [];
    const title = typeof body?.title === 'string' && body.title.trim() ? body.title.trim() : '';
    const sectionId = typeof body?.sectionId === 'string' && body.sectionId ? body.sectionId : '';

    const prepared = prepareQuestions(questions);
    if (prepared.length === 0) {
      return NextResponse.json({ error: 'No questions provided.' }, { status: 400 });
    }

    const db = getDb();

    // Resolve sectionId: use provided one, or fall back to teacher's first assigned section
    let resolvedSectionId: string | null = sectionId || null;
    if (!resolvedSectionId) {
      const firstSection = db.prepare(
        'SELECT section_id FROM teacher_assignments WHERE teacher_id = ? LIMIT 1'
      ).get(session.userId) as { section_id: string } | undefined;
      resolvedSectionId = firstSection?.section_id || null;
    }

    if (!resolvedSectionId) {
      return NextResponse.json({ error: 'No section found. Ask your admin to assign you to a class.' }, { status: 400 });
    }

    // Verify ownership
    const authorized = db.prepare(
      'SELECT id FROM teacher_assignments WHERE teacher_id = ? AND section_id = ?'
    ).get(session.userId, resolvedSectionId);
    if (!authorized) {
      return NextResponse.json({ error: 'Not authorized for this section.' }, { status: 403 });
    }

    const quizId = randomUUID();
    const totalMarks = prepared.reduce((sum, q) => sum + q.marks, 0);
    db.prepare('INSERT INTO quizzes (id, teacher_id, section_id, title, subject, total_marks) VALUES (?, ?, ?, ?, ?, ?)')
      .run(quizId, session.userId, resolvedSectionId, title || 'AI Generated Quiz', 'Mathematics', totalMarks);

    // The drill-down view (/api/teacher/quizzes/[id]) reads `options` and
    // `explanation`, so both have to be written here or approved questions lose
    // their choices and reasoning as soon as they are saved.
    try {
      const cols = new Set(
        (db.prepare('PRAGMA table_info(quiz_questions)').all() as { name: string }[]).map((c) => c.name)
      );
      if (!cols.has('explanation')) {
        db.exec('ALTER TABLE quiz_questions ADD COLUMN explanation TEXT');
      }
    } catch (migrationError) {
      console.warn('[Quiz Save] explanation column migration skipped', migrationError);
    }

    const stmt = db.prepare(
      'INSERT INTO quiz_questions (id, quiz_id, question_text, options, correct_answer, marks, explanation) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    for (const q of prepared) {
      stmt.run(randomUUID(), quizId, q.questionText, q.options, q.answer, q.marks, q.explanation);
    }

    return NextResponse.json({ success: true, quizId });
  } catch (err) {
    console.error('[Quiz Save]', err);
    return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
  }
}
