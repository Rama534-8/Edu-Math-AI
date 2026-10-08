'use client';

import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathRendererProps {
  math?: string;
  inline?: boolean;
  className?: string;
  fallbackText?: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({
  math,
  inline = true,
  className = '',
  fallbackText,
}) => {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!containerRef.current || !math) return;

    try {
      katex.render(math, containerRef.current, {
        displayMode: !inline,
        throwOnError: false,
      });
    } catch {
      if (containerRef.current) {
        containerRef.current.textContent = fallbackText || math;
      }
    }
  }, [math, inline, fallbackText]);

  if (!math) return null;

  return (
    <span
      ref={containerRef}
      className={`inline-block math-rendered ${className}`}
    />
  );
};

/**
 * Text renderer that automatically detects $...$ or $$...$$ formulas in mixed markdown/text
 *
 * Defensive: the curriculum passes plain strings here, but the renderer is used
 * from many lesson surfaces. If a caller ever supplies a non-string (e.g. a step
 * object), render nothing instead of throwing `text.split is not a function`
 * or leaking `[object Object]` into the page.
 */
export const MixedMathText: React.FC<{ text?: string | null; className?: string }> = ({
  text,
  className = '',
}) => {
  if (typeof text !== 'string' || !text) return null;

  // Split text by $...$ and $$...$$
  const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^\$]+?\$)/g);

  return (
    <span className={`inline-block ${className}`}>
      {parts.map((part, idx) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const formula = part.slice(2, -2);
          return (
            <div key={idx} className="my-2 overflow-x-auto text-center">
              <MathRenderer math={formula} inline={false} />
            </div>
          );
        } else if (part.startsWith('$') && part.endsWith('$')) {
          const formula = part.slice(1, -1);
          return (
            <MathRenderer key={idx} math={formula} inline={true} className="mx-1" />
          );
        }
        return <span key={idx}>{part}</span>;
      })}
    </span>
  );
};
