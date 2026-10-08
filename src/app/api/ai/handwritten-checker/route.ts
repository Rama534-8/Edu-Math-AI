import { NextRequest, NextResponse } from 'next/server';
import { normalizeHandwrittenResult } from '@/lib/ai-normalize';
import { AIServiceError, groqJson } from '@/lib/groq';
import { withAiAudit } from '@/lib/ai-audit';

export async function POST(req: NextRequest) {
  return withAiAudit('AI_HANDWRITTEN_CHECKER', async () => {
    const body = await req.json().catch(() => null);
    const image = body?.image;
    if (typeof image !== 'string' || !image.trim()) {
      return NextResponse.json({ error: 'An image is required.' }, { status: 400 });
    }
    if (image.length > 8_000_000 || !/^(data:image\/(png|jpe?g|webp);base64,)?[A-Za-z0-9+/=]+$/.test(image)) {
      return NextResponse.json({ error: 'The image is invalid or exceeds the upload limit.' }, { status: 400 });
    }

    const imageUrl = image.startsWith('data:image/') ? image : `data:image/jpeg;base64,${image}`;
    const prompt = `You are EduMathAI Handwritten Answer Sheet Evaluator for Class 9 Mathematics. Inspect the actual image; do not infer illegible writing.

Respond with a single JSON object using EXACTLY this schema and types:
{
  "isLegible": boolean,
  "extractedQuestionText": string,
  "detectedSteps": [{ "stepIndex": number, "rawText": string, "latexForm": string, "isCorrect": boolean, "mistakeType": string | null, "feedback": string }],
  "overallStatus": "CORRECT" | "PARTIAL" | "INCORRECT",
  "finalVerdict": string,
  "recommendedRevisionTopic": string
}
"detectedSteps" MUST be a JSON array, never a string. Transcribe the student's own writing in "rawText". Use mistakeType only when the step is wrong.`;

    const raw = await groqJson<Record<string, unknown>>([
      { role: 'user', content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: imageUrl } },
      ] },
    ], true);

    // Normalise so the UI always receives an array of steps and a valid
    // overallStatus, even if the provider reshapes or omits fields.
    const result = normalizeHandwrittenResult(raw);
    if (!result.isLegible && result.detectedSteps.length === 0) {
      throw new AIServiceError('The handwriting could not be read. Please upload a clearer photo.', 422);
    }
    return NextResponse.json(result);
  });
}
