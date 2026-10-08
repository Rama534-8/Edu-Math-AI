'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Activity,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react';

// ─── Types (mirror /api/admin/ai-logs) ────────────────────────────────────────

interface AiAuditLog {
  id: string;
  createdAt: string;
  userId: string | null;
  userEmail: string | null;
  role: string | null;
  feature: string;
  requestStatus: 'SUCCESS' | 'FAILED' | 'REJECTED';
  httpStatus: number | null;
  moderationStatus: 'NOT_EVALUATED' | 'SAFE' | 'FLAGGED';
  flagged: boolean;
  reason: string | null;
  durationMs: number | null;
}

interface AiLogSummary {
  total: number;
  success: number;
  failed: number;
  rejected: number;
  flagged: number;
  notEvaluated: number;
}

interface Filters {
  feature: string;
  status: string;
  moderation: string;
  from: string;
  to: string;
}

const EMPTY_FILTERS: Filters = { feature: '', status: '', moderation: '', from: '', to: '' };

const FEATURE_LABELS: Record<string, string> = {
  AI_CHAT: 'AI Chatbot',
  AI_SOLVER: 'AI Solver',
  AI_HANDWRITTEN_CHECKER: 'Handwritten Checker',
  AI_TUTOR: 'AI Tutor',
  AI_MISTAKE_DETECTIVE: 'Mistake Detective',
  AI_STUDY_PLANNER: 'Study Planner',
  AI_QUESTION_GENERATOR: 'Question Generator',
};

const featureLabel = (feature: string) => FEATURE_LABELS[feature] ?? feature;

// ─── Badge helpers ────────────────────────────────────────────────────────────

function RequestStatusBadge({ status }: { status: AiAuditLog['requestStatus'] }) {
  switch (status) {
    case 'SUCCESS':
      return <Badge variant="success" size="sm">Success</Badge>;
    case 'REJECTED':
      return <Badge variant="warning" size="sm">Rejected</Badge>;
    default:
      return <Badge variant="danger" size="sm">Failed</Badge>;
  }
}

function ModerationBadge({ status }: { status: AiAuditLog['moderationStatus'] }) {
  switch (status) {
    case 'SAFE':
      return <Badge variant="success" size="sm">Safe</Badge>;
    case 'FLAGGED':
      return <Badge variant="danger" size="sm">Flagged</Badge>;
    default:
      return <Badge variant="secondary" size="sm">Not evaluated</Badge>;
  }
}

function SummaryTile({ label, value, hint, icon }: {
  label: string;
  value: number | string;
  hint?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <span className="text-slate-300 dark:text-slate-600">{icon}</span>
      </div>
      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlatformAdminAIModerationPage() {
  const [logs, setLogs] = useState<AiAuditLog[]>([]);
  const [summary, setSummary] = useState<AiLogSummary | null>(null);
  const [features, setFeatures] = useState<string[]>([]);
  const [filteredTotal, setFilteredTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [selected, setSelected] = useState<AiAuditLog | null>(null);

  const loadLogs = useCallback(async (active: Filters) => {
    setIsLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (active.feature) params.set('feature', active.feature);
      if (active.status) params.set('status', active.status);
      if (active.moderation) params.set('moderation', active.moderation);
      if (active.from) params.set('from', active.from);
      if (active.to) params.set('to', active.to);
      params.set('limit', '200');

      const res = await fetch(`/api/admin/ai-logs?${params.toString()}`, { credentials: 'same-origin' });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || 'Failed to load AI audit logs.');

      setLogs((json.logs ?? []) as AiAuditLog[]);
      setSummary((json.summary ?? null) as AiLogSummary | null);
      setFeatures((json.features ?? []) as string[]);
      setFilteredTotal(typeof json.total === 'number' ? json.total : 0);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load AI audit logs.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs(filters);
  }, [loadLogs, filters]);

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => setFilters(EMPTY_FILTERS);
  const hasActiveFilters = Object.values(filters).some(Boolean);

  const openDetail = async (log: AiAuditLog) => {
    try {
      const res = await fetch(`/api/admin/ai-logs?id=${encodeURIComponent(log.id)}`, { credentials: 'same-origin' });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.log) {
        setSelected(json.log as AiAuditLog);
        return;
      }
    } catch {
      // fall through to the row data already in the table
    }
    setSelected(log);
  };

  const formatDate = (value: string) => {
    const date = new Date(value.replace(' ', 'T') + 'Z');
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
  };

  const selectClass =
    'h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300';
  const dateClass =
    'h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-600 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300';

  return (
    <RoleGuard allowedRoles={['PLATFORM_ADMIN']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex-1 flex">
          <Sidebar />
          <main className="flex-1 flex flex-col min-w-0">
            <Header title="AI Content Moderation" subtitle="Audit AI feature requests, statuses and safety evaluation" />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
              {error && (
                <Card className="p-4 text-sm text-rose-700 dark:text-rose-300" role="alert">
                  {error}
                </Card>
              )}

              {/* A. Overview */}
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="AI request overview">
                <SummaryTile
                  label="Total AI requests"
                  value={summary?.total ?? 0}
                  hint="All audited AI feature calls"
                  icon={<Activity className="w-4 h-4" />}
                />
                <SummaryTile
                  label="Successful"
                  value={summary?.success ?? 0}
                  hint={summary && summary.total > 0 ? `${Math.round((summary.success / summary.total) * 100)}% of all requests` : 'No requests yet'}
                  icon={<CheckCircle2 className="w-4 h-4" />}
                />
                <SummaryTile
                  label="Failed"
                  value={summary ? summary.failed + summary.rejected : 0}
                  hint={summary ? `${summary.failed} failed · ${summary.rejected} rejected` : 'Errors and denied requests'}
                  icon={<XCircle className="w-4 h-4" />}
                />
                <SummaryTile
                  label="Flagged"
                  value={summary?.flagged ?? 0}
                  hint={summary ? `${summary.notEvaluated} not evaluated` : 'Requires a real moderation result'}
                  icon={<ShieldAlert className="w-4 h-4" />}
                />
              </section>

              {/* B. Filters */}
              <Card className="p-4">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <Filter className="w-3.5 h-3.5" /> Filters
                  </div>

                  <label className="flex flex-col gap-1 text-[11px] font-medium text-slate-500">
                    AI feature
                    <select className={selectClass} value={filters.feature} onChange={(e) => updateFilter('feature', e.target.value)}>
                      <option value="">All features</option>
                      {features.map((feature) => (
                        <option key={feature} value={feature}>{featureLabel(feature)}</option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1 text-[11px] font-medium text-slate-500">
                    Status
                    <select className={selectClass} value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}>
                      <option value="">All statuses</option>
                      <option value="SUCCESS">Success</option>
                      <option value="FAILED">Failed</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-1 text-[11px] font-medium text-slate-500">
                    Moderation
                    <select className={selectClass} value={filters.moderation} onChange={(e) => updateFilter('moderation', e.target.value)}>
                      <option value="">All moderation states</option>
                      <option value="NOT_EVALUATED">Not evaluated</option>
                      <option value="SAFE">Safe</option>
                      <option value="FLAGGED">Flagged</option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-1 text-[11px] font-medium text-slate-500">
                    From
                    <input type="date" className={dateClass} value={filters.from} onChange={(e) => updateFilter('from', e.target.value)} />
                  </label>

                  <label className="flex flex-col gap-1 text-[11px] font-medium text-slate-500">
                    To
                    <input type="date" className={dateClass} value={filters.to} onChange={(e) => updateFilter('to', e.target.value)} />
                  </label>

                  <div className="flex items-center gap-2 ml-auto">
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                      >
                        Reset
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => loadLogs(filters)}
                      className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 flex items-center gap-1.5"
                      aria-label="Refresh audit log"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                  </div>
                </div>
              </Card>

              {/* C. Audit list */}
              {isLoading && logs.length === 0 ? (
                <div className="flex items-center justify-center gap-2 py-20 text-slate-500" role="status">
                  <Loader2 className="w-5 h-5 animate-spin" /> Loading AI audit log...
                </div>
              ) : logs.length === 0 ? (
                <EmptyState
                  icon={<Sparkles className="w-6 h-6" />}
                  title={summary && summary.total > 0 ? 'No records match these filters' : 'No AI requests recorded yet'}
                  description={
                    summary && summary.total > 0
                      ? 'Adjust or reset the filters to see more audit records.'
                      : 'Audit records appear here automatically as students and staff use AI features such as the chatbot, solver and tutor.'
                  }
                  {...(hasActiveFilters ? { actionText: 'Reset filters', onAction: resetFilters } : {})}
                />
              ) : (
                <Card className="overflow-hidden">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-500" /> AI Request Audit Log
                    </h2>
                    <Badge variant="secondary" size="sm">
                      {filteredTotal === logs.length ? `${logs.length} records` : `${logs.length} of ${filteredTotal}`}
                    </Badge>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50/50 dark:bg-slate-900/20 text-slate-500 text-xs uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-4 font-semibold text-left">Timestamp</th>
                          <th className="py-3 px-4 font-semibold text-left">Feature</th>
                          <th className="py-3 px-4 font-semibold text-left">User / Role</th>
                          <th className="py-3 px-4 font-semibold text-left">Status</th>
                          <th className="py-3 px-4 font-semibold text-left">Moderation</th>
                          <th className="py-3 px-4 font-semibold text-right">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {logs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                              {formatDate(log.createdAt)}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-medium text-slate-900 dark:text-slate-100">{featureLabel(log.feature)}</span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-xs text-slate-700 dark:text-slate-300">{log.userEmail ?? 'Unknown user'}</div>
                              {log.role ? (
                                <Badge variant="info" size="sm" className="mt-0.5">{log.role}</Badge>
                              ) : (
                                <span className="text-[11px] text-slate-400">No session</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <RequestStatusBadge status={log.requestStatus} />
                            </td>
                            <td className="py-3 px-4">
                              <ModerationBadge status={log.moderationStatus} />
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => openDetail(log)}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                                aria-label={`View details for ${featureLabel(log.feature)} request`}
                              >
                                <Eye className="w-3.5 h-3.5" /> View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Audit records store metadata only (feature, account, status, timing). Prompts, responses, passwords,
                tokens and API keys are never recorded. &ldquo;Not evaluated&rdquo; means no automated safety
                assessment has been run for that request.
              </p>
            </div>
          </main>
        </div>
      </div>

      {/* D. Detail view */}
      <Modal isOpen={selected !== null} onClose={() => setSelected(null)} title="Audit Record Details" maxWidth="lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary" size="sm">{featureLabel(selected.feature)}</Badge>
              <RequestStatusBadge status={selected.requestStatus} />
              <ModerationBadge status={selected.moderationStatus} />
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Timestamp (UTC)</dt>
                <dd className="mt-0.5 text-slate-800 dark:text-slate-200">{formatDate(selected.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Duration</dt>
                <dd className="mt-0.5 text-slate-800 dark:text-slate-200">
                  {selected.durationMs !== null ? `${selected.durationMs} ms` : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Account</dt>
                <dd className="mt-0.5 text-slate-800 dark:text-slate-200 break-all">{selected.userEmail ?? 'Unknown user'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Role</dt>
                <dd className="mt-0.5 text-slate-800 dark:text-slate-200">{selected.role ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Account ID</dt>
                <dd className="mt-0.5 font-mono text-[11px] text-slate-500 break-all">{selected.userId ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">HTTP status</dt>
                <dd className="mt-0.5 text-slate-800 dark:text-slate-200">{selected.httpStatus ?? '—'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Record ID</dt>
                <dd className="mt-0.5 font-mono text-[11px] text-slate-500 break-all">{selected.id}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Reason / error</dt>
                <dd className="mt-0.5 text-slate-800 dark:text-slate-200">{selected.reason ?? '—'}</dd>
              </div>
            </dl>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
              {selected.moderationStatus === 'NOT_EVALUATED'
                ? 'Moderation status: Not evaluated — no automated safety assessment has been performed on this request. It is not classified as safe or unsafe.'
                : selected.moderationStatus === 'FLAGGED'
                  ? 'Moderation status: Flagged — a moderation result marked this request for review.'
                  : 'Moderation status: Safe — a moderation result evaluated this request as safe.'}
            </div>
          </div>
        )}
      </Modal>
    </RoleGuard>
  );
}
