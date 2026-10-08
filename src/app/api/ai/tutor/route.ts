import { NextRequest, NextResponse } from 'next/server';
import { groqJson } from '@/lib/groq';
import { withAiAudit } from '@/lib/ai-audit';

export async function POST(req: NextRequest) {
  return withAiAudit('AI_TUTOR', async () => {
    const body = await req.json().catch(() => null);
    const { topicTitle, studentQuestion, stepRequested, language } = body ?? {};
    if (typeof studentQuestion !== 'string' || !studentQuestion.trim()) {
      return NextResponse.json({ error: 'A student question is required.' }, { status: 400 });
    }
    if (studentQuestion.length > 4000) {
      return NextResponse.json({ error: 'The question is too long.' }, { status: 400 });
    }

    const prompt = `You are EduMathAI, an empathetic Class 9 Mathematics Tutor for CBSE and AP State Board.
Target Language: ${typeof language === 'string' ? language : 'ENGLISH'}.
Topic: ${typeof topicTitle === 'string' ? topicTitle.slice(0, 200) : 'Mathematics'}.
Student Question: ${studentQuestion.trim()}.
Step Requested: ${typeof stepRequested === 'string' ? stepRequested : 'STEP_BY_STEP'}.
Never invent missing work. Never answer mathematics as one long paragraph: use headed sections (### Given, ### Formula, ### Step 1, ### Step 2, ### Final Answer, ### Quick Explanation), one action per step with its WHY, simple Class 9-level words, and bold the final answer. Match geometry/word-problem/theory/comparison shapes (Given/To Find/Formula/Steps/Answer; Given/Understand/Formula/Substitute/Calculate/Answer; Definition/Explanation/Example/Key Points; markdown table + Final Answer). Give a clear pedagogical response and use LaTeX for math. Return JSON with string fields "content", "latex" and array "suggestedPrompts".`;
    const result = await groqJson<{ content?: string; latex?: string; suggestedPrompts?: string[] }>([
      { role: 'user', content: prompt },
    ]);
    if (typeof result.content !== 'string' || !result.content.trim()) {
      throw new Error('AI response is missing content.');
    }
    return NextResponse.json(result);
  });
}
