'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { sendChatMessageToAI } from '@/lib/ai-service';
import { AIMessage } from '@/types';
import { MixedMathText } from '../ui/MathRenderer';
import {
  Bot,
  X,
  Send,
  Languages,
  Maximize2,
  Minimize2,
  Lightbulb,
} from 'lucide-react';
import { Button } from '../ui/Button';

export const FloatingChatbot: React.FC = () => {
  const { role, studentProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<'ENGLISH' | 'TELUGU'>('ENGLISH');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'welcome-1',
      sender: 'ai',
      content:
        'Namaste! 🙏 I am your **EduMathAI Smart Maths Assistant**. How can I help you understand Class 9 Mathematics today? You can ask doubt explanations, hints, formulas, or request explanations in Telugu!',
      suggestedPrompts: [
        'How do I factorize polynomials?',
        'Give me a hint for 2x + 5 = 15',
        'Explain in Telugu (తెలుగులో చెప్పండి)',
        'What is Heron’s formula?',
      ],
      timestamp: new Date().toISOString(),
    },
  ]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Only render on student or authenticated views
  if (!role || role !== 'STUDENT') {
    return null;
  }

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputMessage;
    if (!query.trim() || isLoading) return;

    const userMsg: AIMessage = {
      id: `usr-${messages.length}`,
      sender: 'student',
      content: query,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsLoading(true);

    try {
      const aiResponse = await sendChatMessageToAI(messages, query, {
        chapterTitle: 'General',
        topicTitle: 'Class 9 Mathematics',
        board: studentProfile?.board,
        language,
      });
      setMessages((prev) => [...prev, aiResponse]);
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'ai',
          content: e instanceof Error ? e.message : 'I am temporarily unavailable.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 transition-all duration-300 cursor-pointer"
        >
          <div className="relative">
            <Bot className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-indigo-700 animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-indigo-700" />
          </div>
          <span className="font-bold text-sm tracking-wide">Ask AI Tutor</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/20 text-white font-medium">
            Eng / తె
          </span>
        </button>
      )}

      {/* Chatbot Window */}
      {isOpen && (
        <div
          className={`flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95 ${
            isExpanded
              ? 'w-[90vw] md:w-[680px] h-[80vh]'
              : 'w-[92vw] sm:w-[420px] h-[540px]'
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                  EduMathAI Smart Bot
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                </h3>
                <p className="text-[10px] text-white/80">Class 9 CBSE & AP State Board</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Language Switcher */}
              <button
                onClick={() =>
                  setLanguage((prev) => (prev === 'ENGLISH' ? 'TELUGU' : 'ENGLISH'))
                }
                className="px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-semibold flex items-center gap-1 transition-colors"
                title="Switch Language (English / తెలుగు)"
              >
                <Languages className="w-3.5 h-3.5" />
                <span>{language === 'ENGLISH' ? 'తెలుగు' : 'English'}</span>
              </button>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                {isExpanded ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/40 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'student' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed shadow-xs ${
                    msg.sender === 'student'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-none'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-tl-none'
                  }`}
                >
                  <MixedMathText text={msg.content} />
                </div>

                {/* Suggested Prompts Pills from AI */}
                {msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5 max-w-[95%]">
                    {msg.suggestedPrompts.map((prompt, pIdx) => (
                      <button
                        key={pIdx}
                        onClick={() => handleSendMessage(prompt)}
                        className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors text-left"
                      >
                        ⚡ {prompt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-[200px] text-slate-500 animate-pulse">
                <Bot className="w-4 h-4 text-indigo-600 animate-bounce" />
                <span>AI is formulating hint...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Concept Hint Bar */}
          <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-[11px] text-slate-600 dark:text-slate-400">
            <span className="font-bold flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <Lightbulb className="w-3.5 h-3.5" /> Fast Hints:
            </span>
            <button
              onClick={() => handleSendMessage('Give me a hint for solving 2x + 5 = 15')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 whitespace-nowrap"
            >
              • Linear Equations
            </button>
            <button
              onClick={() => handleSendMessage('Explain how to factorize x² + 5x + 6')}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 whitespace-nowrap"
            >
              • Polynomials
            </button>
            <button
              onClick={() => handleSendMessage("What is Heron's Formula?")}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 whitespace-nowrap"
            >
              • Heron&apos;s Formula
            </button>
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                language === 'TELUGU'
                  ? 'మీ గణిత సందేహాన్ని ఇక్కడ టైప్ చేయండి...'
                  : 'Ask math question, formula, or doubt...'
              }
              className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!inputMessage.trim() || isLoading}
              className="px-3 py-2 rounded-xl"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};
