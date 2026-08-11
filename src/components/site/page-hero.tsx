import type { ReactNode } from 'react';

import { Breadcrumbs } from '@/components/ui';

/**
 * Standard hero for interior marketing pages. Keeping every page on one hero component
 * is what stops a 40-page site drifting into 40 slightly different headers.
 */
export function PageHero({
  eyebrow,
  title,
  description,
  breadcrumbs,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  children?: ReactNode;
}) {
  return (
    <section className="border-b border-border bg-mesh">
      <div className="rx-container py-14 sm:py-16">
        {breadcrumbs ? <Breadcrumbs items={breadcrumbs} /> : null}
        {eyebrow ? (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand">{eyebrow}</p>
        ) : null}
        <h1 className="max-w-3xl font-display text-4xl font-semibold leading-tight sm:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">{description}</p>
        ) : null}
        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </section>
  );
}
