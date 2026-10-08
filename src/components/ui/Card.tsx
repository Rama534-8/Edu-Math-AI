'use client';

import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  glass?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverEffect = false,
  glass = false,
  padding = 'md',
  className = '',
  ...props
}) => {
  const paddings = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const glassStyle = glass
    ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/20 dark:border-slate-800/50 shadow-xl'
    : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm';

  const hoverStyle = hoverEffect
    ? 'hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-800 transition-all duration-200 transform hover:-translate-y-0.5'
    : '';

  return (
    <div
      className={`rounded-2xl ${glassStyle} ${hoverStyle} ${paddings[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
