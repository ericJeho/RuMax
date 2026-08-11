import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHero } from '@/components/site/page-hero';
import { Card, CardBody } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Schools & institutes',
  description: 'Specialist schools and research institutes within RuMax Global Digital University.',
  alternates: { canonical: '/schools' },
};

const INSTITUTES = [
  ['Institute of Data Science', 'Machine learning for low-resource settings, with a particular focus on African language technology.', 'Faculty of Computing & Data Science'],
  ['Institute for Health Systems', 'Health financing, supply chains and service delivery research with ministries across the region.', 'Faculty of Health Sciences'],
  ['Institute for Climate Adaptation', 'Water security, resilient infrastructure and adaptation finance.', 'Faculty of Engineering & Environment'],
  ['Institute for Digital Governance', 'Data protection, digital identity and the regulation of platforms.', 'Faculty of Law & Governance'],
  ['Institute for Energy Access', 'Mini-grid engineering, storage economics and rural electrification.', 'Faculty of Engineering & Environment'],
  ['Institute for Online Pedagogy', 'What actually works in online teaching, tested on our own students and published either way.', 'Faculty of Education'],
];

const SCHOOLS = [
  ['School of Professional & Executive Education', 'Short courses, professional certificates and the Executive MBA, designed around people already in work.'],
  ['School of Graduate Studies', 'Doctoral supervision, research training and the examination of research degrees across every faculty.'],
  ['School of Open Learning', 'Free open courses and the foundation programmes that bring people into degree study.'],
];

export default function SchoolsPage() {
  return (
    <>
      <PageHero
        eyebrow="Academics"
        title="Schools and institutes"
        description="Faculties teach programmes. Schools cut across them for a particular kind of learner, and institutes concentrate research on a particular problem."
      />

      <section className="rx-container py-14">
        <h2 className="mb-5 font-display text-2xl font-semibold">Schools</h2>
        <div className="mb-12 grid gap-5 md:grid-cols-3">
          {SCHOOLS.map(([name, description]) => (
            <Card key={name} className="p-6">
              <h3 className="font-display text-lg font-semibold">{name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
            </Card>
          ))}
        </div>

        <h2 className="mb-5 font-display text-2xl font-semibold">Research institutes</h2>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {INSTITUTES.map(([name, description, faculty]) => (
            <Card key={name} className="p-6">
              <h3 className="font-display text-lg font-semibold">{name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
              <p className="mt-3 border-t border-border pt-3 text-xs text-muted">{faculty}</p>
            </Card>
          ))}
        </div>

        <Card className="mt-10">
          <CardBody className="text-sm leading-relaxed text-muted">
            Browse the{' '}
            <Link href="/faculties" className="text-brand underline">
              six faculties
            </Link>{' '}
            for the programmes each one teaches, or the{' '}
            <Link href="/research" className="text-brand underline">
              research pages
            </Link>{' '}
            for what the institutes are currently working on.
          </CardBody>
        </Card>
      </section>
    </>
  );
}
