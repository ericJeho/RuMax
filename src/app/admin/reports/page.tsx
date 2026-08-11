import type { Metadata } from 'next';
import { Download, FileSpreadsheet } from 'lucide-react';

import { Card, CardBody, CardHeader, CardTitle, PageHeader } from '@/components/ui';
import { requireRole } from '@/lib/auth';

export const metadata: Metadata = { title: 'Reports' };
export const dynamic = 'force-dynamic';

const REPORTS = [
  {
    name: 'Enrolment census',
    description: 'Headcount by programme, level, year of study, country and gender at a chosen census date.',
    endpoint: '/api/reports/enrolment',
    audience: 'Statutory return to the higher education authority',
  },
  {
    name: 'Attainment and progression',
    description: 'Pass rates, mean marks and progression by programme and cohort, with year-on-year comparison.',
    endpoint: '/api/reports/attainment',
    audience: 'Senate and external examiners',
  },
  {
    name: 'Financial position',
    description: 'Tuition billed, collected, outstanding and written off, split by programme and payment method.',
    endpoint: '/api/reports/finance',
    audience: 'Council finance committee',
  },
  {
    name: 'Admissions cycle',
    description: 'Applications, offers, acceptances and enrolments by programme, with conversion at each stage.',
    endpoint: '/api/reports/admissions',
    audience: 'Marketing and admissions planning',
  },
  {
    name: 'Retention and withdrawal',
    description: 'Students who withdrew or interrupted, with time-to-withdrawal and recorded reasons.',
    endpoint: '/api/reports/retention',
    audience: 'Student experience committee',
  },
  {
    name: 'Research output',
    description: 'Publications, citations, funding held and doctoral completions by faculty.',
    endpoint: '/api/reports/research',
    audience: 'Research and innovation committee',
  },
];

export default async function ReportsPage() {
  await requireRole('ADMIN', 'REGISTRAR', 'FINANCE');

  return (
    <>
      <PageHeader
        title="Reports"
        description="Standing reports, generated live from the student record. Each returns JSON suitable for the statutory return format or a spreadsheet."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {REPORTS.map((report) => (
          <Card key={report.name}>
            <CardHeader className="flex items-start justify-between gap-3">
              <CardTitle>{report.name}</CardTitle>
              <FileSpreadsheet size={17} className="shrink-0 text-muted" aria-hidden />
            </CardHeader>
            <CardBody>
              <p className="text-sm leading-relaxed text-muted">{report.description}</p>
              <p className="mt-3 text-xs text-muted">
                <span className="font-medium text-fg">Prepared for:</span> {report.audience}
              </p>
              <a href={report.endpoint} className="btn-secondary mt-4 w-full text-sm" download>
                <Download size={14} aria-hidden />
                Generate
              </a>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardBody>
          <h2 className="mb-2 font-display text-base font-semibold">Ad-hoc analysis</h2>
          <p className="text-sm leading-relaxed text-muted">
            For anything not covered here, the GraphQL endpoint at{' '}
            <code className="rounded bg-surface-2 px-1.5 py-0.5 text-brand">/api/graphql</code> exposes the
            same data with an explorer, and the REST API is documented in{' '}
            <code className="rounded bg-surface-2 px-1.5 py-0.5 text-brand">docs/API.md</code>. Direct
            database access is available to the institutional research office through a read replica —
            never against the primary.
          </p>
        </CardBody>
      </Card>
    </>
  );
}
