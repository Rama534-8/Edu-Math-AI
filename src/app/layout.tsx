import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import 'katex/dist/katex.min.css';
import { AuthProvider } from '@/lib/auth-context';
import { FloatingChatbot } from '@/components/layout/FloatingChatbot';
import { ThemeProvider } from '@/components/ui/ThemeToggle';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'EduMathAI — AI-Powered Mathematics Learning Platform',
    template: '%s | EduMathAI',
  },
  description:
    'Personalized Class 9 Mathematics learning, practice, assessment and progress tracking powered by AI. Supports CBSE and AP State Board (SCERT) curricula with full English and Telugu medium support.',
  keywords: [
    'EduMathAI',
    'Class 9 Mathematics',
    'CBSE Math',
    'AP State Board Math',
    'AI Math Tutor',
    'AI Mistake Detective',
    'Before and After Learning Improvement',
    'Telugu Math Learning',
    'Mock Exams Class 9',
    'Smart Revision Mathematics',
    'SCERT Class 9',
  ],
  authors: [{ name: 'EduMathAI Team' }],
  creator: 'EduMathAI',
  publisher: 'EduMathAI',
  metadataBase: new URL('https://edumathai.com'),
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://edumathai.com',
    siteName: 'EduMathAI',
    title: 'EduMathAI — AI-Powered Mathematics Learning Platform',
    description:
      'Personalized Class 9 Mathematics learning for CBSE & AP State Board students with AI tutoring, mock exams, smart revision and measurable improvement tracking.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EduMathAI — AI-Powered Mathematics Learning Platform',
    description:
      'Personalized Class 9 Maths for CBSE & AP State Board with AI Tutor, Mock Exams, Mistake Detective, and real Before & After improvement tracking.',
    creator: '@EduMathAI',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <head>
        {/* Apply dark/light class before paint to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('edumathaiTheme');var d=document.documentElement;if(t==='light'){d.classList.remove('dark');}else{d.classList.add('dark');}})();`,
          }}
        />
        {/* Warm the site background image in before first paint */}
        <link
          rel="preload"
          as="image"
          href="/backgrounds/dark-classroom-bg.jpg"
          fetchPriority="high"
        />
      </head>
      <body className="min-h-full flex flex-col text-slate-900 dark:text-slate-100 font-sans">
        <AuthProvider>
          <ThemeProvider>
            {children}
            <FloatingChatbot />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
