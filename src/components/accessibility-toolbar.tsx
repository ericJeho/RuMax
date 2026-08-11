'use client';

import { useState } from 'react';
import { Accessibility, Contrast, Moon, Sun, Type, Monitor } from 'lucide-react';

import { cn } from '@/lib/cn';
import { useTheme, type TextScale } from './theme-provider';

/**
 * Floating accessibility controls, available on every page.
 *
 * These duplicate settings a user may already have at OS level on purpose: shared and
 * public machines are common for our students, and per-site control is the difference
 * between a usable site and an unusable one for them.
 */
export function AccessibilityToolbar() {
  const [open, setOpen] = useState(false);
  const { theme, setTheme, highContrast, setHighContrast, textScale, setTextScale } = useTheme();

  const scales: { value: TextScale; label: string }[] = [
    { value: 100, label: 'Default' },
    { value: 110, label: 'Large' },
    { value: 125, label: 'Larger' },
  ];

  return (
    <div className="no-print fixed bottom-4 left-4 z-50">
      {open ? (
        <div
          role="dialog"
          aria-label="Accessibility settings"
          className="mb-2 w-72 rounded-2xl border border-border bg-surface p-4 shadow-lift"
        >
          <p className="mb-3 text-sm font-semibold">Accessibility</p>

          <fieldset className="mb-4">
            <legend className="mb-1.5 text-xs font-medium text-muted">Appearance</legend>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { value: 'light', label: 'Light', Icon: Sun },
                  { value: 'dark', label: 'Dark', Icon: Moon },
                  { value: 'system', label: 'System', Icon: Monitor },
                ] as const
              ).map(({ value, label, Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  aria-pressed={theme === value}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-xl border px-2 py-2 text-xs transition',
                    theme === value
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-border text-muted hover:bg-surface-2',
                  )}
                >
                  <Icon size={15} aria-hidden />
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="mb-4">
            <legend className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted">
              <Type size={13} aria-hidden /> Text size
            </legend>
            <div className="grid grid-cols-3 gap-1.5">
              {scales.map((scale) => (
                <button
                  key={scale.value}
                  onClick={() => setTextScale(scale.value)}
                  aria-pressed={textScale === scale.value}
                  className={cn(
                    'rounded-xl border px-2 py-1.5 text-xs transition',
                    textScale === scale.value
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-border text-muted hover:bg-surface-2',
                  )}
                >
                  {scale.label}
                </button>
              ))}
            </div>
          </fieldset>

          <button
            onClick={() => setHighContrast(!highContrast)}
            aria-pressed={highContrast}
            className={cn(
              'flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-xs transition',
              highContrast
                ? 'border-brand bg-brand/10 text-brand'
                : 'border-border text-muted hover:bg-surface-2',
            )}
          >
            <Contrast size={14} aria-hidden />
            High contrast {highContrast ? 'on' : 'off'}
          </button>

          <p className="mt-3 text-[11px] leading-relaxed text-muted">
            Motion is reduced automatically when your device requests it. Full details on our{' '}
            <a href="/accessibility" className="text-brand underline">
              accessibility statement
            </a>
            .
          </p>
        </div>
      ) : null}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Accessibility settings"
        className="grid h-11 w-11 place-items-center rounded-full border border-border bg-surface text-brand shadow-lift transition hover:scale-105"
      >
        <Accessibility size={20} aria-hidden />
      </button>
    </div>
  );
}
