import 'server-only';
import { requireAuth, type Actor } from '@/lib/authz';

type GroqTextPart = { type: 'text'; text: string };
type GroqImagePart = { type: 'image_url'; image_url: { url: string } };
export type GroqMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<GroqTextPart | GroqImagePart>;
};

export class AIServiceError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'AIServiceError';
  }
}

export async function requireAIAuthentication(): Promise<Actor> {
  const auth = await requireAuth();
  if ('error' in auth) {
    throw new AIServiceError(
      auth.error.status === 403 ? 'Account is not active.' : 'Authentication is required.',
      auth.error.status
    );
  }
  return auth.actor;
}

/**
 * Models used when the configured id is rejected (404 / model-specific 400).
 * These are long-lived Groq workhorses, deliberately different from whatever
 * an admin may have configured, so the retry actually tries another model.
 */
const FALLBACK_TEXT_MODEL = 'llama-3.3-70b-versatile';
const FALLBACK_VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

export async function groqJson<T>(messages: GroqMessage[], vision = false): Promise<T> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new AIServiceError('AI service is not configured.', 503);
  }

  const configuredModel = vision
    ? process.env.GROQ_VISION_MODEL
    : process.env.GROQ_TEXT_MODEL;
  if (!configuredModel) {
    throw new AIServiceError(
      vision
        ? 'AI image service is not configured with an available vision model. Set GROQ_VISION_MODEL in .env.local.'
        : 'AI service is not configured. Set GROQ_TEXT_MODEL in .env.local.',
      503
    );
  }

  const fallbackModel = vision ? FALLBACK_VISION_MODEL : FALLBACK_TEXT_MODEL;
  /** Model id actually sent to the provider; may differ from the configured one. */
  let model = configuredModel;

  const send = async (useJsonMode: boolean, targetModel: string): Promise<Response> =>
    fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: targetModel,
        messages,
        temperature: 0.2,
        // Vision models accept json_object alongside image parts, so both text
        // and vision requests are constrained to a JSON body. The parsing below
        // still tolerates fenced/plain JSON for providers that ignore this.
        ...(useJsonMode ? { response_format: { type: 'json_object' } } : {}),
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(30_000),
    });

  /** Normalised provider result: the body is already consumed, so keep it. */
  type AttemptResult = { status: number; ok: boolean; body: string };

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const read = async (res: Response): Promise<AttemptResult> => ({
    status: res.status,
    ok: res.ok,
    body: await res.text().catch(() => ''),
  });

  /** One model: JSON mode first, then plain, since some models reject json_object. */
  const attempt = async (targetModel: string, include429Retry: boolean): Promise<AttemptResult> => {
    let result = await read(await send(true, targetModel));
    if (result.status === 400) {
      result = await read(await send(false, targetModel));
    }
    // Transient rate-limit: one short backoff retry so a single 429 does not
    // surface as "AI service is busy" to the student.
    if (include429Retry && result.status === 429) {
      await sleep(1200);
      result = await read(await send(true, targetModel));
      if (result.status === 400) {
        result = await read(await send(false, targetModel));
      }
    }
    return result;
  };

  /** True only when the provider refused the model id itself (not the payload). */
  const modelRejected = (result: AttemptResult): boolean =>
    result.status === 404 || (result.status === 400 && /\bmodel\b|endpoint/i.test(result.body));

  let response: AttemptResult;
  try {
    response = await attempt(configuredModel, true);
    // 404 = "No endpoints found for <model>", 400 = the id itself was refused.
    // Retry once with the known-good model rather than failing the feature.
    if (modelRejected(response) && configuredModel !== fallbackModel) {
      response = await attempt(fallbackModel, false);
      if (response.ok) {
        model = fallbackModel;
        console.warn('[Groq API] Configured model rejected; using fallback', {
          configuredModel,
          fallbackModel,
          vision,
        });
      }
    }
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'TimeoutError';
    throw new AIServiceError(timedOut ? 'AI request timed out.' : 'AI provider is unavailable.', timedOut ? 504 : 502);
  }

  if (!response.ok) {
    console.error('[Groq API] Provider request failed', {
      model,
      configuredModel,
      vision,
      status: response.status,
      // The provider body contains only error metadata (no credentials).
      providerError: response.body.slice(0, 400),
    });
    if (response.status === 429) {
      throw new AIServiceError('AI service is busy. Please try again shortly.', 429);
    }
    if (modelRejected(response)) {
      throw new AIServiceError(
        `AI provider rejected the configured model "${configuredModel}"${configuredModel === model ? '' : ` (and the fallback "${model}")`}. Check GROQ_${vision ? 'VISION' : 'TEXT'}_MODEL in .env.local.`,
        502
      );
    }
    if (vision && /pixel|dimension|image/i.test(response.body)) {
      throw new AIServiceError(
        'That image cannot be processed — it must be at least 32×32 pixels. Please upload a clearer photo.',
        422
      );
    }
    throw new AIServiceError('AI provider request failed.', 502);
  }

  let content: unknown;
  try {
    const payload = JSON.parse(response.body) as {
      choices?: { message?: { content?: unknown } }[];
    };
    content = payload.choices?.[0]?.message?.content;
  } catch {
    throw new AIServiceError('AI provider returned an invalid response.', 502);
  }

  if (typeof content !== 'string') {
    throw new AIServiceError('AI provider returned an empty response.', 502);
  }

  // Models sometimes wrap JSON in ```json fences, add a sentence before/after,
  // or escape characters oddly. Try strict first, then progressively looser
  // repairs before giving up — a 502 here is what surfaces to the student as
  // "AI provider returned malformed JSON".
  const candidates: string[] = [];
  const trimmed = content.trim();
  candidates.push(trimmed);
  const unescapedQuotes = trimmed
    .replace(/\\"/g, '"')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, ' ');
  if (unescapedQuotes !== trimmed) candidates.push(unescapedQuotes);
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) candidates.push(fenced[1].trim());
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    candidates.push(trimmed.slice(firstBrace, lastBrace + 1));
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as T;
    } catch {
      // try the next, looser repair
    }
  }
  console.error('[Groq API] Unparseable model content', {
    model,
    preview: content.slice(0, 500),
  });
  throw new AIServiceError('AI provider returned malformed JSON.', 502);
}

export function aiErrorResponse(error: unknown): { error: string; status: number } {
  if (error instanceof AIServiceError) {
    return { error: error.message, status: error.status };
  }
  return { error: 'AI request failed. Please try again.', status: 500 };
}
