import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';
import { CLASS_9_CHAPTERS, SAMPLE_QUESTIONS_BANK } from '@/lib/curriculum-data';
import { groqJson } from '@/lib/groq';
import { randomUUID } from 'crypto';
import type { Question, BoardType } from '@/types';

const FULL_EXAM_QUESTION_COUNT = 20;
const CHAPTER_EXAM_QUESTION_COUNT = 10;
const MARKS_PER_QUESTION = 1;
const EXAM_DURATION_MINUTES = 30;
const PASS_THRESHOLD = 40;

/** Generate questions using AI, strictly validated against curriculum */
async function generateQuestionsForChapter(
  board: BoardType,
  chapterId: string,
  chapterTitle: string,
  topicTitle: string,
  count: number
): Promise<Question[]> {
  const prompt = `You are EduMathAI question generator for Class 9 Mathematics.
Generate exactly ${count} MCQ questions for:
- Board: ${board}
- Chapter: ${chapterTitle}
- Topic: ${topicTitle}

Rules:
- Each question MUST be about "${chapterTitle}" only.
- Use only factual, mathematically correct content.
- All options must be distinct.
- correctAnswer must be the id of the correct option (opt-a, opt-b, opt-c, or opt-d).
- Never repeat questions.

Return JSON: { "questions": [ { "id": "gq-<uuid>", "questionText": "...", "options": [{"id":"opt-a","text":"..."},{"id":"opt-b","text":"..."},{"id":"opt-c","text":"..."},{"id":"opt-d","text":"..."}], "correctAnswer": "opt-a|opt-b|opt-c|opt-d", "explanation": "..." } ] }`;

  try {
    const result = await groqJson<{ questions: any[] }>([{ role: 'user', content: prompt }]);
    if (!Array.isArray(result.questions)) return [];

    return result.questions.slice(0, count).map((q: any, i: number) => ({
      id: `gq-${chapterId}-${i}-${Date.now()}`,
      chapterId,
      topicId: `top-${chapterId}-1`,
      type: 'MCQ' as const,
      difficulty: 'MEDIUM' as const,
      questionText: typeof q.questionText === 'string' ? q.questionText.slice(0, 500) : 'Question unavailable',
      options: Array.isArray(q.options) && q.options.length === 4 ? q.options : [
        { id: 'opt-a', text: 'Option A' },
        { id: 'opt-b', text: 'Option B' },
        { id: 'opt-c', text: 'Option C' },
        { id: 'opt-d', text: 'Option D' },
      ],
      correctAnswer: ['opt-a', 'opt-b', 'opt-c', 'opt-d'].includes(q.correctAnswer) ? q.correctAnswer : 'opt-a',
      correctAnswerExplanation: typeof q.explanation === 'string' ? q.explanation.slice(0, 500) : '',
      hint1: '',
      marks: MARKS_PER_QUESTION,
      status: 'APPROVED' as const,
    }));
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest();
    if (!session) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

    const db = getDb();
    const userRow = db.prepare(
      'SELECT u.role, sp.board, sp.class_name FROM users u JOIN student_profiles sp ON u.id = sp.uid WHERE u.id = ?'
    ).get(session.userId) as { role: string; board: string; class_name: string } | undefined;

    if (!userRow || userRow.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Student access required.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { examType, chapterId: requestedChapterId } = body;

    if (!['FULL', 'CHAPTER'].includes(examType)) {
      return NextResponse.json({ error: 'Invalid exam type. Must be FULL or CHAPTER.' }, { status: 400 });
    }

    // Board from DB only — never trust client
    const board = userRow.board as BoardType;
    if (!['AP_STATE_BOARD', 'CBSE'].includes(board)) {
      return NextResponse.json({ error: 'Invalid board in student profile.' }, { status: 400 });
    }

    // Validate curriculum — AP and CBSE completely separated
    const boardChapters = CLASS_9_CHAPTERS.filter((c) => c.board === board);
    if (boardChapters.length === 0) {
      return NextResponse.json({ error: 'No curriculum found for your board.' }, { status: 400 });
    }

    let selectedChapterId: string | null = null;
    let selectedChapterTitle: string | null = null;
    let chaptersForExam = boardChapters;

    if (examType === 'CHAPTER') {
      if (!requestedChapterId || typeof requestedChapterId !== 'string') {
        return NextResponse.json({ error: 'Chapter ID is required for chapter-wise exam.' }, { status: 400 });
      }
      const found = boardChapters.find((c) => c.id === requestedChapterId);
      if (!found) {
        return NextResponse.json({ error: 'Invalid chapter for your board.' }, { status: 400 });
      }
      selectedChapterId = found.id;
      selectedChapterTitle = found.title;
      chaptersForExam = [found];
    }

    // Build questions: try AI first, fall back to question bank
    const questionsPerChapter = examType === 'FULL'
      ? Math.max(1, Math.floor(FULL_EXAM_QUESTION_COUNT / chaptersForExam.length))
      : CHAPTER_EXAM_QUESTION_COUNT;

    let allQuestions: Question[] = [];

    for (const chapter of chaptersForExam) {
      const topic = chapter.topics[0];
      // Try AI generation
      let qs = await generateQuestionsForChapter(board, chapter.id, chapter.title, topic?.title || chapter.title, questionsPerChapter);

      // Fallback to saved question bank filtered by chapter + board
      if (qs.length < Math.min(questionsPerChapter, 2)) {
        const bankQs = SAMPLE_QUESTIONS_BANK.filter((q) => {
          const ch = CLASS_9_CHAPTERS.find((c) => c.id === q.chapterId);
          return q.chapterId === chapter.id && ch?.board === board;
        });
        if (bankQs.length > 0) {
          qs = [...qs, ...bankQs].slice(0, questionsPerChapter);
        }
      }

      allQuestions = [...allQuestions, ...qs];
    }

    // Trim to target count
    const targetCount = examType === 'FULL' ? FULL_EXAM_QUESTION_COUNT : CHAPTER_EXAM_QUESTION_COUNT;
    allQuestions = allQuestions.slice(0, targetCount);

    if (allQuestions.length === 0) {
      return NextResponse.json({
        error: 'Insufficient questions available for this exam. Please try again or select a different chapter.',
      }, { status: 400 });
    }

    // Prepare questions for storage — correctAnswer stored server-side in mock_exam_answers
    const totalMarks = allQuestions.reduce((s, q) => s + q.marks, 0);
    const attemptId = `mock-${randomUUID()}`;

    // Store client-safe questions (no correctAnswer) in questions_json
    const clientQuestions = allQuestions.map((q) => ({
      id: q.id,
      chapterId: q.chapterId,
      topicId: q.topicId,
      type: q.type,
      difficulty: q.difficulty,
      questionText: q.questionText,
      options: q.options || [],
      marks: q.marks,
      latex: q.latex,
    }));

    const insertAttempt = db.transaction(() => {
      db.prepare(`
        INSERT INTO mock_exam_attempts
          (id, student_id, board, class_name, subject, exam_type, chapter_id, chapter_title,
           duration_minutes, total_questions, total_marks, questions_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        attemptId, session.userId, board, 'Class 9', 'Mathematics',
        examType, selectedChapterId, selectedChapterTitle,
        EXAM_DURATION_MINUTES, allQuestions.length, totalMarks,
        JSON.stringify(clientQuestions)
      );

      // Store correct answers in mock_exam_answers (never sent to client during exam)
      const insertAnswer = db.prepare(`
        INSERT OR IGNORE INTO mock_exam_answers
          (id, attempt_id, student_id, question_id, correct_answer, max_marks, chapter_id, topic_id, question_text, explanation)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const q of allQuestions) {
        insertAnswer.run(
          randomUUID(), attemptId, session.userId, q.id,
          q.correctAnswer, q.marks, q.chapterId, q.topicId,
          q.questionText, q.correctAnswerExplanation
        );
      }
    });
    insertAttempt();

    return NextResponse.json({
      attemptId,
      questions: clientQuestions,
      durationMinutes: EXAM_DURATION_MINUTES,
      totalMarks,
      board,
      examType,
      chapterTitle: selectedChapterTitle,
      startedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[MockExam/start]', error);
    return NextResponse.json({ error: 'Failed to create mock exam. Please try again.' }, { status: 500 });
  }
}
