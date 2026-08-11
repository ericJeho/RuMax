import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, Circle } from 'lucide-react';

import { Alert, Badge, Card, CardBody, CardHeader, CardTitle, StatusBadge } from '@/components/ui';
import { PageHero } from '@/components/site/page-hero';
import { StatusLookup } from './lookup';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { safeQuery } from '@/lib/queries';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Track your application',
  description: 'Check the progress of your RuMax Global Digital University application.',
  robots: { index: false, follow: true },
};

export const dynamic = 'force-dynamic';

/** The stages an application passes through, in order, for the progress display. */
const STAGES = [
  { key: 'SUBMITTED', label: 'Submitted', detail: 'We have your application.' },
  { key: 'UNDER_REVIEW', label: 'Under review', detail: 'An admissions officer is assessing it.' },
  { key: 'INTERVIEW', label: 'Interview', detail: 'Some programmes interview before deciding.' },
  { key: 'OFFER_MADE', label: 'Decision', detail: 'An offer has been issued or the application declined.' },
  { key: 'ENROLLED', label: 'Enrolled', detail: 'You are a registered student.' },
];

export default async function ApplicationStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  const { reference } = await searchParams;
  const user = await getCurrentUser();

  // Signed-in applicants see their own applications; anyone else looks one up by
  // reference and email, which is the pair only the applicant should hold.
  const applications = await safeQuery(
    'application-status',
    () =>
      prisma.application.findMany({
        where: user
          ? { OR: [{ userId: user.id }, { email: user.email }] }
          : reference
            ? { reference: reference.trim().toUpperCase() }
            : { id: '__none__' },
        include: { program: { select: { title: true, code: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    [],
  );

  return (
    <>
      <PageHero
        eyebrow="Admissions"
        title="Track your application"
        description="Every stage, with the date it happened. If something looks stuck for more than five working days, contact us — it usually means we are waiting on a document."
      />

      <section className="rx-container py-14">
        <div className="mx-auto max-w-3xl space-y-6">
          {!user ? <StatusLookup initialReference={reference} /> : null}

          {applications.length === 0 ? (
            <Alert tone="info">
              {reference
                ? 'No application found with that reference. Check the reference from your confirmation email, or sign in if you applied with an account.'
                : user
                  ? 'You have no applications yet.'
                  : 'Enter your application reference above to see its progress.'}{' '}
              <Link href="/apply" className="font-medium underline">
                Start a new application
              </Link>
            </Alert>
          ) : null}

          {applications.map((application) => {
            const currentIndex = STAGES.findIndex((stage) => stage.key === application.status);
            const decided = ['OFFER_MADE', 'ACCEPTED', 'ENROLLED', 'REJECTED', 'DECLINED'].includes(
              application.status,
            );

            return (
              <Card key={application.id}>
                <CardHeader className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle as="h2">{application.program.title}</CardTitle>
                    <p className="mt-0.5 font-mono text-xs text-muted">{application.reference}</p>
                  </div>
                  <StatusBadge status={application.status} />
                </CardHeader>

                <CardBody>
                  <ol className="mb-6 space-y-4">
                    {STAGES.map((stage, index) => {
                      const reached =
                        application.status === 'REJECTED' || application.status === 'DECLINED'
                          ? index <= 3
                          : index <= (currentIndex === -1 ? 3 : currentIndex);

                      return (
                        <li key={stage.key} className="flex gap-3">
                          {reached ? (
                            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-success" aria-hidden />
                          ) : (
                            <Circle size={18} className="mt-0.5 shrink-0 text-muted/40" aria-hidden />
                          )}
                          <span>
                            <span className={reached ? 'font-medium' : 'text-muted'}>{stage.label}</span>
                            <span className="block text-xs text-muted">{stage.detail}</span>
                          </span>
                        </li>
                      );
                    })}
                  </ol>

                  <dl className="grid gap-x-8 gap-y-3 border-t border-border pt-5 text-sm sm:grid-cols-2">
                    <Row label="Submitted" value={formatDate(application.submittedAt)} />
                    <Row label="Intake" value={application.intakeTerm ?? '—'} />
                    <Row
                      label="Application fee"
                      value={application.applicationFeePaid ? 'Paid' : 'Outstanding'}
                    />
                    <Row
                      label="Last updated"
                      value={formatDate(application.reviewedAt ?? application.updatedAt)}
                    />
                    {application.interviewAt ? (
                      <Row label="Interview" value={formatDate(application.interviewAt)} />
                    ) : null}
                    {application.offerExpiresAt ? (
                      <Row label="Offer expires" value={formatDate(application.offerExpiresAt)} />
                    ) : null}
                  </dl>

                  {application.status === 'OFFER_MADE' ? (
                    <Alert tone="success" title="You have an offer" className="mt-5">
                      Congratulations. Accept your place from the link in your offer email, or by
                      replying to admissions. The offer is open until{' '}
                      {formatDate(application.offerExpiresAt)}.
                    </Alert>
                  ) : null}

                  {application.status === 'REJECTED' ? (
                    <Alert tone="info" title="Not successful this time" className="mt-5">
                      We are sorry. You may apply again for a future intake, and admissions can
                      advise on what would strengthen an application — many successful students
                      applied more than once.
                    </Alert>
                  ) : null}

                  {!decided ? (
                    <p className="mt-5 text-xs leading-relaxed text-muted">
                      Most applications receive a first decision within five working days of being
                      submitted. Delays are almost always a missing or unclear document.
                    </p>
                  ) : null}
                </CardBody>
              </Card>
            );
          })}

          <Card>
            <CardBody className="text-sm leading-relaxed text-muted">
              <p className="mb-2 font-display text-base font-semibold text-fg">Need help?</p>
              Email <a href="mailto:admissions@rumax.edu" className="text-brand underline">admissions@rumax.edu</a>{' '}
              quoting your reference, or raise a ticket at the{' '}
              <Link href="/support" className="text-brand underline">
                help desk
              </Link>
              . <Badge className="ml-1">Median first response: 6 hours</Badge>
            </CardBody>
          </Card>
        </div>
      </section>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}
