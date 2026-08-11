import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Award, BookOpen, CalendarDays, CheckCircle2, Clock, GraduationCap, Wallet } from 'lucide-react';

import { Badge, ButtonLink, Card, CardBody, CardHeader, CardTitle, Table, Td, Th } from '@/components/ui';
import { PageHero } from '@/components/site/page-hero';
import { prisma } from '@/lib/db';
import { safeQuery } from '@/lib/queries';
import { formatCurrency } from '@/lib/format';
import { env } from '@/lib/env';

export const revalidate = 600;

export async function generateStaticParams() {
  const programs = await safeQuery(
    'program-params',
    () => prisma.program.findMany({ where: { published: true }, select: { slug: true } }),
    [],
  );
  return programs.map((program) => ({ slug: program.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const program = await safeQuery(
    'program-meta',
    () => prisma.program.findUnique({ where: { slug }, select: { title: true, summary: true } }),
    null,
  );

  if (!program) return { title: 'Programme not found' };

  return {
    title: program.title,
    description: program.summary,
    alternates: { canonical: `/programs/${slug}` },
    openGraph: { title: program.title, description: program.summary, type: 'article' },
  };
}

export default async function ProgramDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const program = await safeQuery(
    'program-detail',
    () =>
      prisma.program.findUnique({
        where: { slug },
        include: {
          faculty: { select: { name: true, slug: true } },
          department: { select: { name: true } },
          courses: {
            include: { course: { select: { code: true, title: true, credits: true, level: true } } },
            orderBy: [{ year: 'asc' }, { semester: 'asc' }],
          },
        },
      }),
    null,
  );

  if (!program || !program.published) notFound();

  const byYear = new Map<number, typeof program.courses>();
  for (const entry of program.courses) {
    byYear.set(entry.year, [...(byYear.get(entry.year) ?? []), entry]);
  }

  /** schema.org markup so the programme appears correctly in search results. */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: program.title,
    description: program.summary,
    courseCode: program.code,
    educationalCredentialAwarded: program.level.replace(/_/g, ' ').toLowerCase(),
    numberOfCredits: program.totalCredits,
    timeRequired: `P${program.durationMonths}M`,
    provider: {
      '@type': 'CollegeOrUniversity',
      name: 'RuMax Global Digital University',
      url: env.NEXT_PUBLIC_SITE_URL,
    },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      courseWorkload: `P${program.durationMonths}M`,
    },
    offers: {
      '@type': 'Offer',
      price: Number(program.tuitionPerYear),
      priceCurrency: program.currency,
      category: 'Tuition per year',
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <PageHero
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Programmes', href: '/programs' },
          { label: program.code },
        ]}
        eyebrow={program.faculty.name}
        title={program.title}
        description={program.summary}
      >
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/apply" size="lg">
            Apply for this programme
          </ButtonLink>
          <ButtonLink href="/admissions" size="lg" variant="secondary">
            Entry requirements
          </ButtonLink>
        </div>
      </PageHero>

      <section className="rx-container py-14">
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <div className="prose-rx mb-10">
              <h2 className="text-2xl">About this programme</h2>
              {program.description.split('\n\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            {program.courses.length > 0 ? (
              <section className="mb-10">
                <h2 className="mb-4 font-display text-2xl font-semibold">Curriculum</h2>
                <p className="mb-5 text-sm leading-relaxed text-muted">
                  {program.courses.length} courses totalling {program.totalCredits} credits. Core
                  courses are compulsory; electives let you shape the degree around your interests.
                </p>

                <div className="space-y-5">
                  {[...byYear.entries()]
                    .sort(([a], [b]) => a - b)
                    .map(([year, entries]) => (
                      <Card key={year}>
                        <CardHeader>
                          <CardTitle as="h3">Year {year}</CardTitle>
                        </CardHeader>
                        <CardBody className="p-0">
                          <Table>
                            <caption className="sr-only">Year {year} courses</caption>
                            <thead>
                              <tr>
                                <Th>Code</Th>
                                <Th>Course</Th>
                                <Th className="text-right">Credits</Th>
                                <Th className="text-right">Type</Th>
                              </tr>
                            </thead>
                            <tbody>
                              {entries.map((entry) => (
                                <tr key={entry.id}>
                                  <Td className="font-mono text-xs">{entry.course.code}</Td>
                                  <Td>{entry.course.title}</Td>
                                  <Td className="text-right tabular-nums">{entry.course.credits}</Td>
                                  <Td className="text-right">
                                    <Badge tone={entry.isCore ? 'brand' : 'neutral'}>
                                      {entry.isCore ? 'Core' : 'Elective'}
                                    </Badge>
                                  </Td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </CardBody>
                      </Card>
                    ))}
                </div>
              </section>
            ) : null}

            <section className="grid gap-6 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle as="h2">Entry requirements</CardTitle>
                </CardHeader>
                <CardBody>
                  <ul className="space-y-2.5">
                    {program.entryRequirements.map((requirement) => (
                      <li key={requirement} className="flex items-start gap-2.5 text-sm">
                        <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-success" aria-hidden />
                        <span className="text-muted">{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle as="h2">Where it leads</CardTitle>
                </CardHeader>
                <CardBody>
                  <ul className="space-y-2.5">
                    {program.careerOutcomes.map((outcome) => (
                      <li key={outcome} className="flex items-start gap-2.5 text-sm">
                        <Award size={15} className="mt-0.5 shrink-0 text-accent" aria-hidden />
                        <span className="text-muted">{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            </section>
          </div>

          <aside className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle as="h2">At a glance</CardTitle>
              </CardHeader>
              <CardBody>
                <dl className="space-y-4 text-sm">
                  <Fact icon={<GraduationCap size={15} aria-hidden />} label="Level">
                    {program.level.replace(/_/g, ' ').toLowerCase()}
                  </Fact>
                  <Fact icon={<Clock size={15} aria-hidden />} label="Duration">
                    {program.durationMonths} months
                  </Fact>
                  <Fact icon={<BookOpen size={15} aria-hidden />} label="Credits">
                    {program.totalCredits}
                  </Fact>
                  <Fact icon={<Wallet size={15} aria-hidden />} label="Tuition">
                    {Number(program.tuitionPerYear) === 0
                      ? 'No fee — open course'
                      : `${formatCurrency(Number(program.tuitionPerYear), program.currency)} per year`}
                  </Fact>
                  <Fact icon={<CalendarDays size={15} aria-hidden />} label="Delivery">
                    {program.mode === 'SELF_PACED' ? 'Self-paced online' : 'Online with live seminars'}
                  </Fact>
                </dl>

                {program.accreditation ? (
                  <p className="mt-5 border-t border-border pt-4 text-xs leading-relaxed text-muted">
                    {program.accreditation}
                  </p>
                ) : null}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle as="h2">Fees and funding</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="text-sm leading-relaxed text-muted">
                  Tuition can be paid in three instalments per term at no extra cost. Scholarships
                  cover between 40% and 100% of fees and are assessed on merit and need.
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  <ButtonLink href="/scholarships" variant="secondary" size="sm">
                    Scholarships
                  </ButtonLink>
                  <ButtonLink href="/admissions/fees" variant="secondary" size="sm">
                    Full fee schedule
                  </ButtonLink>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <p className="font-display text-base font-semibold">Questions?</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Speak to an admissions adviser about entry routes, recognition of prior learning
                  or credit transfer from another institution.
                </p>
                <ButtonLink href="/contact" size="sm" className="mt-4 w-full">
                  Contact admissions
                </ButtonLink>
                <p className="mt-3 text-center text-xs text-muted">
                  Or browse{' '}
                  <Link href={`/faculties/${program.faculty.slug}`} className="text-brand hover:underline">
                    {program.faculty.name}
                  </Link>
                </p>
              </CardBody>
            </Card>
          </aside>
        </div>
      </section>
    </>
  );
}

function Fact({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0 text-brand">{icon}</span>
      <span>
        <dt className="text-xs uppercase tracking-wider text-muted">{label}</dt>
        <dd className="mt-0.5 font-medium capitalize">{children}</dd>
      </span>
    </div>
  );
}
