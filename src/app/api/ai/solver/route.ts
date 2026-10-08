import { NextRequest, NextResponse } from 'next/server';
import { normalizeSolverResult } from '@/lib/ai-normalize';
import { AIServiceError, groqJson } from '@/lib/groq';
import { withAiAudit } from '@/lib/ai-audit';

export async function POST(req: NextRequest) {
  return withAiAudit('AI_SOLVER', async () => {
    const body = await req.json().catch(() => null);
    const { image, language } = body ?? {};
    if (typeof image !== 'string' || !image.trim()) {
      return NextResponse.json({ error: 'An image is required.' }, { status: 400 });
    }
    if (image.length > 8_000_000 || !/^(data:image\/(png|jpe?g|webp);base64,)?[A-Za-z0-9+/=]+$/.test(image)) {
      return NextResponse.json({ error: 'The image is invalid or exceeds the upload limit.' }, { status: 400 });
    }

    const imageUrl = image.startsWith('data:image/') ? image : `data:image/jpeg;base64,${image}`;
    const prompt = `You are EduMathAI Image Maths Solver for Class 9 Mathematics. Target language: ${typeof language === 'string' ? language : 'ENGLISH'}. Inspect the image. If it is blurry, incomplete, or not a math problem, set isReadable false and do not guess. Otherwise extract the question, identify its concept, show a rigorous step-by-step solution, give the final answer, and provide similar questions.

Respond with a single JSON object using EXACTLY this schema and types:
{
  "isReadable": boolean,
  "unreadableReason": string | null,
  "extractedQuestion": string,
  "concept": string,
  "stepByStepSolution": [{ "step": number, "text": string, "latex": string }],
  "finalAnswer": string,
  "similarQuestions": [string]
}
"stepByStepSolution" and "similarQuestions" MUST be JSON arrays, never strings. Put all reasoning in "text" and any LaTeX for that step in "latex".`;
    const raw = await groqJson<Record<string, unknown>>([
      { role: 'user', content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: imageUrl } },
      ] },
    ], true);

    // The provider is free to reshape fields (for example returning the steps
    // as one numbered string), so coerce the payload into the exact shape the
    // UI renders instead of trusting it.
    const result = normalizeSolverResult(raw);
    if (!result.isReadable && !result.unreadableReason) {
      throw new AIServiceError('The image could not be read. Please upload a clearer photo.', 422);
    }
    return NextResponse.json(result);
  });
}
