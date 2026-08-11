import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

import { PageHero } from '@/components/site/page-hero';
import { Badge, Card, CardBody, Table, Td, Th } from '@/components/ui';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Accreditation',
  description: 'Accreditation, recognition and quality assurance at RuMax Global Digital University.',
  alternates: { canonical: '/about/accreditation' },
};

const RECOGNITION = [
  ['National Council for Higher Education', SITE.registrationNumber, 'Degree-awarding powers, all levels', 'Reviewed 2024'],
  ['Global Online Universities Consortium', 'GOUC-0031', 'Credit transfer across 11 institutions', 'Member since 2023'],
  ['ACCA', 'RUMAX-ACCA-118', 'Exemptions for BCom Accounting & Finance', 'Renewed 2025'],
  ['CIMA', 'RUMAX-CIMA-044', 'Exemptions for BCom Accounting & Finance', 'Renewed 2025'],
];

export default function AccreditationPage() {
  return (
    <>
      <PageHero
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'About', href: '/about' }, { label: 'Accreditation' }]}
        eyebrow="About"
        title="Accreditation and quality"
        description="What our awards are worth, who says so, and how you can check it yourself."
      />

      <section className="rx-container py-14">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          <div className="prose-rx">
            <h2>Degree-awarding powers</h2>
            <p>
              RuMax is accredited by the National Council for Higher Education under registration{' '}
              <strong>{SITE.registrationNumber}</strong>, with powers to award certificates, diplomas,
              bachelors, masters and doctoral degrees. Accreditation is reviewed on a four-year cycle;
              our most recent review was in 2024.
            </p>

            <h2>External examination</h2>
            <p>
              Every programme has an external examiner from another institution who sees the
              assessment briefs before students do, samples marked work, attends the exam board, and
              writes an annual report to Senate. Those reports — including criticism — are published
              with the programme they concern.
            </p>

            <h2>Why our credentials are unusually easy to check</h2>
            <p>
              A degree is only as useful as an employer&rsquo;s ability to confirm it. Most
              verification still runs through a registry office and takes days. Every RuMax award
              carries a serial and a cryptographic hash that anyone can check in seconds at{' '}
              <Link href="/verify">the verification portal</Link> — no account, no fee, no waiting.
            </p>

            <h2>Recognition abroad</h2>
            <p>
              Recognition of any foreign qualification is decided by the receiving country, not the
              awarding one. Our registrar will supply a certified transcript, syllabus documentation
              and a credential evaluation pack to any recognition authority on request, at no cost to
              the graduate.
            </p>
          </div>

          <aside className="space-y-6">
            <Card>
              <CardBody>
                <p className="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
                  <ShieldCheck size={19} className="text-success" aria-hidden />
                  Recognition
                </p>
                <Table>
                  <caption className="sr-only">Accreditation and professional recognition</caption>
                  <thead>
                    <tr>
                      <Th>Body</Th>
                      <Th>Reference</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {RECOGNITION.map(([body, reference, scope, status]) => (
                      <tr key={reference}>
                        <Td>
                          <span className="block font-medium">{body}</span>
                          <span className="block text-xs text-muted">{scope}</span>
                        </Td>
                        <Td>
                          <span className="block font-mono text-xs">{reference}</span>
                          <Badge tone="success" className="mt-1">
                            {status}
                          </Badge>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="text-sm leading-relaxed text-muted">
                <p className="mb-2 font-display text-base font-semibold text-fg">Verify an award</p>
                Employers and institutions can check any RuMax credential instantly at{' '}
                <Link href="/verify" className="text-brand underline">
                  /verify
                </Link>
                , or programmatically via the free API documented there.
              </CardBody>
            </Card>
          </aside>
        </div>
      </section>
    </>
  );
}
