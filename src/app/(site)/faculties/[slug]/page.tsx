import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PageHero } from '@/components/site/page-hero';
import { Badge, Card, CardBody, CardHeader, CardTitle } from '@/components/ui';
import { prisma } from '@/lib/db';
import { safeQuery } from '@/lib/queries';
import { formatCurrency, truncate } from '@/lib/format';

export const revalidate = 600;

export async function generateStaticParams() {
  const faculties = await safeQuery('faculty-params', () => prisma.faculty.findMany({ select: { slug: true } }), []);
  return faculties.map((faculty) => ({ slug: faculty.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const faculty = await safeQuery(
    'faculty-meta',
    () => prisma.faculty.findUnique({ where: { slug }, select: { name: true, description: true } }),
    null,
  );
  if (!faculty) return { title: 'Faculty not found' };
  return {
    title: faculty.name,
    description: faculty.description,
    alternates: { canonical: `/faculties/${slug}` },
  };
}

export default async function FacultyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const faculty = await safeQuery(
    'faculty-detail',
    () =>
      prisma.faculty.findUnique({
        where: { slug },
        include: {
          dean: { select: { firstName: true, lastName: true, bio: true } },
          departments: { orderBy: { name: 'asc' } },
          programs: { where: { published: true }, orderBy: [{ level: 'asc' }, { title: 'asc' }] },
        },
      }),
    null,
  );

  if (!faculty) notFound();

  return (
    <>
      <PageHero
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Faculties', href: '/faculties' },
          { label: faculty.name },
        ]}
        eyebrow="Faculty"
        title={faculty.name}
        description={faculty.description}
      />

      <section className="rx-container py-14">
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <h2 className="mb-5 font-display text-2xl font-semibold">
              Programmes ({faculty.programs.length})
            </h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {faculty.programs.map((program) => (
                <Card key={program.id} hover className="flex h-full flex-col p-5">
                  <div className="mb-2 flex flex-wrap gap-2">
                    <Badge tone="brand">{program.level.replace(/_/g, ' ').toLowerCase()}</Badge>
                    <Badge>{program.durationMonths} months</Badge>
                  </div>
                  <h3 className="font-display text-base font-semibold leading-snug">
                    <Link href={`/programs/${program.slug}`} className="hover:text-brand">
                      {program.title}
                    </Link>
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                    {truncate(program.summary, 120)}
                  </p>
                  <p className="mt-4 border-t border-border pt-3 text-sm font-semibold">
                    {Number(program.tuitionPerYear) === 0
                      ? 'No fee'
                      : `${formatCurrency(Number(program.tuitionPerYear), program.currency)}/yr`}
                  </p>
                </Card>
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            {faculty.dean ? (
              <Card>
                <CardHeader>
                  <CardTitle as="h2">Dean</CardTitle>
                </CardHeader>
                <CardBody>
                  <p className="font-medium">
                    {faculty.dean.firstName} {faculty.dean.lastName}
                  </p>
                  {faculty.dean.bio ? (
                    <p className="mt-2 text-sm leading-relaxed text-muted">{faculty.dean.bio}</p>
                  ) : null}
                </CardBody>
              </Card>
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle as="h2">Departments</CardTitle>
              </CardHeader>
              <CardBody>
                <ul className="space-y-3">
                  {faculty.departments.map((department) => (
                    <li key={department.id}>
                      <p className="text-sm font-medium">{department.name}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted">{department.description}</p>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          </aside>
        </div>
      </section>
    </>
  );
}
