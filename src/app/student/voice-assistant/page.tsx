'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { RoleGuard } from '@/components/layout/RoleGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MixedMathText } from '@/components/ui/MathRenderer';
import { sendChatMessageToAI } from '@/lib/ai-service';
import { useAuth } from '@/lib/auth-context';
import { AIMessage } from '@/types';
import {
  Mic,
  Square,
  Send,
  Bot,
  User,
  Languages,
  RotateCcw,
  AlertTriangle,
  Keyboard,
  Eraser,
} from 'lucide-react';

// -----------------------------------------------------------------------------
// Voice Math Assistant (Student)
//
// Browser Web Speech API (SpeechRecognition) → editable transcript → the SAME
// existing AI flow as the Smart AI Chatbot (/api/ai/chat via
// sendChatMessageToAI). No external speech service, no new API keys, and the
// recognized text is NEVER auto-submitted — the student reviews/edits first.
// -----------------------------------------------------------------------------

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>;
};

type SpeechRecognitionErrorEventLike = {
  error: string;
  message?: string;
};

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

const SPEECH_LANGUAGES = [
  { code: 'en-IN', label: 'English (India)' },
  { code: 'en-US', label: 'English' },
  { code: 'te-IN', label: 'Telugu (తెలుగు)' },
] as const;

const INITIAL_MESSAGES: AIMessage[] = [
  {
    id: 'voice-welcome',
    sender: 'ai',
    content:
      'Welcome to the **Voice Math Assistant**. Tap the microphone, speak your Class 9 Maths question, review the recognized text below, edit it if needed, then send it to me for a step-by-step answer.',
    timestamp: new Date().toISOString(),
  },
];

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function VoiceMathAssistantPage() {
  const { studentProfile } = useAuth();

  const [messages, setMessages] = React.useState<AIMessage[]>(INITIAL_MESSAGES);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [speechLang, setSpeechLang] = useState<string>('en-IN');
  const [supported, setSupported] = useState<boolean | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptRef = useRef('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Speech recognition is only available in some browsers (Chrome/Edge/Safari).
  useEffect(() => {
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    setSupported(Boolean(Ctor));
  }, []);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleRecognitionError = (event: SpeechRecognitionErrorEventLike) => {
    switch (event.error) {
      case 'not-allowed':
      case 'service-not-allowed':
        setMicError(
          'Microphone permission was denied. Please allow microphone access for this site in your browser settings, then try again.'
        );
        setIsListening(false);
        break;
      case 'audio-capture':
        setMicError('No microphone was found. Please connect a microphone and try again.');
        setIsListening(false);
        break;
      case 'no-speech':
        setMicError('No speech was detected. Please tap the microphone and speak clearly.');
        setIsListening(false);
        break;
      case 'aborted':
        setIsListening(false);
        break;
      default:
        setMicError('Speech recognition stopped unexpectedly. Please try again.');
        setIsListening(false);
    }
  };
  const startListening = () => {
    setMicError(null);
    setSendError(null);
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) {
      setMicError(
        'Speech recognition is not supported in this browser. Please use Chrome or Edge, or type your question below.'
      );
      return;
    }
    try {
      const recognition = new Ctor();
      recognition.lang = speechLang;
      // Keep listening until the student taps Stop, so long questions are captured.
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let finalText = '';
        let interimText = '';
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          const text = result[0]?.transcript ?? '';
          if (result.isFinal) finalText += `${text} `;
          else interimText += text;
        }
        if (finalText) {
          // Finalized text is APPENDED to the editable transcript — never auto-sent.
          setTranscript((prev) =>
            `${prev}${prev && !prev.endsWith(' ') ? ' ' : ''}${finalText.trimStart()}`.trimStart()
          );
        }
        setInterim(interimText);
      };
      recognition.onerror = handleRecognitionError;
      recognition.onend = () => {
        setIsListening(false);
        setInterim('');
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch {
      setMicError('Could not start the microphone. Please check your browser permission and try again.');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // Ignore — onend will still fire and reset the UI.
    }
    setIsListening(false);
    setInterim('');
  };

  const sendRecognizedQuestion = async () => {
    const text = transcript.trim();
    if (!text || isSending) return;

    const isTelugu = speechLang.startsWith('te');
    const userMsg: AIMessage = {
      id: generateId('usr'),
      sender: 'student',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);
    setSendError(null);
    stopListening();

    try {
      const response = await sendChatMessageToAI(messages, text, {
        chapterTitle: 'Voice Math Assistant',
        topicTitle: 'Class 9 Mathematics',
        board: studentProfile?.board,
        language: isTelugu ? 'TELUGU' : 'ENGLISH',
      });
      setMessages((prev) => [...prev, response]);
      setTranscript('');
      setInterim('');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'AI is temporarily unavailable. Please try again later.';
      setSendError(message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['STUDENT']}>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />

        <div className="flex-1 flex">
          <Sidebar />

          <main className="flex-1 flex flex-col min-w-0">
            <Header
              title="Voice Math Assistant"
              subtitle="Speak your Class 9 Maths question, review the recognized text, then get a step-by-step AI answer"
            />

            <div className="p-6 max-w-5xl w-full mx-auto space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Mic control */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Mic className="w-4 h-4 text-indigo-600" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">1. Speak your question</h3>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Languages className="w-3.5 h-3.5 text-slate-400" />
                      <select
                        value={speechLang}
                        onChange={(e) => {
                          if (isListening) stopListening();
                          setSpeechLang(e.target.value);
                        }}
                        disabled={isListening}
                        aria-label="Recognition language"
                        className="text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-slate-700 dark:text-slate-300"
                      >
                        {SPEECH_LANGUAGES.map((l) => (
                          <option key={l.code} value={l.code}>
                            {l.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col items-center py-6">
                    <button
                      type="button"
                      onClick={isListening ? stopListening : startListening}
                      disabled={supported === false}
                      aria-label={isListening ? 'Stop listening' : 'Start listening'}
                      className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all focus:outline-none focus:ring-4 ${
                        isListening
                          ? 'bg-rose-500 hover:bg-rose-600 text-white ring-rose-200 animate-pulse'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white ring-indigo-200'
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      {isListening ? <Square className="w-9 h-9" /> : <Mic className="w-9 h-9" />}
                    </button>

                    <p className="mt-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {supported === false
                        ? 'Speech recognition unavailable in this browser'
                        : isListening
                          ? 'Listening… speak your maths question'
                          : 'Tap the microphone to start'}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400 text-center max-w-xs">
                      Your browser will ask for microphone permission. Recognized text only goes to the review box —
                      nothing is sent automatically.
                    </p>
                    {isListening && (
                      <Badge variant="danger" size="sm" className="mt-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5" /> Recording
                      </Badge>
                    )}
                  </div>

                  {micError && (
                    <div
                      className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 p-3 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200"
                      role="alert"
                    >
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{micError}</span>
                    </div>
                  )}
                </Card>
                {/* Review + send */}
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Keyboard className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      2. Review &amp; edit before sending
                    </h3>
                  </div>

                  <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Recognized speech appears here. You can also type your Class 9 Maths question directly…"
                    rows={6}
                    aria-label="Recognized question (editable)"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm text-slate-800 dark:text-slate-200 resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />

                  {isListening && interim && (
                    <p className="mt-1 text-xs text-slate-400 italic" aria-live="polite">
                      {interim}
                      <span className="ml-1 not-italic">▌</span>
                    </p>
                  )}

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{transcript.trim().length} characters</span>
                    <button
                      type="button"
                      onClick={() => {
                        setTranscript('');
                        setInterim('');
                      }}
                      className="inline-flex items-center gap-1 hover:text-rose-500 transition-colors"
                    >
                      <Eraser className="w-3 h-3" /> Clear
                    </button>
                  </div>

                  {sendError && (
                    <div
                      className="mt-3 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-300"
                      role="alert"
                    >
                      {sendError}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      onClick={sendRecognizedQuestion}
                      disabled={!transcript.trim() || isSending}
                      rightIcon={<Send className="w-3.5 h-3.5" />}
                    >
                      {isSending ? 'Thinking…' : 'Send to AI Maths Tutor'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={isListening ? stopListening : startListening}
                      disabled={supported === false}
                    >
                      {isListening ? 'Stop recording' : 'Record again'}
                    </Button>
                  </div>
                  <p className="mt-3 text-[11px] text-slate-400">
                    The AI only answers Class 9 Mathematics syllabus questions — unrelated or abusive input is declined.
                  </p>
                </Card>
              </div>
              {/* Conversation with the AI tutor (same messages API as Smart AI Chatbot) */}
              <Card className="p-0 overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-200 dark:border-slate-800">
                  <Bot className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">3. Conversation</h3>
                  <Badge variant="primary" size="sm" className="ml-auto">
                    Class 9 Maths only
                  </Badge>
                </div>

                <div className="max-h-[480px] overflow-y-auto p-5 space-y-4">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex items-start gap-3 ${m.sender === 'student' ? 'flex-row-reverse' : ''}`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                          m.sender === 'student'
                            ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {m.sender === 'student' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                      </div>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                          m.sender === 'student'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <MixedMathText text={m.content} />
                        <div className="mt-1 text-[10px] opacity-60">
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}

                  {isSending && (
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <Bot className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                      <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 px-4 py-3 flex gap-1">
                        {[0, 150, 300].map((delay) => (
                          <span
                            key={delay}
                            className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
                            style={{ animationDelay: `${delay}ms` }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                  <p className="text-[11px] text-slate-400">
                    Hands-free input with review — the mic never sends anything on its own.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMessages(INITIAL_MESSAGES)}
                    rightIcon={<RotateCcw className="w-3 h-3" />}
                  >
                    Reset chat
                  </Button>
                </div>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}

