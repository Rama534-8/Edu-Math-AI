import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireRoles } from '@/lib/authz';
import { AI_FEATURES } from '@/lib/ai-audit';

/**
 * Admin-only AI audit log browser for the AI Moderation dashboard.
 *
 * Serves metadata only (feature, actor snapshot, statuses, timing). No
 * passwords, tokens, API keys, prompts or response bodies are stored in or
 * served from ai_audit_logs.
 *
 * Query parameters:
 *   id         return a single record (detail view)
 *   feature    exact feature filter, e.g. AI_CHAT
 *   status     SUCCESS | FAILED | REJECTED
 *   moderation NOT_EVALUATED | SAFE | FLAGGED
 *   from       YYYY-MM-DD (inclusive, UTC)
 *   to         YYYY-MM-DD (inclusive, UTC)
 *   limit      1..500 (default 100)
 *   offset     >= 0
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const REQUEST_STATUSES = new Set(['SUCCESS', 'FAILED', 'REJECTED']);
const MODERATION_STATUSES = new Set(['NOT_EVALUATED', 'SAFE', 'FLAGGED']);

interface AuditRow {
  id: string;
  created_at: string;
  user_id: string | null;
  user_email: string | null;
  role: string | null;
  feature: string;
  request_status: string;
  http_status: number | null;
  moderation_status: string;
  flagged: number;
  reason: string | null;
  duration_ms: number | null;
}

function shape(row: AuditRow) {
  return {
    id: row.id,
    createdAt: row.created_at,
    userId: row.user_id,
    userEmail: row.user_email,
    role: row.role,
    feature: row.feature,
    requestStatus: row.request_status,
    httpStatus: row.http_status,
    moderationStatus: row.moderation_status,
    flagged: row.flagged === 1,
    reason: row.reason,
    durationMs: row.duration_ms,
  };
}

export async function GET(req: Request) {
  try {
    const auth = await requireRoles(['PLATFORM_ADMIN']);
    if ('error' in auth) return auth.error;

    const db = getDb();
    const url = new URL(req.url);

    // --- Detail view -------------------------------------------------------
    const id = url.searchParams.get('id');
    if (id) {
      const row = db.prepare('SELECT * FROM ai_audit_logs WHERE id = ?').get(id) as AuditRow | undefined;
      if (!row) {
        return NextResponse.json({ error: 'Audit record not found.' }, { status: 404 });
      }
      return NextResponse.json({ log: shape(row) });
    }

    // --- Filters -----------------------------------------------------------
    const clauses: string[] = [];
    const params: (string | number)[] = [];

    const feature = url.searchParams.get('feature');
    if (feature && (AI_FEATURES as readonly string[]).includes(feature)) {
      clauses.push('feature = ?');
      params.push(feature);
    }

    const status = url.searchParams.get('status');
    if (status && REQUEST_STATUSES.has(status)) {
      clauses.push('request_status = ?');
      params.push(status);
    }

    const moderation = url.searchParams.get('moderation');
    if (moderation && MODERATION_STATUSES.has(moderation)) {
      clauses.push('moderation_status = ?');
      params.push(moderation);
    }

    const from = url.searchParams.get('from');
    if (from && DATE_RE.test(from)) {
      clauses.push('created_at >= ?');
      params.push(`${from} 00:00:00`);
    }

    const to = url.searchParams.get('to');
    if (to && DATE_RE.test(to)) {
      clauses.push('created_at <= ?');
      params.push(`${to} 23:59:59`);
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';

    const limitRaw = Number.parseInt(url.searchParams.get('limit') ?? '', 10);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 500) : 100;
    const offsetRaw = Number.parseInt(url.searchParams.get('offset') ?? '', 10);
    const offset = Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0;

    // --- List --------------------------------------------------------------
    const rows = db
      .prepare(`SELECT * FROM ai_audit_logs ${where} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`)
      .all(...params, limit, offset) as AuditRow[];

    const total = (db.prepare(`SELECT COUNT(*) AS c FROM ai_audit_logs ${where}`).get(...params) as { c: number }).c;

    // --- Global summary (unfiltered overview cards) -------------------------
    const summaryRow = db
      .prepare(`
        SELECT
          COUNT(*) AS total,
          COALESCE(SUM(CASE WHEN request_status = 'SUCCESS' THEN 1 ELSE 0 END), 0) AS success,
          COALESCE(SUM(CASE WHEN request_status = 'FAILED' THEN 1 ELSE 0 END), 0) AS failed,
          COALESCE(SUM(CASE WHEN request_status = 'REJECTED' THEN 1 ELSE 0 END), 0) AS rejected,
          COALESCE(SUM(flagged), 0) AS flagged,
          COALESCE(SUM(CASE WHEN moderation_status = 'NOT_EVALUATED' THEN 1 ELSE 0 END), 0) AS notEvaluated
        FROM ai_audit_logs
      `)
      .get() as { total: number; success: number; failed: number; rejected: number; flagged: number; notEvaluated: number };

    const features = (db.prepare('SELECT DISTINCT feature FROM ai_audit_logs ORDER BY feature').all() as { feature: string }[])
      .map((row) => row.feature);

    return NextResponse.json({
      logs: rows.map(shape),
      total,
      features,
      summary: {
        total: summaryRow.total,
        success: summaryRow.success,
        failed: summaryRow.failed,
        rejected: summaryRow.rejected,
        flagged: summaryRow.flagged,
        notEvaluated: summaryRow.notEvaluated,
      },
    });
  } catch (error) {
    console.error('[Admin AI Logs API] Error:', error);
    return NextResponse.json({ error: 'Failed to load AI audit logs.' }, { status: 500 });
  }
}
