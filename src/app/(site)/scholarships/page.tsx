import type { Metadata } from 'next';

import { PageHero } from '@/components/site/page-hero';
import { Badge, ButtonLink, Card, CardBody, EmptyState } from '@/components/ui';
import { getScholarships } from '@/lib/queries';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Scholarships',
  description: 'Scholarships and bursaries at RuMax Global Digital University — merit, need, and targeted funds.',
  alternates: { canonical: '/scholarships' },
};

export const revalidate = 600;

export default async function ScholarshipsPage() {
  const scholarships = await getScholarships();

  return (
    <>
      <PageHero
        eyebrow="Funding"
        title="Scholarships"
        description="About one student in five holds some form of award. Applying costs nothing and does not affect your admission decision."
      >
        <ButtonLink href="/apply" size="lg">
          Apply and flag your interest
        </ButtonLink>
      </PageHero>

      <section className="rx-container py-14">
        {scholarships.length === 0 ? (
          <EmptyState title="No schemes published" description="Scholarship schemes will appear here." />
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {scholarships.map((scholarship) => {
              const open = scholarship.deadline >= new Date();
              return (
                <Card key={scholarship.id} className="flex h-full flex-col p-6">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge tone="brand">{scholarship.coveragePct}% of tuition</Badge>
                    <Badge>{scholarship.slots} places</Badge>
                    <Badge tone={open ? 'success' : 'neutral'}>{open ? 'Open' : 'Closed'}</Badge>
                  </div>

                  <h2 className="font-display text-lg font-semibold leading-snug">{scholarship.name}</h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{scholarship.description}</p>

                  <div className="mt-5 border-t border-border pt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Eligibility</p>
                    <ul className="space-y-1.5 text-sm text-muted">
                      {scholarship.eligibility.map((criterion) => (
                        <li key={criterion}>· {criterion}</li>
                      ))}
                    </ul>
                    <p className="mt-4 text-xs text-muted">
                      Closes {formatDate(scholarship.deadline, 'en', { dateStyle: 'full' })}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <Card className="mt-10">
          <CardBody className="prose-rx">
            <h2>How awards are decided</h2>
            <p>
              A panel of three reviews every application against published criteria and scores it
              independently before conferring. Where a scheme is need-based we ask for evidence of
              income; where it is merit-based we do not, because financial circumstances should not
              influence a merit decision in either direction.
            </p>
            <p>
              We tell every applicant the outcome within four weeks of the closing date, successful
              or not. Unsuccessful applicants get their scores and the band they fell into, which is
              usually more useful than the decision itself.
            </p>
          </CardBody>
        </Card>
      </section>
    </>
  );
}
