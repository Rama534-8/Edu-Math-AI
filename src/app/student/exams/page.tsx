'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Legacy /student/exams route — redirects to the full Mock Exam system.
 */
export default function ExamsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/student/mock-exams');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <p className="text-slate-500 text-sm">Redirecting to Mock Exams…</p>
    </div>
  );
}
