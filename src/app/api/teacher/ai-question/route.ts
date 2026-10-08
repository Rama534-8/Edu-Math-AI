import { NextRequest, NextResponse } from 'next/server';
import { aiErrorResponse, groqJson, requireAIAuthentication } from '@/lib/groq';
import { requireRoles } from '@/lib/authz';
import { withAiAudit } from '@/lib/ai-audit';
import type { DifficultyLevel, Question, QuestionType } from '@/types';

/**
 * Teacher-only AI question generator.
 *
 * Returns a *structured, validated* question object so the Teacher AI Assistant
 * never has to scrape JSON out of natural-language model output. The student
 * endpoints (/api/ai/tutor, solver, handwritten-checker) are untouched.
 *
 * The model may answer with plain JSON, fenced JSON, or prose containing JSON.
 * groqJson() handles fenced/plain JSON and raises AIServiceError on malformed
 * output; this route additionally validates and normalises the fields we rely on.
 */

const VALID_DIFFICULTIES: DifficultyLevel[] = ['EASY', 'MEDIUM', 'HARD'];
const VALID_TYPES: QuestionType[] = ['MCQ', 'NUMERICAL', 'SHORT_ANSWER', 'TRUE_FALSE', 'FILL_BLANK'];

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Accept the first non-empty string among several plausible model key names. */
function pickString(source: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = asString(source[key]);
    if (value) return value;
  }
  return '';
}

async function handleGenerateQuestion(req: NextRequest): Promise<NextResponse> {
  try {
    // Teacher/Platform-admin only, and must be an active account.
    const auth = await requireRoles(['TEACHER', 'PLATFORM_ADMIN']);
    if ('error' in auth) return auth.error;
    await requireAIAuthentication();

    const body = (await req.json().catch(() => null)) as {
      topic?: unknown;
      targetMistake?: unknown;
      difficulty?: unknown;
    } | null;

    const topic = asString(body?.topic) || 'Mathematics';
    const targetMistake = asString(body?.targetMistake);
    const requestedDifficulty = asString(body?.difficulty).toUpperCase();
    const difficulty: DifficultyLevel = VALID_DIFFICULTIES.includes(
      requestedDifficulty as DifficultyLevel
    )
      ? (requestedDifficulty as DifficultyLevel)
      : 'MEDIUM';

    if (topic.length > 200 || targetMistake.length > 200) {
      return NextResponse.json({ error: 'Topic or mistake pattern is too long.' }, { status: 400 });
    }

    const prompt = `You are a Class 9 Mathematics question writer for the CBSE / AP State Board syllabus.
Write ONE ${difficulty} difficulty practice question.
Topic: ${topic}${targetMistake ? `\nTarget common mistake: ${targetMistake}` : ''}

Respond ONLY with a JSON object using exactly these keys:
{"questionText":"...","correctAnswer":"...","correctAnswerExplanation":"...","hint1":"...","latex":"..."}
Use LaTeX inside "latex" for any mathematical expression. Do not add any commentary.`;

    const raw = await groqJson<Record<string, unknown>>([
      { role: 'user', content: prompt },
    ]);

    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
      return NextResponse.json(
        { error: 'The AI returned an unexpected response shape. Please try again.' },
        { status: 502 }
      );
    }

    const questionText = pickString(raw, ['questionText', 'question', 'text', 'prompt']);
    const correctAnswer = pickString(raw, ['correctAnswer', 'answer', 'correct_answer']);

    // Validate the required fields before returning anything the UI will trust.
    if (!questionText || !correctAnswer) {
      return NextResponse.json(
        {
          error:
            'The AI response was missing required question fields (question text or correct answer). Please try again.',
        },
        { status: 502 }
      );
    }

    const requestedType = asString(raw.type).toUpperCase();
    const type: QuestionType = VALID_TYPES.includes(requestedType as QuestionType)
      ? (requestedType as QuestionType)
      : 'NUMERICAL';

    const question: Question = {
      id: `draft-q-${Date.now()}`,
      chapterId: 'ch-ai-generated',
      topicId: 'top-ai',
      type,
      difficulty,
      questionText,
      questionTextTelugu: pickString(raw, ['questionTextTelugu', 'questionTelugu']),
      latex: pickString(raw, ['latex', 'latexExpression']),
      correctAnswer,
      correctAnswerExplanation: pickString(raw, ['correctAnswerExplanation', 'explanation', 'solution']),
      hint1: pickString(raw, ['hint1', 'hint']),
      hint2: pickString(raw, ['hint2']),
      marks: 2,
      status: 'DRAFT',
    };

    return NextResponse.json({ question });
  } catch (error) {
    // aiErrorResponse keeps provider messages generic and never returns API keys.
    const result = aiErrorResponse(error);
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}

/**
 * Audited entry point: identical behaviour, plus one metadata-only row in
 * ai_audit_logs for the Admin AI Moderation dashboard.
 */
export async function POST(req: NextRequest) {
  return withAiAudit('AI_QUESTION_GENERATOR', () => handleGenerateQuestion(req));
}