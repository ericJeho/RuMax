import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHero } from '@/components/site/page-hero';
import { Card, EmptyState } from '@/components/ui';
import { getFaculties } from '@/lib/queries';

export const metadata: Metadata = {
  title: 'Faculties',
  description: 'Six faculties and twenty-four departments covering computing, business, health, education, law and engineering.',
  alternates: { canonical: '/faculties' },
};

export const revalidate = 600;

export default async function FacultiesPage() {
  const faculties = await getFaculties();

  return (
    <>
      <PageHero
        eyebrow="Academics"
        title="Faculties"
        description="Each faculty sets its own curriculum and quality standards, and is examined externally every year."
      />

      <section className="rx-container py-14">
        {faculties.length === 0 ? (
          <EmptyState title="No faculties published" description="Run the seed to load demonstration content." />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {faculties.map((faculty) => (
              <Card key={faculty.id} hover className="flex h-full flex-col p-6">
                <h2 className="font-display text-xl font-semibold leading-snug">
                  <Link href={`/faculties/${faculty.slug}`} className="hover:text-brand">
                    {faculty.name}
                  </Link>
                </h2>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{faculty.description}</p>
                <p className="mt-5 border-t border-border pt-4 text-xs text-muted">
                  {faculty._count.departments} departments · {faculty._count.programs} programmes
                  {faculty.dean ? (
                    <span className="mt-1 block">
                      Dean: {faculty.dean.firstName} {faculty.dean.lastName}
                    </span>
                  ) : null}
                </p>
              </Card>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
