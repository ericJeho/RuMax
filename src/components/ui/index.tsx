import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import Link from 'next/link';

import { cn } from '@/lib/cn';

/* ------------------------------------------------------------------ Button */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
type ButtonSize = 'sm' | 'md' | 'lg';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-brand-fg hover:brightness-110 active:brightness-95 shadow-sm',
  secondary: 'border border-border bg-surface text-fg hover:bg-surface-2',
  ghost: 'text-fg hover:bg-surface-2',
  danger: 'bg-danger text-white hover:brightness-110',
  accent: 'bg-accent text-white hover:brightness-110',
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

const BUTTON_BASE =
  'inline-flex select-none items-center justify-center gap-2 rounded-xl font-semibold transition disabled:pointer-events-none disabled:opacity-50';

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ComponentPropsWithoutRef<'button'> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <button
      className={cn(BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className)}
      {...props}
    />
  );
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ComponentPropsWithoutRef<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <Link
      className={cn(BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className)}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------- Card */

export function Card({
  className,
  glass,
  hover,
  ...props
}: ComponentPropsWithoutRef<'div'> & { glass?: boolean; hover?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border shadow-sm',
        glass ? 'glass' : 'bg-surface',
        hover && 'transition duration-300 hover:-translate-y-1 hover:shadow-lift',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div className={cn('border-b border-border px-5 py-4', className)} {...props} />;
}

export function CardTitle({
  as: Tag = 'h3',
  className,
  ...props
}: ComponentPropsWithoutRef<'h3'> & { as?: ElementType }) {
  return <Tag className={cn('text-base font-semibold text-fg', className)} {...props} />;
}

export function CardBody({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div className={cn('px-5 py-4', className)} {...props} />;
}

export function CardFooter({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return (
    <div className={cn('border-t border-border px-5 py-3 text-sm text-muted', className)} {...props} />
  );
}

/* ------------------------------------------------------------------- Badge */

export type BadgeTone =
  | 'neutral'
  | 'brand'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'accent';

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: 'border-border bg-surface-2 text-muted',
  brand: 'border-brand/30 bg-brand/10 text-brand',
  success: 'border-success/30 bg-success/10 text-success',
  warning: 'border-warning/30 bg-warning/10 text-warning',
  danger: 'border-danger/30 bg-danger/10 text-danger',
  info: 'border-info/30 bg-info/10 text-info',
  accent: 'border-accent/30 bg-accent/10 text-accent',
};

export function Badge({
  tone = 'neutral',
  className,
  ...props
}: ComponentPropsWithoutRef<'span'> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        BADGE_TONES[tone],
        className,
      )}
      {...props}
    />
  );
}

/** Maps the workflow enums used across the platform onto badge tones. */
export function statusTone(status: string): BadgeTone {
  const s = status.toUpperCase();
  if (['PAID', 'ACTIVE', 'APPROVED', 'SUCCEEDED', 'GRADED', 'ACCEPTED', 'ENROLLED', 'PRESENT', 'COMPLETED', 'PUBLISHED'].includes(s))
    return 'success';
  if (['PENDING', 'DRAFT', 'IN_PROGRESS', 'UNDER_REVIEW', 'PROCESSING', 'SUBMITTED', 'PARTIALLY_PAID', 'LATE', 'INTERVIEW'].includes(s))
    return 'warning';
  if (['FAILED', 'REJECTED', 'OVERDUE', 'SUSPENDED', 'ABSENT', 'CANCELLED', 'DECLINED', 'WITHDRAWN', 'FLAGGED'].includes(s))
    return 'danger';
  if (['OFFER_MADE', 'ISSUED', 'RETURNED', 'EXCUSED'].includes(s)) return 'info';
  return 'neutral';
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge tone={statusTone(status)} className={className}>
      {status.replace(/_/g, ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase())}
    </Badge>
  );
}

/* ------------------------------------------------------------------- Alert */

export function Alert({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const tones = {
    info: 'border-info/30 bg-info/10 text-info',
    success: 'border-success/30 bg-success/10 text-success',
    warning: 'border-warning/30 bg-warning/10 text-warning',
    danger: 'border-danger/30 bg-danger/10 text-danger',
  };
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('rounded-xl border px-4 py-3 text-sm', tones[tone], className)}
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      {children ? <div className={cn(title && 'mt-1', 'text-fg/80')}>{children}</div> : null}
    </div>
  );
}

/* ---------------------------------------------------------------- Progress */

export function ProgressBar({
  value,
  max = 100,
  label,
  tone = 'brand',
  className,
}: {
  value: number;
  max?: number;
  label?: string;
  tone?: 'brand' | 'success' | 'warning' | 'danger';
  className?: string;
}) {
  const pct = max === 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100));
  const tones = { brand: 'bg-brand', success: 'bg-success', warning: 'bg-warning', danger: 'bg-danger' };
  return (
    <div className={className}>
      {label ? (
        <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
          <span>{label}</span>
          <span className="font-medium text-fg">{Math.round(pct)}%</span>
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Progress'}
        className="h-2 w-full overflow-hidden rounded-full bg-surface-2"
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-700', tones[tone])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Avatar */

export function Avatar({
  name,
  src,
  size = 40,
  className,
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const letters = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- avatars come from arbitrary
      // user-supplied S3 URLs; next/image would need every host allow-listed.
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className={cn('rounded-full object-cover', className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-brand-gradient font-semibold text-white',
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {letters || '?'}
    </span>
  );
}

/* ---------------------------------------------------------------- Sections */

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
}) {
  return (
    <div className={cn(align === 'center' && 'mx-auto max-w-2xl text-center', className)}>
      {eyebrow ? (
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand">{eyebrow}</p>
      ) : null}
      <h2 className="text-3xl font-semibold sm:text-4xl">{title}</h2>
      {description ? <p className="mt-3 text-muted">{description}</p> : null}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumb?: ReactNode;
}) {
  return (
    <header className="mb-6">
      {breadcrumb}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
          {description ? <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

/* --------------------------------------------------------------- Stat card */

export function StatCard({
  label,
  value,
  hint,
  icon,
  trend,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  trend?: { direction: 'up' | 'down' | 'flat'; value: string };
  className?: string;
}) {
  const trendTone =
    trend?.direction === 'up' ? 'text-success' : trend?.direction === 'down' ? 'text-danger' : 'text-muted';
  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm text-muted">{label}</p>
          <p className="mt-2 font-display text-3xl font-semibold tabular-nums">{value}</p>
          {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
        </div>
        {icon ? (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
            {icon}
          </span>
        ) : null}
      </div>
      {trend ? (
        <p className={cn('mt-3 text-xs font-medium', trendTone)}>
          {trend.direction === 'up' ? '▲' : trend.direction === 'down' ? '▼' : '■'} {trend.value}
        </p>
      ) : null}
    </Card>
  );
}

/* -------------------------------------------------------------- Empty/Skel */

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
      {icon ? <div className="mx-auto mb-3 text-muted">{icon}</div> : null}
      <p className="font-medium text-fg">{title}</p>
      {description ? <p className="mx-auto mt-1 max-w-md text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-lg bg-surface-2', className)}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-fg/5 to-transparent" />
    </div>
  );
}

/* ------------------------------------------------------------- Breadcrumbs */

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            {item.href && index < items.length - 1 ? (
              <Link href={item.href} className="hover:text-brand hover:underline">
                {item.label}
              </Link>
            ) : (
              <span aria-current={index === items.length - 1 ? 'page' : undefined} className="text-fg">
                {item.label}
              </span>
            )}
            {index < items.length - 1 ? <span aria-hidden>/</span> : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* ------------------------------------------------------------------ Tables */

export function Table({ className, ...props }: ComponentPropsWithoutRef<'table'>) {
  return (
    <div className="scrollbar-thin overflow-x-auto">
      <table className={cn('w-full border-collapse text-left text-sm', className)} {...props} />
    </div>
  );
}

export function Th({ className, ...props }: ComponentPropsWithoutRef<'th'>) {
  return (
    <th
      scope="col"
      className={cn(
        'whitespace-nowrap border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted',
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: ComponentPropsWithoutRef<'td'>) {
  return <td className={cn('border-b border-border/60 px-4 py-3 align-middle', className)} {...props} />;
}
