import { normalizeHandwrittenResult, normalizeSolverResult, SolverResult } from '@/lib/ai-normalize';
import { AskTutorParams, AnalyzeMistakeParams, MistakeAnalysisResult, HandwrittenCheckResult, AIMessage, BoardType } from '@/types';

/**
 * Raised when the AI API itself is reachable but returned an error.
 * The message comes from the server route (never from a provider SDK), so it is
 * safe to show in the UI and never contains credentials.
 */
export class AIServiceRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'AIServiceRequestError';
  }
}

/** Used only when the browser cannot reach the API route at all. */
const NETWORK_ERROR_MESSAGE =
  'Could not reach the AI service. Please check your connection and try again.';

/**
 * Reads the JSON error returned by an /api/ai route and rethrows it.
 * This keeps the real, actionable reason (for example a misconfigured model)
 * instead of replacing every failure with one generic message.
 */
async function throwApiError(res: Response): Promise<never> {
  let message = '';
  try {
    const payload = await res.json();
    if (payload && typeof payload.error === 'string') {
      message = payload.error;
    }
  } catch {
    // Non-JSON error body; fall back to the status text below.
  }
  throw new AIServiceRequestError(
    message || `AI request failed (HTTP ${res.status}). Please try again.`,
    res.status
  );
}

/** Normalises fetch/parse failures into a readable, non-leaky error. */
async function toServiceError(error: unknown): Promise<never> {
  if (error instanceof AIServiceRequestError) {
    throw error;
  }
  console.error('[AI client] request failed before a server response was read', error);
  throw new AIServiceRequestError(NETWORK_ERROR_MESSAGE, 0);
}

export async function askTutorAI(params: AskTutorParams) {
  try {
    const res = await fetch('/api/ai/tutor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (res.ok) {
      return await res.json();
    }
    return await throwApiError(res);
  } catch (error) {
    return toServiceError(error);
  }
}

export async function analyzeMistakeWithAI(params: AnalyzeMistakeParams): Promise<MistakeAnalysisResult> {
  try {
    const res = await fetch('/api/ai/mistake-detective', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (res.ok) {
      return await res.json();
    }
    return await throwApiError(res);
  } catch (error) {
    return toServiceError(error);
  }
}

export async function solveMathImageWithAI(
  imageDataBase64: string,
  language: 'ENGLISH' | 'TELUGU' = 'ENGLISH'
): Promise<SolverResult> {
  try {
    const res = await fetch('/api/ai/solver', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageDataBase64, language }),
    });
    if (res.ok) {
      // Normalise client-side too, so the page can rely on array/string fields
      // even if an older or cached route response slips through.
      return normalizeSolverResult(await res.json());
    }
    return await throwApiError(res);
  } catch (error) {
    return toServiceError(error);
  }
}

export async function checkHandwrittenAnswerWithAI(imageDataBase64: string): Promise<HandwrittenCheckResult> {
  try {
    const res = await fetch('/api/ai/handwritten-checker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageDataBase64 }),
    });
    if (res.ok) {
      return normalizeHandwrittenResult(await res.json());
    }
    return await throwApiError(res);
  } catch (error) {
    return toServiceError(error);
  }
}

export async function sendChatMessageToAI(
  conversationHistory: AIMessage[],
  userMessage: string,
  context?: {
    chapterTitle?: string;
    topicTitle?: string;
    language?: 'ENGLISH' | 'TELUGU';
    board?: BoardType;
  }
): Promise<AIMessage> {
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: conversationHistory,
        newMessage: userMessage,
        context,
      }),
    });
    if (res.ok) {
      return await res.json();
    }
    return await throwApiError(res);
  } catch (error) {
    return toServiceError(error);
  }
}
