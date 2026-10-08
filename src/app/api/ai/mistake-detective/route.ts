import { NextRequest, NextResponse } from 'next/server';
import { groqJson } from '@/lib/groq';
import { withAiAudit } from '@/lib/ai-audit';

export async function POST(req: NextRequest) {
  return withAiAudit('AI_MISTAKE_DETECTIVE', async () => {
    const body = await req.json().catch(() => null);
    const { questionText, studentAnswer, correctAnswer, chapterTitle } = body ?? {};
    if (typeof questionText !== 'string' || !questionText.trim() || typeof studentAnswer !== 'string' || !studentAnswer.trim()) {
      return NextResponse.json({ error: 'Question text and student answer are required.' }, { status: 400 });
    }
    if (questionText.length > 4000 || studentAnswer.length > 2000) {
      return NextResponse.json({ error: 'The submitted answer is too long.' }, { status: 400 });
    }

    const prompt = `You are EduMathAI Mistake Detective for Class 9 Mathematics. Analyze the student's actual work; do not invent answers or a practice question.\nQuestion: ${questionText}\nStudent answer: ${studentAnswer}\nExpected answer, if supplied: ${typeof correctAnswer === 'string' ? correctAnswer.slice(0, 500) : 'not supplied'}\nChapter: ${typeof chapterTitle === 'string' ? chapterTitle.slice(0, 200) : 'Mathematics'}\nClassify the error as one of CONCEPT_ERROR, CALCULATION_ERROR, SIGN_ERROR, FORMULA_ERROR, READING_ERROR, UNIT_ERROR, LOGIC_ERROR, CARELESS_ERROR, TIMEOUT, UNKNOWN. Return JSON with mistakeCategory, categoryLabel, whatWentWrong, whyItHappened, correctApproach, conceptToRevise, workedCorrectionSteps, and similarPracticeQuestion. If a similar question is not verifiable from provided material, return null for it.`;
    const result = await groqJson<Record<string, unknown>>([{ role: 'user', content: prompt }]);
    if (typeof result.whatWentWrong !== 'string' || typeof result.correctApproach !== 'string') {
      throw new Error('AI response is incomplete.');
    }
    return NextResponse.json(result);
  });
}
