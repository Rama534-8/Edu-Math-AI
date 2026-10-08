'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MixedMathText, MathRenderer } from '@/components/ui/MathRenderer';
import { sendChatMessageToAI } from '@/lib/ai-service';
import { useAuth } from '@/lib/auth-context';
import { AIMessage } from '@/types';
import {
  Bot,
  Send,
  Sparkles,
  Languages,
  BookOpen,
  HelpCircle,
  RotateCcw,
  User,
} from 'lucide-react';

const INITIAL_MESSAGES: AIMessage[] = [
  {
    id: 'init-1',
    sender: 'ai',
    content:
      'Hello! Welcome to the **EduMathAI Smart Chatbot**. I am specialized in CBSE and AP State Board Class 9 Mathematics. Ask me any doubt, formula derivation, or request an explanation in Telugu!',
    suggestedPrompts: [
      'Explain Factor Theorem with an example',
      'How to prove lines are parallel using alternate angles?',
      'తెలుగులో హెరాన్ సూత్రం వివరించండి',
      'Why does a sign invert when moving across the equals sign?',
    ],
    timestamp: '2025-01-01T00:00:00.000Z',
  },
];

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function AIChatbotPage() {
  const { studentProfile } = useAuth();
  const [messages, setMessages] = useState<AIMessage[]>(INITIAL_MESSAGES);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<'ENGLISH' | 'TELUGU'>('ENGLISH');
  const [lastError, setLastError] = useState<string | null>(null);
  const [failedMessage, setFailedMessage] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    const userMsg: AIMessage = {
      id: generateId('usr'),
      sender: 'student',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setLastError(null);

    try {
      const response = await sendChatMessageToAI(messages, text, {
        chapterTitle: 'General',
        topicTitle: 'Class 9 Mathematics',
        board: studentProfile?.board,
        language,
      });
      setMessages((prev) => [...prev, response]);
      setFailedMessage(null);
    } catch (e) {
      console.error(e);
      // Surface the failure as a retryable banner (not an AI chat bubble),
      // so students can retry the same question with one tap.
      const message = e instanceof Error ? e.message : 'AI is temporarily unavailable. Please try again later.';
      setLastError(message);
      setFailedMessage(text);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isLoading) return;

    if (!textToSend) setInputMessage('');
    await sendMessage(text);
  };

  const handleRetry = async () => {
    if (!failedMessage || isLoading) return;
    setLastError(null);
    await sendMessage(failedMessage);
  };

  return (
    <RoleGuard allowedRoles={['STUDENT']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />

        <div className="flex-1 flex">
          <Sidebar />

          <main className="flex-1 flex flex-col min-w-0">
            <Header
              title="Smart AI Mathematics Chatbot"
              subtitle="Ask math doubts, explore step derivations, and study with instant AI mentorship"
            />

            <div className="p-6 max-w-5xl w-full mx-auto flex-1 flex flex-col min-h-[680px]">
              <Card className="flex-1 flex flex-col p-0 overflow-hidden shadow-xl border-slate-200 dark:border-slate-800">
                {/* Chat Header */}
                <div className="p-4 bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-indigo-300" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">EduMathAI Active Math Tutor</h3>
                      <p className="text-[11px] text-slate-300">
                        Class 9 CBSE & AP State Board • English & Telugu
                      </p>
                    </div>
                  </div>

                  {/* Language Toggle */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setLanguage((prev) => (prev === 'ENGLISH' ? 'TELUGU' : 'ENGLISH'))
                      }
                      className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Languages className="w-3.5 h-3.5" />
                      <span>{language === 'ENGLISH' ? 'తెలుగు మోడ్' : 'English Mode'}</span>
                    </button>
                  </div>
                </div>

                {/* Messages Box */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/40 text-xs">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${
                        m.sender === 'student' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400">
                        {m.sender === 'student' ? (
                          <>
                            <span>You</span>
                            <User className="w-3 h-3" />
                          </>
                        ) : (
                          <>
                            <Bot className="w-3 h-3 text-indigo-500" />
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">
                              EduMathAI
                            </span>
                          </>
                        )}
                      </div>

                      <div
                        className={`max-w-[85%] p-4 rounded-2xl leading-relaxed shadow-xs text-xs sm:text-sm ${
                          m.sender === 'student'
                            ? 'bg-indigo-600 text-white rounded-tr-none'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-tl-none'
                        }`}
                      >
                        <MixedMathText text={m.content} />
                      </div>

                      {/* Prompt pills */}
                      {m.suggestedPrompts && m.suggestedPrompts.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2 max-w-[90%]">
                          {m.suggestedPrompts.map((p, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSendMessage(p)}
                              className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-medium border border-indigo-200 dark:border-indigo-800 transition-colors text-left"
                            >
                              ⚡ {p}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-[220px] text-slate-500 animate-pulse text-xs">
                      <Bot className="w-4 h-4 text-indigo-600 animate-spin" />
                      <span>Formulating math explanation...</span>
                    </div>
                  )}
                  {lastError && !isLoading && (
                    <div className="flex items-center gap-3 p-3 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 max-w-[420px] text-xs text-amber-800 dark:text-amber-200">
                      <span className="flex-1">⚠️ {lastError}</span>
                      {failedMessage && (
                        <button
                          type="button"
                          onClick={handleRetry}
                          className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" /> Retry
                        </button>
                      )}
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input Bar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3"
                >
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={
                      language === 'TELUGU'
                        ? 'మీ గణిత సందేహాన్ని ఇక్కడ అడగండి...'
                        : 'Ask any Class 9 math question, formula, or concept...'
                    }
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                  />
                  <Button
                    type="submit"
                    disabled={!inputMessage.trim() || isLoading}
                    className="px-5 py-3 rounded-xl"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
