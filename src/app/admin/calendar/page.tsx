import type { Metadata } from 'next';

import { Badge, Card, CardBody, CardHeader, CardTitle, PageHeader } from '@/components/ui';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Academic calendar' };
export const dynamic = 'force-dynamic';

export default async function AdminCalendarPage() {
  await requireRole('ADMIN', 'REGISTRAR');

  const terms = await prisma.academicTerm.findMany({
    include: { _count: { select: { registrations: true, grades: true } } },
    orderBy: { startDate: 'desc' },
  });

  return (
    <>
      <PageHeader
        title="Academic calendar"
        description="Terms, registration windows and examination periods. These dates drive registration eligibility and assessment availability across the platform."
      />

      <div className="space-y-4">
        {terms.map((term) => (
          <Card key={term.id} className={term.isCurrent ? 'border-brand/50' : undefined}>
            <CardHeader className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle as="h2">{term.name}</CardTitle>
              <div className="flex gap-1.5">
                {term.isCurrent ? <Badge tone="brand">Current</Badge> : null}
                <Badge>{term.academicYear}</Badge>
                <Badge>{term._count.registrations} registrations</Badge>
              </div>
            </CardHeader>
            <CardBody>
              <dl className="grid gap-4 text-sm sm:grid-cols-3 lg:grid-cols-5">
                <Entry label="Term starts" value={formatDate(term.startDate)} />
                <Entry label="Term ends" value={formatDate(term.endDate)} />
                <Entry label="Registration opens" value={formatDate(term.registrationOpens)} />
                <Entry label="Registration closes" value={formatDate(term.registrationCloses)} />
                <Entry
                  label="Examinations"
                  value={
                    term.examStart && term.examEnd
                      ? `${formatDate(term.examStart)} – ${formatDate(term.examEnd)}`
                      : 'Not scheduled'
                  }
                />
              </dl>
            </CardBody>
          </Card>
        ))}
      </div>
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
