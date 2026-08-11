'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

import { cn } from '@/lib/cn';

/* -------------------------------------------------------------------- Tabs */

export function Tabs({
  tabs,
  initial = 0,
  className,
}: {
  tabs: { label: string; content: ReactNode; badge?: string | number }[];
  initial?: number;
  className?: string;
}) {
  const [active, setActive] = useState(initial);
  const baseId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  // Arrow-key navigation between tabs is required by the WAI-ARIA tabs pattern.
  const onKeyDown = (event: React.KeyboardEvent) => {
    const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const next = (active + delta + tabs.length) % tabs.length;
    setActive(next);
    refs.current[next]?.focus();
  };

  return (
    <div className={className}>
      <div role="tablist" onKeyDown={onKeyDown} className="scrollbar-thin flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((tab, index) => (
          <button
            key={tab.label}
            ref={(el) => {
              refs.current[index] = el;
            }}
            role="tab"
            id={`${baseId}-tab-${index}`}
            aria-selected={active === index}
            aria-controls={`${baseId}-panel-${index}`}
            tabIndex={active === index ? 0 : -1}
            onClick={() => setActive(index)}
            className={cn(
              '-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition',
              active === index
                ? 'border-brand text-brand'
                : 'border-transparent text-muted hover:text-fg',
            )}
          >
            {tab.label}
            {tab.badge !== undefined ? (
              <span className="ml-2 rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted">
                {tab.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>
      {tabs.map((tab, index) => (
        <div
          key={tab.label}
          role="tabpanel"
          id={`${baseId}-panel-${index}`}
          aria-labelledby={`${baseId}-tab-${index}`}
          hidden={active !== index}
          className="pt-5"
        >
          {active === index ? tab.content : null}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------- Modal */

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => setMounted(true), []);

  // Escape closes; body scroll locks; focus moves into the dialog and is trapped.
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables?.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previous?.focus();
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'relative max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border border-border bg-surface shadow-lift sm:rounded-2xl',
          widths[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2 id={titleId} className="text-lg font-semibold">
              {title}
            </h2>
            {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-muted transition hover:bg-surface-2 hover:text-fg"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer ? <div className="border-t border-border px-5 py-3">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}

/* ------------------------------------------------------------------ Toasts */

type Toast = { id: number; title: string; body?: string; tone: 'success' | 'danger' | 'info' };
type ToastContextValue = { push: (toast: Omit<Toast, 'id'>) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { ...toast, id }]);
    setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), 5000);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Announced politely so screen readers hear confirmations without interruption. */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto rounded-xl border px-4 py-3 text-sm shadow-lift',
              toast.tone === 'success' && 'border-success/30 bg-success/10 text-success',
              toast.tone === 'danger' && 'border-danger/30 bg-danger/10 text-danger',
              toast.tone === 'info' && 'border-border bg-surface text-fg',
            )}
          >
            <p className="font-semibold">{toast.title}</p>
            {toast.body ? <p className="mt-0.5 text-fg/75">{toast.body}</p> : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  // A no-op fallback keeps components usable in tests and stories without the provider.
  return context ?? { push: () => undefined };
}

/* --------------------------------------------------------------- Accordion */

export function Accordion({
  items,
  className,
}: {
  items: { question: string; answer: ReactNode }[];
  className?: string;
}) {
  return (
    <div className={cn('divide-y divide-border rounded-2xl border border-border bg-surface', className)}>
      {items.map((item) => (
        <details key={item.question} className="group px-5 py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-fg">
            {item.question}
            <span
              aria-hidden
              className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-border text-muted transition group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <div className="mt-3 text-sm leading-relaxed text-muted">{item.answer}</div>
        </details>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------- Copy button */

export function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          setCopied(false);
        }
      }}
      className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted transition hover:bg-surface-2 hover:text-fg"
    >
      {copied ? 'Copied' : label}
    </button>
  );
}
