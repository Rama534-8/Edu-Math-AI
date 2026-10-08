'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    // Read saved preference or default to dark (since app has dark design)
    const saved = localStorage.getItem('edumathaiTheme') as Theme | null;
    const resolved: Theme = saved ?? 'dark';
    setTheme(resolved);
    applyTheme(resolved);
  }, []);

  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    if (t === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => {
      const next: Theme = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('edumathaiTheme', next);
      applyTheme(next);
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const ThemeToggleButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
      className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 
        bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700
        text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400
        border border-slate-200 dark:border-slate-700 shadow-sm ${className}`}
    >
      <span className="transition-all duration-300">
        {theme === 'dark' ? (
          <Sun className="w-4 h-4" />
        ) : (
          <Moon className="w-4 h-4" />
        )}
      </span>
    </button>
  );
};
