'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MixedMathText } from '@/components/ui/MathRenderer';
import { CLASS_9_CHAPTERS } from '@/lib/curriculum-data';
import type { BoardType, PaperDifficulty, PaperLanguage, QuestionPaper } from '@/types';
import {
  Sparkles,
  Printer,
  Save,
  Trash2,
  BookOpen,
  Eye,
  EyeOff,
  FileText,
  FolderOpen,
} from 'lucide-react';

// -----------------------------------------------------------------------------
// AI Question Paper Generator (Teacher)
//   Generate → validate on the server → preview → save/print (browser PDF).
// -----------------------------------------------------------------------------

const TYPE_LABELS: Record<string, string> = {
  MCQ: 'Multiple Choice',
  SHORT_ANSWER: 'Short Answer',
  LONG_ANSWER: 'Long Answer',
  NUMERICAL: 'Numerical',
};

const OPTION_LETTERS = ['a', 'b', 'c', 'd'];

export default function QuestionPaperGeneratorPage() {
  const [board, setBoard] = useState<BoardType>('CBSE');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState<PaperDifficulty>('MIXED');
  const [language, setLanguage] = useState<PaperLanguage>('ENGLISH');
  const [title, setTitle] = useState('Class 9 Mathematics Question Paper');

  const [generating, setGenerating] = useState(false);
  const [paper, setPaper] = useState<QuestionPaper | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [savedPapers, setSavedPapers] = useState<QuestionPaper[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);

  const chapters = useMemo(() => CLASS_9_CHAPTERS.filter((c) => c.board === board), [board]);

  const loadSaved = React.useCallback(async () => {
    try {
      const res = await fetch('/api/teacher/question-papers');
      const data = await res.json();
      if (res.ok) setSavedPapers((data.papers ?? []) as QuestionPaper[]);
    } catch {
      // Non-fatal: the saved list simply stays as-is.
    } finally {
      setLoadingSaved(false);
    }
  }, []);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  const handleBoardChange = (next: BoardType) => {
    setBoard(next);
    setSelectedIds([]); // chapter ids differ per board — never mix boards
  };

  const toggleChapter = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleGenerate = async () => {
    setError(null);
    setNotice(null);
    if (selectedIds.length === 0) {
      setError('Select at least one chapter first.');
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch('/api/teacher/question-paper/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, board, chapterIds: selectedIds, questionCount, difficulty, language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not generate the paper. Please try again.');
      setPaper(data.paper as QuestionPaper);
      setShowAnswers(false);
      setNotice(
        `Generated ${data.generatedCount} questions (${data.paper.totalMarks} marks). Review below before saving.`
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not generate the paper.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!paper) return;
    setError(null);
    setNotice(null);
    try {
      const res = await fetch('/api/teacher/question-papers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paper }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save the paper.');
      setNotice('✓ Paper saved.');
      await loadSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the paper.');
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/teacher/question-papers?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Could not delete the paper.');
      }
      setSavedPapers((prev) => prev.filter((p) => p.id !== id));
      if (paper?.id === id) setPaper(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete the paper.');
    }
  };

  return (
    <RoleGuard allowedRoles={['TEACHER', 'PLATFORM_ADMIN']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 print:bg-white">
        <div className="print:hidden">
          <Navbar />
        </div>

        <div className="flex-1 flex">
          <div className="print:hidden">
            <Sidebar />
          </div>

          <main className="flex-1 flex flex-col min-w-0">
            <div className="print:hidden">
              <Header
                title="AI Question Paper Generator"
                subtitle="Pick chapters, let AI set a Class 9 Maths paper, review it, then save or print to PDF"
              />
            </div>

            <div className="p-6 max-w-5xl w-full mx-auto space-y-5 print:p-0 print:max-w-none">
              {/* Generator controls */}
              <Card className="p-6 print:hidden">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Paper settings</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Paper title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={200}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Board</label>
                    <select
                      value={board}
                      onChange={(e) => handleBoardChange(e.target.value as BoardType)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                    >
                      <option value="CBSE">CBSE (2026-27)</option>
                      <option value="AP_STATE_BOARD">AP State Board</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Questions (5–40)</label>
                    <input
                      type="number"
                      min={5}
                      max={40}
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Number(e.target.value))}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Difficulty</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as PaperDifficulty)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                    >
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                      <option value="MIXED">Mixed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Language</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as PaperLanguage)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                    >
                      <option value="ENGLISH">English</option>
                      <option value="TELUGU">తెలుగు (Telugu)</option>
                    </select>
                  </div>

                  <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1 lg:col-start-4">
                    <Button
                      onClick={handleGenerate}
                      isLoading={generating}
                      className="w-full"
                      rightIcon={<Sparkles className="w-3.5 h-3.5" />}
                    >
                      {generating ? 'Generating…' : 'Generate Paper'}
                    </Button>
                  </div>
                </div>
                {/* Chapter picker */}
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-slate-500">
                      Chapters ({selectedIds.length} selected)
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedIds(chapters.map((c) => c.id))}
                        className="text-[11px] font-semibold text-indigo-600 hover:underline"
                      >
                        Select all
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedIds([])}
                        className="text-[11px] font-semibold text-slate-400 hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 p-2 bg-slate-50 dark:bg-slate-900">
                    {chapters.map((c) => {
                      const checked = selectedIds.includes(c.id);
                      return (
                        <label
                          key={c.id}
                          className={`flex items-center gap-2 text-xs p-1.5 rounded-lg cursor-pointer transition-colors ${
                            checked
                              ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleChapter(c.id)}
                            className="accent-indigo-600"
                          />
                          <span className="truncate">
                            {c.chapterNumber}. {c.title}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {error && (
                  <div
                    className="mt-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-300"
                    role="alert"
                  >
                    {error}
                  </div>
                )}
                {notice && !error && (
                  <div className="mt-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs text-emerald-700 dark:text-emerald-300">
                    {notice}
                  </div>
                )}
              </Card>
              {/* Generated paper preview */}
              {paper && (
                <Card className="p-6">
                  {/* Screen-only action bar */}
                  <div className="flex flex-wrap items-center gap-2 mb-5 print:hidden">
                    <Badge variant="primary" size="sm">
                      {paper.questions.length} questions · {paper.totalMarks} marks
                    </Badge>
                    <Badge variant="secondary" size="sm">
                      {paper.board === 'CBSE' ? 'CBSE' : 'AP State Board'}
                    </Badge>
                    <Badge variant="info" size="sm">
                      {paper.language === 'TELUGU' ? 'తెలుగు' : 'English'}
                    </Badge>
                    <div className="ml-auto flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAnswers((v) => !v)}
                        rightIcon={showAnswers ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      >
                        {showAnswers ? 'Hide answers' : 'Show answers'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleSave} rightIcon={<Save className="w-3.5 h-3.5" />}>
                        Save
                      </Button>
                      <Button size="sm" onClick={() => window.print()} rightIcon={<Printer className="w-3.5 h-3.5" />}>
                        Print / PDF
                      </Button>
                    </div>
                  </div>

                  {/* Printable sheet header */}
                  <div className="text-center border-b-2 border-slate-900 dark:border-slate-200 pb-4 mb-4">
                    <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 print:text-black">
                      {paper.title}
                    </h2>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1 print:text-black">
                      {paper.subject} · {paper.className} ·{' '}
                      {paper.board === 'CBSE' ? 'CBSE (2026-27)' : 'AP State Board'} ·{' '}
                      {paper.language === 'TELUGU' ? 'తెలుగు' : 'English'} · {paper.difficulty}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 print:text-black">
                      Time allowed: 2 hours &nbsp;|&nbsp; Maximum Marks: {paper.totalMarks} &nbsp;|&nbsp;{' '}
                      {new Date(paper.generatedAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* General instructions */}
                  <div className="mb-5">
                    <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">General Instructions</h4>
                    <ol className="list-decimal list-inside space-y-1 text-xs text-slate-700 dark:text-slate-300 print:text-black">
                      {paper.instructions.map((inst, i) => (
                        <li key={i}>{inst}</li>
                      ))}
                    </ol>
                  </div>
                  {/* Questions */}
                  <ol className="space-y-5">
                    {paper.questions.map((q) => (
                      <li key={q.number} className="text-xs text-slate-800 dark:text-slate-200 print:text-black">
                        <div className="flex items-start gap-2">
                          <span className="font-bold shrink-0">{q.number}.</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <span className="font-medium">
                                <MixedMathText text={q.question} />
                              </span>
                              <span className="text-[10px] font-semibold text-slate-500 shrink-0">
                                [{TYPE_LABELS[q.type] ?? q.type} · {q.marks} {q.marks === 1 ? 'mark' : 'marks'}]
                              </span>
                            </div>

                            {q.options && q.options.length > 0 && (
                              <ul className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                                {q.options.map((opt, oi) => (
                                  <li key={oi} className="text-slate-700 dark:text-slate-300 print:text-black">
                                    ({OPTION_LETTERS[oi] ?? oi + 1}) <MixedMathText text={opt} />
                                  </li>
                                ))}
                              </ul>
                            )}

                            {showAnswers && q.answer && (
                              <div className="mt-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 px-2.5 py-1.5 text-[11px] text-emerald-800 dark:text-emerald-200 print:border print:border-black">
                                <span className="font-bold">Model answer: </span>
                                <MixedMathText text={q.answer} />
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </Card>
              )}

              {!paper && (
                <Card className="p-10 text-center print:hidden">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-500">No paper generated yet</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Select one or more chapters above and click &ldquo;Generate Paper&rdquo;.
                  </p>
                </Card>
              )}
              {/* Saved papers */}
              <Card className="p-6 print:hidden">
                <div className="flex items-center gap-2 mb-4">
                  <FolderOpen className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Saved papers</h3>
                  <Badge variant="secondary" size="sm">
                    {savedPapers.length}
                  </Badge>
                </div>

                {loadingSaved ? (
                  <p className="text-xs text-slate-400">Loading…</p>
                ) : savedPapers.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    No saved papers yet. Generate a paper and press &ldquo;Save&rdquo; to keep it here.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                    {savedPapers.map((p) => (
                      <li key={p.id} className="py-2.5 flex items-center gap-3">
                        <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{p.title}</p>
                          <p className="text-[11px] text-slate-400">
                            {p.questions.length} questions · {p.totalMarks} marks ·{' '}
                            {p.board === 'CBSE' ? 'CBSE' : 'AP'} ·{' '}
                            {new Date(p.generatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPaper(p);
                            setShowAnswers(false);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          Open
                        </Button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id)}
                          aria-label={`Delete ${p.title}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}

