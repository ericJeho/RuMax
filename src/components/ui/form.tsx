import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Accessible form primitives.
 *
 * Every field is label-associated, errors are announced via `aria-describedby` +
 * `role="alert"`, and required fields are marked both visually and with `aria-required`
 * rather than relying on the asterisk alone.
 */

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-4', className)}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-fg">
        {label}
        {required ? (
          <>
            <span aria-hidden className="ml-0.5 text-danger">
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        ) : null}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${htmlFor}-hint`} className="mt-1 text-xs text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="mt-1 text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const CONTROL =
  'w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm text-fg placeholder:text-muted/70 focus:outline-none focus:ring-2 disabled:opacity-60';

export function Input({
  className,
  invalid,
  ...props
}: ComponentPropsWithoutRef<'input'> & { invalid?: boolean }) {
  return (
    <input
      className={cn(
        CONTROL,
        invalid ? 'border-danger focus:ring-danger/30' : 'border-border focus:border-brand focus:ring-brand/30',
        className,
      )}
      aria-invalid={invalid || undefined}
      aria-describedby={props.id ? (invalid ? `${props.id}-error` : `${props.id}-hint`) : undefined}
      {...props}
    />
  );
}

export function Textarea({
  className,
  invalid,
  ...props
}: ComponentPropsWithoutRef<'textarea'> & { invalid?: boolean }) {
  return (
    <textarea
      className={cn(
        CONTROL,
        'min-h-28 resize-y',
        invalid ? 'border-danger focus:ring-danger/30' : 'border-border focus:border-brand focus:ring-brand/30',
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

export function Select({
  className,
  invalid,
  children,
  ...props
}: ComponentPropsWithoutRef<'select'> & { invalid?: boolean }) {
  return (
    <select
      className={cn(
        CONTROL,
        'appearance-none bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat pr-10',
        invalid ? 'border-danger focus:ring-danger/30' : 'border-border focus:border-brand focus:ring-brand/30',
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23606580'%3E%3Cpath d='M5.5 7.5 10 12l4.5-4.5' stroke='%23606580' stroke-width='1.6' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")",
      }}
      aria-invalid={invalid || undefined}
      {...props}
    >
      {children}
    </select>
  );
}

export function Checkbox({
  label,
  className,
  description,
  ...props
}: ComponentPropsWithoutRef<'input'> & { label: string; description?: string }) {
  return (
    <label className={cn('flex cursor-pointer items-start gap-3 text-sm', className)}>
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-brand focus:ring-2 focus:ring-brand/40"
        {...props}
      />
      <span>
        <span className="font-medium text-fg">{label}</span>
        {description ? <span className="block text-xs text-muted">{description}</span> : null}
      </span>
    </label>
  );
}

export function Radio({
  label,
  description,
  className,
  ...props
}: ComponentPropsWithoutRef<'input'> & { label: string; description?: string }) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 text-sm transition hover:bg-surface-2 has-[:checked]:border-brand has-[:checked]:bg-brand/5',
        className,
      )}
    >
      <input
        type="radio"
        className="mt-0.5 h-4 w-4 shrink-0 border-border text-brand focus:ring-2 focus:ring-brand/40"
        {...props}
      />
      <span>
        <span className="font-medium text-fg">{label}</span>
        {description ? <span className="block text-xs text-muted">{description}</span> : null}
      </span>
    </label>
  );
}

export function Fieldset({
  legend,
  description,
  children,
  className,
}: {
  legend: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={cn('mb-6', className)}>
      <legend className="mb-1 font-display text-lg font-semibold text-fg">{legend}</legend>
      {description ? <p className="mb-4 text-sm text-muted">{description}</p> : null}
      {children}
    </fieldset>
  );
}
