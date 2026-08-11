import type { Metadata } from 'next';

import { PageHero } from '@/components/site/page-hero';
import { ProgramCatalogue } from './catalogue';
import { prisma } from '@/lib/db';
import { safeQuery } from '@/lib/queries';

export const metadata: Metadata = {
  title: 'Programmes',
  description:
    'Browse every RuMax Global Digital University programme — undergraduate, masters, doctoral, diplomas, certificates, professional and open courses, all taught online.',
  alternates: { canonical: '/programs' },
};

export const revalidate = 600;

export default async function ProgramsPage() {
  const programs = await safeQuery(
    'program-catalogue',
    () =>
      prisma.program.findMany({
        where: { published: true },
        include: { faculty: { select: { name: true, slug: true } } },
        orderBy: [{ level: 'asc' }, { title: 'asc' }],
      }),
    [],
  );

  return (
    <>
      <PageHero
        eyebrow="Academics"
        title="Programmes"
        description={`${programs.length} accredited programmes, from eight-week certificates to four-year doctorates. Every one delivered entirely online, with the same regulations and external examination as any campus degree.`}
      />

      <section className="rx-container py-14">
        <ProgramCatalogue
          programs={programs.map((program) => ({
            id: program.id,
            slug: program.slug,
            code: program.code,
            title: program.title,
            level: program.level,
            mode: program.mode,
            summary: program.summary,
            durationMonths: program.durationMonths,
            totalCredits: program.totalCredits,
            tuition: Number(program.tuitionPerYear),
            currency: program.currency,
            faculty: program.faculty.name,
            featured: program.featured,
          }))}
        />
      </section>
    </>
  );
}
