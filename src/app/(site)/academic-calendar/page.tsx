import type { Metadata } from 'next';

import { PageHero } from '@/components/site/page-hero';
import { Badge, Card, CardBody, CardHeader, CardTitle, EmptyState } from '@/components/ui';
import { prisma } from '@/lib/db';
import { safeQuery } from '@/lib/queries';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Academic calendar',
  description: 'Term dates, registration windows and examination periods.',
  alternates: { canonical: '/academic-calendar' },
};

export const revalidate = 3600;

export default async function AcademicCalendarPage() {
  const terms = await safeQuery(
    'calendar',
    () => prisma.academicTerm.findMany({ orderBy: { startDate: 'asc' } }),
    [],
  );

  return (
    <>
      <PageHero
        eyebrow="Academics"
        title="Academic calendar"
        description="All dates are UTC. Deadlines fall at 23:59 UTC on the date shown, which the portal converts to your own timezone."
      />

      <section className="rx-container py-14">
        {terms.length === 0 ? (
          <EmptyState title="No terms published" description="Term dates will appear here." />
        ) : (
          <div className="mx-auto max-w-3xl space-y-5">
            {terms.map((term) => (
              <Card key={term.id} className={term.isCurrent ? 'border-brand/50' : undefined}>
                <CardHeader className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle as="h2">{term.name}</CardTitle>
                  {term.isCurrent ? <Badge tone="brand">Current term</Badge> : null}
                </CardHeader>
                <CardBody>
                  <dl className="grid gap-4 text-sm sm:grid-cols-2">
                    <Entry label="Registration opens" value={formatDate(term.registrationOpens, 'en', { dateStyle: 'full' })} />
                    <Entry label="Registration closes" value={formatDate(term.registrationCloses, 'en', { dateStyle: 'full' })} />
                    <Entry label="Teaching starts" value={formatDate(term.startDate, 'en', { dateStyle: 'full' })} />
                    <Entry label="Teaching ends" value={formatDate(term.endDate, 'en', { dateStyle: 'full' })} />
                    {term.examStart ? (
                      <Entry label="Examinations" value={`${formatDate(term.examStart)} – ${formatDate(term.examEnd)}`} />
                    ) : null}
                  </dl>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function Entry({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}
