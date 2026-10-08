'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, Maximize2, Minimize2 } from 'lucide-react';
import { Card } from './Card';
import { useAuth } from '@/lib/auth-context';
import { sendChatMessageToAI } from '@/lib/ai-service';
import { AIMessage } from '@/types';

export const SmartChatbot: React.FC = () => {
  const { studentProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial greeting
  useEffect(() => {
    if (isOpen && messages.length === 0 && studentProfile) {
       
      setMessages([
        {
          id: 'initial-greeting',
          sender: 'ai',
          content: `Hi ${studentProfile?.displayName?.split(' ')[0] || 'there'}! I'm EduMathAI. How can I help you with Class 9 Mathematics today? You can ask me in English or Telugu!`,
          timestamp: new Date().toISOString()
        }
      ]);
    }
  }, [isOpen, messages.length, studentProfile]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input.trim();
    setInput('');
    const newMsg: AIMessage = {
      id: Date.now().toString(),
      sender: 'student',
      content: userMsg,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newMsg]);
    setIsLoading(true);

    try {
      const response = await sendChatMessageToAI(
        messages,
        userMsg,
        {
          chapterTitle: 'General',
          topicTitle: 'Class 9 Mathematics',
          board: studentProfile?.board,
        }
      );

      setMessages(prev => [...prev, response]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg: AIMessage = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        content: 'Sorry, I encountered a temporary error connecting to the AI. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg shadow-indigo-600/30 flex items-center justify-center transition-transform hover:scale-110 z-50 group"
      >
        <Bot className="w-6 h-6" />
        <span className="absolute -top-10 right-0 bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Ask EduMathAI 💬
        </span>
      </button>
    );
  }

  return (
    <Card 
      className={`fixed bottom-6 right-6 flex flex-col shadow-2xl border-indigo-200 dark:border-indigo-900/50 z-50 transition-all duration-300 ease-in-out ${
        isExpanded 
          ? 'w-[calc(100vw-3rem)] md:w-[600px] h-[calc(100vh-6rem)] md:h-[700px]' 
          : 'w-[350px] h-[450px]'
      }`}
    >
      {/* Chat Header */}
      <div className="flex items-center justify-between p-3 bg-indigo-600 text-white rounded-t-xl shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <h3 className="text-sm font-bold leading-tight">EduMathAI Chatbot</h3>
            <p className="text-[10px] text-indigo-200 leading-tight">Smart Learning Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => setIsOpen(false)}
            className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.sender === 'student' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.sender === 'student' 
                  ? 'bg-indigo-600 text-white rounded-br-sm' 
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-sm shadow-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-bl-sm shadow-sm flex items-center gap-2">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
              </div>
              <span className="text-xs text-slate-500 font-medium ml-1">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="p-3 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 rounded-b-xl shrink-0">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a math question..."
            className="flex-1 bg-slate-100 dark:bg-slate-900 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-slate-100"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white flex items-center justify-center shrink-0 transition-colors"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>
    </Card>
  );
};
