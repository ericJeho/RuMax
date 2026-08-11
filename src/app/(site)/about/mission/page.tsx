import type { Metadata } from 'next';

import { PageHero } from '@/components/site/page-hero';
import { Card, SectionHeading } from '@/components/ui';
import { SITE, VALUES } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Mission & vision',
  description: 'The mission, vision and values of RuMax Global Digital University.',
  alternates: { canonical: '/about/mission' },
};

export default function MissionPage() {
  return (
    <>
      <PageHero
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'About', href: '/about' }, { label: 'Mission & vision' }]}
        eyebrow="About"
        title="Mission and vision"
        description={SITE.tagline}
      />

      <section className="rx-container py-14">
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          <Card className="p-8">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand">Mission</p>
            <p className="font-display text-xl leading-snug">
              To make an accredited, rigorous university education reachable by anyone with the
              ability and the will to do it — regardless of where they live, what they earn, or what
              else their life demands of them.
            </p>
          </Card>

          <Card className="p-8">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">Vision</p>
            <p className="font-display text-xl leading-snug">
              A world in which the phrase &ldquo;could not go to university&rdquo; describes a choice
              rather than a circumstance.
            </p>
          </Card>
        </div>

        <div className="mx-auto mt-12 max-w-3xl prose-rx">
          <h2>What follows from this</h2>
          <p>
            A mission is only meaningful if it rules things out. Ours rules out several things other
            universities do routinely:
          </p>
          <ul>
            <li>
              <strong>We do not gate content behind attendance.</strong> Every lecture is recorded and
              downloadable, because requiring live attendance excludes exactly the students we exist for.
            </li>
            <li>
              <strong>We do not price by prestige.</strong> Fees are set to cover the cost of teaching
              plus a surplus for scholarships, not to signal quality.
            </li>
            <li>
              <strong>We do not use rankings as a goal.</strong> The metrics that move rankings —
              selectivity, spend per student, research volume — are mostly in tension with access.
            </li>
            <li>
              <strong>We do not lower the standard.</strong> Access means removing barriers to
              studying, not removing the difficulty of the subject.
            </li>
          </ul>
        </div>
      </section>

      <section className="border-t border-border bg-surface-2/40 py-16">
        <div className="rx-container">
          <SectionHeading align="center" eyebrow="Values" title="What we hold ourselves to" />
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {VALUES.map((value) => (
              <Card key={value.title} className="p-6">
                <h3 className="font-display text-lg font-semibold">{value.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{value.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
