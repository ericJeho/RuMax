'use client';

import { useEffect, useState } from 'react';
import { Globe } from 'lucide-react';

import { LANGUAGES, type LanguageCode } from '@/lib/site';
import { cn } from '@/lib/cn';

const STORAGE_KEY = 'rumax:lang';

/**
 * Language selection.
 *
 * The chosen locale is persisted and applied to `<html lang>`/`dir` immediately — RTL
 * for Arabic — and sent to the server on the next request via the `rumax_lang` cookie so
 * server-rendered content can be translated too. Message catalogues live in
 * `src/i18n/`; anything not yet translated falls back to English rather than showing a
 * missing-key placeholder.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const [current, setCurrent] = useState<LanguageCode>('en');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
    if (stored && LANGUAGES.some((l) => l.code === stored)) setCurrent(stored);
  }, []);

  const choose = (code: LanguageCode) => {
    const language = LANGUAGES.find((l) => l.code === code);
    setCurrent(code);
    setOpen(false);
    localStorage.setItem(STORAGE_KEY, code);
    document.cookie = `rumax_lang=${code}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = code;
    document.documentElement.dir = language?.dir ?? 'ltr';
  };

  const active = LANGUAGES.find((l) => l.code === current) ?? LANGUAGES[0];

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted transition hover:text-brand"
      >
        <Globe size={14} aria-hidden />
        {active.native}
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-label="Select language"
          className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-border bg-surface p-1 shadow-lift"
        >
          {LANGUAGES.map((language) => (
            <li key={language.code}>
              <button
                role="option"
                aria-selected={language.code === current}
                onClick={() => choose(language.code)}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition hover:bg-surface-2',
                  language.code === current && 'text-brand',
                )}
              >
                <span>{language.native}</span>
                <span className="text-xs text-muted">{language.label}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
