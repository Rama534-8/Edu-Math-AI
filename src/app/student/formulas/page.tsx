'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MathRenderer } from '@/components/ui/MathRenderer';
import { CLASS_9_CHAPTERS } from '@/lib/curriculum-data';
import {
  BookmarkCheck,
  Search,
  Star,
  StarOff,
  Filter,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { FormulaItem } from '@/types';

export default function FormulasPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('ALL');
  const [favorites, setFavorites] = useState<Record<string, boolean>>({
    'form-poly-1': true,
    'form-heron-1': true,
  });
  const [personalNotes, setPersonalNotes] = useState<Record<string, string>>({
    'form-heron-1': 'Remember s is semi-perimeter, so divide (a+b+c) by 2 before root calculation!',
  });

  // Extract all formulas
  const allFormulas: (FormulaItem & { chapterTitle: string })[] = [];
  CLASS_9_CHAPTERS.forEach((ch) => {
    ch.topics.forEach((top) => {
      top.formulas?.forEach((form) => {
        allFormulas.push({ ...form, chapterTitle: ch.title });
      });
    });
  });

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleNoteChange = (id: string, note: string) => {
    setPersonalNotes((prev) => ({ ...prev, [id]: note }));
  };

  const filteredFormulas = allFormulas.filter((f) => {
    if (selectedChapterId !== 'ALL' && f.chapterId !== selectedChapterId) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        f.title.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.chapterTitle.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <RoleGuard allowedRoles={['STUDENT']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />

        <div className="flex-1 flex">
          <Sidebar />

          <main className="flex-1 flex flex-col min-w-0">
            <Header
              title="Class 9 Mathematics Formula Notebook"
              subtitle="Search, bookmark favorites, and save personal handwritten notes for quick revision"
            />

            <div className="p-6 max-w-6xl w-full mx-auto space-y-6">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search formulas by name (e.g. Heron, Exponents, Cylinder)..."
                    className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={selectedChapterId}
                    onChange={(e) => setSelectedChapterId(e.target.value)}
                    className="p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="ALL">All Chapters</option>
                    {CLASS_9_CHAPTERS.map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        {ch.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Formulas Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredFormulas.length === 0 ? (
                  <div className="col-span-1 md:col-span-2 text-center py-16 text-slate-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="font-medium">No formulas found.</p>
                    <p className="text-sm">Try searching for &quot;area&quot; or &quot;triangle&quot;</p>
                  </div>
                ) : (
                  filteredFormulas.map((form) => {
                    const isFav = !!favorites[form.id];
                    const note = personalNotes[form.id] || '';
                    return (
                      <Card key={form.id} className="p-6 flex flex-col justify-between space-y-4">
                        <div>
                          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div>
                              <Badge variant="primary" size="sm">
                                {form.chapterTitle}
                              </Badge>
                              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                                {form.title}
                              </h4>
                            </div>

                            <button
                              onClick={() => toggleFavorite(form.id)}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                isFav
                                  ? 'bg-amber-100 border-amber-300 text-amber-600'
                                  : 'text-slate-400 border-slate-200 hover:text-amber-500'
                              }`}
                            >
                              <Star className={`w-4 h-4 ${isFav ? 'fill-amber-500' : ''}`} />
                            </button>
                          </div>

                          {/* LaTeX Formula Box */}
                          <div className="my-4 p-4 rounded-xl bg-slate-950 text-white text-center shadow-inner">
                            <MathRenderer math={form.latex} inline={false} />
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            {form.description}
                          </p>
                          {form.descriptionTelugu && (
                            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                              {form.descriptionTelugu}
                            </p>
                          )}
                        </div>

                        {/* Personal Note Box */}
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Personal Revision Note:
                          </label>
                          <input
                            type="text"
                            value={note}
                            onChange={(e) => handleNoteChange(form.id, e.target.value)}
                            placeholder="Add tips or memory mnemonics..."
                            className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                          />
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
