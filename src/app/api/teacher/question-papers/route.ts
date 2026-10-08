import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '@/lib/db';
import { requireRoles } from '@/lib/authz';
import type { PaperQuestion, QuestionPaper } from '@/types';

// -----------------------------------------------------------------------------
// Saved question papers (Teacher) — additive CRUD over the question_papers table.
// Teachers only ever see/modify their own papers.
// -----------------------------------------------------------------------------

interface PaperRow {
  id: string;
  title: string;
  board: string;
  class_name: string;
  subject: string;
  language: string;
  difficulty: string;
  chapters_json: string;
  questions_json: string;
  instructions_json: string;
  total_marks: number;
  question_count: number;
  created_at: string;
}

function rowToPaper(row: PaperRow): QuestionPaper {
  const parse = <T>(json: string, fallback: T): T => {
    try {
      return JSON.parse(json) as T;
    } catch {
      return fallback;
    }
  };
  return {
    id: row.id,
    title: row.title,
    board: row.board === 'AP_STATE_BOARD' ? 'AP_STATE_BOARD' : 'CBSE',
    className: row.class_name,
    subject: row.subject,
    language: row.language === 'TELUGU' ? 'TELUGU' : 'ENGLISH',
    difficulty: (['EASY', 'MEDIUM', 'HARD', 'MIXED'].includes(row.difficulty)
      ? row.difficulty
      : 'MIXED') as QuestionPaper['difficulty'],
    chapters: parse<{ id: string; title: string }[]>(row.chapters_json, []),
    instructions: parse<string[]>(row.instructions_json, []),
    questions: parse<PaperQuestion[]>(row.questions_json, []),
    totalMarks: row.total_marks,
    generatedAt: row.created_at,
  };
}

/** Minimal structural validation before a paper is persisted. */
function validatePaper(body: unknown): QuestionPaper | null {
  if (typeof body !== 'object' || body === null) return null;
  const p = body as Record<string, unknown>;
  if (typeof p.title !== 'string' || !p.title.trim()) return null;
  if (!Array.isArray(p.questions) || p.questions.length === 0) return null;
  if (!p.questions.every((q) => typeof q === 'object' && q !== null && typeof (q as PaperQuestion).question === 'string')) {
    return null;
  }
  return p as unknown as QuestionPaper;
}

export async function GET() {
  const auth = await requireRoles(['TEACHER', 'PLATFORM_ADMIN']);
  if ('error' in auth) return auth.error;

  const rows = getDb()
    .prepare(
      `SELECT id, title, board, class_name, subject, language, difficulty, chapters_json,
              questions_json, instructions_json, total_marks, question_count, created_at
       FROM question_papers
       WHERE teacher_id = ?
       ORDER BY created_at DESC
       LIMIT 100`
    )
    .all(auth.actor.userId) as PaperRow[];

  return NextResponse.json({ papers: rows.map(rowToPaper) });
}

export async function POST(req: NextRequest) {
  const auth = await requireRoles(['TEACHER', 'PLATFORM_ADMIN']);
  if ('error' in auth) return auth.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const rawPaper = (body as { paper?: unknown })?.paper;
  const paper = validatePaper(rawPaper);
  if (!paper) {
    return NextResponse.json({ error: 'A valid generated paper is required to save.' }, { status: 400 });
  }

  const id = typeof paper.id === 'string' && paper.id ? paper.id : uuidv4();
  const questions = paper.questions;
  const totalMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

  getDb()
    .prepare(
      `INSERT INTO question_papers
        (id, teacher_id, school_id, title, board, class_name, subject, language, difficulty,
         chapters_json, questions_json, instructions_json, total_marks, question_count, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         title = excluded.title,
         board = excluded.board,
         language = excluded.language,
         difficulty = excluded.difficulty,
         chapters_json = excluded.chapters_json,
         questions_json = excluded.questions_json,
         instructions_json = excluded.instructions_json,
         total_marks = excluded.total_marks,
         question_count = excluded.question_count`
    )
    .run(
      id,
      auth.actor.userId,
      auth.actor.schoolId ?? null,
      paper.title.trim().slice(0, 200),
      paper.board === 'AP_STATE_BOARD' ? 'AP_STATE_BOARD' : 'CBSE',
      paper.className || 'Class 9',
      paper.subject || 'Mathematics',
      paper.language === 'TELUGU' ? 'TELUGU' : 'ENGLISH',
      paper.difficulty || 'MIXED',
      JSON.stringify(paper.chapters ?? []),
      JSON.stringify(questions),
      JSON.stringify(paper.instructions ?? []),
      totalMarks,
      questions.length,
      paper.generatedAt || new Date().toISOString()
    );

  return NextResponse.json({ id, saved: true });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireRoles(['TEACHER', 'PLATFORM_ADMIN']);
  if ('error' in auth) return auth.error;

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id query parameter is required.' }, { status: 400 });

  const result = getDb()
    .prepare('DELETE FROM question_papers WHERE id = ? AND teacher_id = ?')
    .run(id, auth.actor.userId);

  if (result.changes === 0) {
    return NextResponse.json({ error: 'Paper not found.' }, { status: 404 });
  }
  return NextResponse.json({ deleted: true });
}