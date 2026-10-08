'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingState: React.FC<{ message?: string; className?: string }> = ({
  message = 'Analyzing mathematical equations...',
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="relative w-12 h-12 mb-4">
        <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-indigo-950 animate-pulse" />
        <Loader2 className="w-12 h-12 text-indigo-600 dark:text-indigo-400 animate-spin" />
      </div>
      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{message}</p>
    </div>
  );
};
