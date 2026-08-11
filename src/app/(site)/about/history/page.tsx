import type { Metadata } from 'next';

import { PageHero } from '@/components/site/page-hero';
import { Card, CardBody } from '@/components/ui';
import { Reveal } from '@/components/motion';
import { MILESTONES, SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'History',
  description: `From a Blantyre institute with 240 students in ${SITE.founded} to a digital university teaching across 140 countries.`,
  alternates: { canonical: '/about/history' },
};

export default function HistoryPage() {
  return (
    <>
      <PageHero
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'About', href: '/about' }, { label: 'History' }]}
        eyebrow="About"
        title="Our history"
        description="Every institution tells its history as inevitable. Ours was not — it is a record of decisions, some of which took years to prove right."
      />

      <section className="rx-container py-14">
        <ol className="relative mx-auto max-w-3xl border-l border-border pl-8">
          {MILESTONES.map((milestone, index) => (
            <Reveal key={milestone.year} delay={index * 0.04}>
              <li className="relative mb-10 last:mb-0">
                <span
                  aria-hidden
                  className="absolute -left-[41px] grid h-6 w-6 place-items-center rounded-full border-2 border-bg bg-brand text-[10px] font-bold text-brand-fg"
                >
                  •
                </span>
                <p className="font-mono text-sm text-brand">{milestone.year}</p>
                <h2 className="mt-1 font-display text-xl font-semibold">{milestone.title}</h2>
                <p className="mt-2 leading-relaxed text-muted">{milestone.body}</p>
              </li>
            </Reveal>
          ))}
        </ol>

        <Card className="mx-auto mt-12 max-w-3xl">
          <CardBody>
            <h2 className="font-display text-lg font-semibold">The decision that mattered most</h2>
            <p className="mt-2 leading-relaxed text-muted">
              In 2011 the Senate voted to retire the last on-campus lecture. It was contested: staff
              feared quality would fall and enrolment would collapse. Enrolment fell 12% in the first
              year and then tripled over the next four, and completion rates rose once students no
              longer had to choose between a lecture and a shift. The lesson we took was not that
              online is better — it is that the constraint we had been optimising around, physical
              attendance, was never the thing that produced learning.
            </p>
          </CardBody>
        </Card>
      </section>
    </>
  );
}
