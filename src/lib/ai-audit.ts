import 'server-only';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '@/lib/db';
import { aiErrorResponse, requireAIAuthentication } from '@/lib/groq';
import type { Actor } from '@/lib/session';

/**
 * Central AI audit logging for the Admin AI Moderation module.
 *
 * Every AI feature route wraps its handler in `withAiAudit`, which:
 *   1. authenticates the caller (same messages/status codes as before),
 *   2. runs the original handler unchanged,
 *   3. records one metadata-only audit row (feature, actor, status, duration).
 *
 * Safety rules:
 *   - Only metadata is stored - no prompts, message content, images,
 *     passwords, tokens or API keys ever reach this table.
 *   - moderation_status stays NOT_EVALUATED unless a real moderation result
 *     exists; the dashboard must label such rows "Not evaluated".
 *   - Auditing must never break an AI feature: recording failures are
 *     caught and logged to the server console only.
 */

export const AI_FEATURES = [
  'AI_CHAT',
  'AI_SOLVER',
  'AI_HANDWRITTEN_CHECKER',
  'AI_TUTOR',
  'AI_MISTAKE_DETECTIVE',
  'AI_STUDY_PLANNER',
  'AI_QUESTION_GENERATOR',
  'AI_QUESTION_PAPER',
] as const;

export type AiFeature = (typeof AI_FEATURES)[number];
export type AiRequestStatus = 'SUCCESS' | 'FAILED' | 'REJECTED';
export type AiModerationStatus = 'NOT_EVALUATED' | 'SAFE' | 'FLAGGED';

export interface AiAuditEntry {
  actor: Actor | null;
  feature: AiFeature;
  httpStatus: number;
  durationMs: number;
  reason?: string | null;
}

function classifyRequestStatus(httpStatus: number): AiRequestStatus {
  if (httpStatus < 400) return 'SUCCESS';
  if (httpStatus === 401 || httpStatus === 403) return 'REJECTED';
  return 'FAILED';
}

/** Insert one audit row. Never throws. */
export async function recordAiAudit(entry: AiAuditEntry): Promise<void> {
  try {
    const db = getDb();
    db.prepare(`
      INSERT INTO ai_audit_logs
        (id, user_id, user_email, role, feature, request_status, http_status,
         moderation_status, flagged, reason, duration_ms)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'NOT_EVALUATED', 0, ?, ?)
    `).run(
      uuidv4(),
      entry.actor?.userId ?? null,
      entry.actor?.email ?? null,
      entry.actor?.role ?? null,
      entry.feature,
      classifyRequestStatus(entry.httpStatus),
      entry.httpStatus,
      entry.reason ? entry.reason.slice(0, 1000) : null,
      Math.max(0, Math.round(entry.durationMs))
    );
  } catch (error) {
    console.error('[AI audit] Failed to record audit entry:', error);
  }
}

/** Best-effort extraction of the `error` field from an error response body. */
async function extractErrorReason(res: NextResponse): Promise<string | null> {
  try {
    const body = (await res.clone().json()) as { error?: unknown };
    return typeof body.error === 'string' ? body.error : null;
  } catch {
    return null;
  }
}

/**
 * Run an AI feature handler with authentication and audit logging.
 * Authentication behaviour (status codes and messages) is identical to the
 * previous inline `requireAIAuthentication()` calls.
 */
export async function withAiAudit(
  feature: AiFeature,
  handler: (actor: Actor) => Promise<NextResponse>
): Promise<NextResponse> {
  const startedAt = Date.now();
  let actor: Actor | null = null;
  try {
    actor = await requireAIAuthentication();
    const res = await handler(actor);
    const reason = res.status >= 400 ? await extractErrorReason(res) : null;
    await recordAiAudit({
      actor,
      feature,
      httpStatus: res.status,
      durationMs: Date.now() - startedAt,
      reason,
    });
    return res;
  } catch (error) {
    const result = aiErrorResponse(error);
    await recordAiAudit({
      actor,
      feature,
      httpStatus: result.status,
      durationMs: Date.now() - startedAt,
      reason: result.error,
    });
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
}
