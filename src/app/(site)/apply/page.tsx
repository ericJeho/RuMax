import type { Metadata } from 'next';

import { PageHero } from '@/components/site/page-hero';
import { ApplicationWizard } from './wizard';
import { prisma } from '@/lib/db';
import { safeQuery } from '@/lib/queries';
import { getSessionClaims } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Apply',
  description:
    'Apply online to RuMax Global Digital University. One form, five steps, no application fee for open-entry courses.',
  alternates: { canonical: '/apply' },
};

export const dynamic = 'force-dynamic';

export default async function ApplyPage() {
  const [programs, terms, claims] = await Promise.all([
    safeQuery(
      'apply-programs',
      () =>
        prisma.program.findMany({
          where: { published: true },
          select: { id: true, code: true, title: true, level: true, tuitionPerYear: true, currency: true },
          orderBy: [{ level: 'asc' }, { title: 'asc' }],
        }),
      [],
    ),
    safeQuery(
      'apply-terms',
      () =>
        prisma.academicTerm.findMany({
          where: { registrationCloses: { gte: new Date() } },
          select: { name: true },
          orderBy: { startDate: 'asc' },
          take: 4,
        }),
      [],
    ),
    getSessionClaims(),
  ]);

  return (
    <>
      <PageHero
        eyebrow="Admissions"
        title="Apply to RuMax"
        description="Five steps, about fifteen minutes. Your progress saves as you go, so you can come back to it. We reply to every application within five working days."
      />

      <section className="rx-container py-14">
        <ApplicationWizard
          programs={programs.map((program) => ({
            id: program.id,
            label: `${program.code} — ${program.title}`,
            level: program.level,
            tuition: Number(program.tuitionPerYear),
            currency: program.currency,
          }))}
          intakes={terms.map((term) => term.name)}
          signedIn={Boolean(claims)}
        />
      </section>
    </>
  );
}
