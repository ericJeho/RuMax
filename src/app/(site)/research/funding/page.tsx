import type { Metadata } from 'next';

import { PageHero } from '@/components/site/page-hero';
import { Card, CardBody } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Research funding',
  description: 'Funding, grants and how to apply for research support at RuMax.',
  alternates: { canonical: '/research/funding' },
};

const SCHEMES = [
  ['Internal seed fund', 'Up to US$15,000', 'Rolling', 'For pilot work that will support an external bid within 18 months. Decisions in four weeks.'],
  ['Doctoral studentship', 'Full fees plus stipend', 'Twice yearly', 'Attached to a funded project. Applicants apply to the project, not to the university.'],
  ['Open publication fund', 'Article processing charges', 'Rolling', 'Covers APCs so that no RuMax author has to choose between open access and their budget.'],
  ['Fieldwork grant', 'Up to US$8,000', 'Quarterly', 'Travel and data collection in low-resource settings, including for doctoral students.'],
];

export default function ResearchFundingPage() {
  return (
    <>
      <PageHero
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Research', href: '/research' }, { label: 'Funding' }]}
        eyebrow="Research"
        title="Funding and grants"
        description="Internal schemes, and how the research office supports external bids."
      />

      <section className="rx-container py-14">
        <div className="grid gap-5 md:grid-cols-2">
          {SCHEMES.map(([name, value, cycle, detail]) => (
            <Card key={name} className="p-6">
              <h2 className="font-display text-lg font-semibold">{name}</h2>
              <p className="mt-1 text-sm text-brand">
                {value} · {cycle}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted">{detail}</p>
            </Card>
          ))}
        </div>

        <Card className="mt-8">
          <CardBody className="prose-rx">
            <h2>External bids</h2>
            <p>
              The research office costs and submits every external bid, manages awards, and handles
              reporting. Contact them at least six weeks before a funder deadline — bids submitted in
              the last fortnight have roughly half the success rate, which is a costing and review
              problem rather than an idea problem.
            </p>
            <h2>Our funders</h2>
            <p>
              Current awards are held from the Gates Foundation, UK Research and Innovation, Open
              Society Foundations and the national research council, alongside our internal fund.
              Full award details are published with each project.
            </p>
          </CardBody>
        </Card>
      </section>
    </>
  );
}
