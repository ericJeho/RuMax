import type { Metadata } from 'next';

import { PageHero } from '@/components/site/page-hero';
import { Avatar, Card, CardBody } from '@/components/ui';
import { LEADERSHIP } from '@/lib/site';

export const metadata: Metadata = {
  title: 'University leadership',
  description: 'The senior team and governance of RuMax Global Digital University.',
  alternates: { canonical: '/about/leadership' },
};

export default function LeadershipPage() {
  return (
    <>
      <PageHero
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'About', href: '/about' }, { label: 'Leadership' }]}
        eyebrow="About"
        title="University leadership"
        description="The senior team, and the governance structure they answer to."
      />

      <section className="rx-container py-14">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {LEADERSHIP.map((person) => (
            <Card key={person.name} className="p-6">
              <Avatar name={person.name} size={56} />
              <h2 className="mt-4 font-display text-lg font-semibold">{person.name}</h2>
              <p className="mt-0.5 text-sm text-brand">{person.role}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted">{person.bio}</p>
            </Card>
          ))}
        </div>

        <Card className="mt-10">
          <CardBody>
            <h2 className="font-display text-xl font-semibold">Governance</h2>
            <div className="prose-rx mt-3">
              <p>
                The <strong>University Council</strong> is the governing body. It holds fiduciary
                responsibility, appoints the Vice-Chancellor, and approves the strategy and budget. A
                majority of its members are independent of the university, and two seats are held by
                elected student representatives.
              </p>
              <p>
                The <strong>Senate</strong> is the supreme academic authority. It approves programmes
                and regulations, confers awards, and appoints external examiners. Senate decisions on
                academic standards cannot be overruled by Council or by management.
              </p>
              <p>
                The <strong>Executive</strong> — the Vice-Chancellor and the officers listed above —
                runs the university day to day within the strategy Council sets and the regulations
                Senate makes.
              </p>
              <p>
                Council and Senate minutes are published within 20 working days, redacted only where
                they concern an identifiable individual.
              </p>
            </div>
          </CardBody>
        </Card>
      </section>
    </>
  );
}
