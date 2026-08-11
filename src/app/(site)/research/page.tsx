import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHero } from '@/components/site/page-hero';
import { Badge, Card, CardBody, StatCard } from '@/components/ui';
import { prisma } from '@/lib/db';
import { safeQuery } from '@/lib/queries';
import { formatCurrency } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Research',
  description: 'Research at RuMax — themes, projects, funding and an open-access publication record.',
  alternates: { canonical: '/research' },
};

export const revalidate = 600;

export default async function ResearchPage() {
  const [projects, publications, funding] = await Promise.all([
    safeQuery(
      'research-projects',
      () =>
        prisma.researchProject.findMany({
          include: { lead: { select: { firstName: true, lastName: true } } },
          orderBy: { startDate: 'desc' },
          take: 12,
        }),
      [],
    ),
    safeQuery('research-publications', () => prisma.publication.count(), 0),
    safeQuery(
      'research-funding',
      () => prisma.researchProject.aggregate({ _sum: { fundingAmount: true } }),
      { _sum: { fundingAmount: null } },
    ),
  ]);

  return (
    <>
      <PageHero
        eyebrow="Research"
        title="Research that has to be useful somewhere"
        description="Six institutes working on problems in low-resource settings: language technology, climate adaptation, health systems, digital governance, energy access and online pedagogy."
      />

      <section className="rx-container py-14">
        <div className="mb-10 grid gap-4 sm:grid-cols-4">
          <StatCard label="Active projects" value={projects.filter((project) => project.status === 'ACTIVE').length} />
          <StatCard label="Publications" value={publications} hint="all open access" />
          <StatCard label="Funding held" value={formatCurrency(Number(funding._sum.fundingAmount ?? 0))} />
          <StatCard label="Institutes" value={6} />
        </div>

        <div className="mb-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="prose-rx">
            <h2>Our approach</h2>
            <p>
              We do not run a research portfolio to raise our ranking. Every project has to answer a
              question somebody outside a university is actually asking — a health ministry, a rural
              energy cooperative, a school system. That constraint rules out a lot of interesting
              work, and it is the point.
            </p>
            <p>
              Everything we publish is open access, deposited in our repository on the day of
              acceptance. Data and code are published alongside unless there is a specific ethical
              reason not to, in which case the reason is stated.
            </p>
            <p>
              Doctoral students are full members of a project team, not assistants to one. Browse{' '}
              <Link href="/research/projects">current projects</Link>, the{' '}
              <Link href="/research/publications">publication record</Link>, or{' '}
              <Link href="/research/funding">funding and grants</Link>.
            </p>
          </div>

          <Card className="h-fit">
            <CardBody>
              <h2 className="mb-3 font-display text-lg font-semibold">Research integrity</h2>
              <p className="text-sm leading-relaxed text-muted">
                All research involving people goes through an ethics committee with external
                membership. Pre-registration is required for hypothesis-testing studies. Negative
                results are published — a fifth of our output reports something that did not work,
                which is roughly what an honest portfolio should look like.
              </p>
            </CardBody>
          </Card>
        </div>

        <h2 className="mb-5 font-display text-2xl font-semibold">Current projects</h2>
        <div className="grid gap-5 md:grid-cols-2">
          {projects.map((project) => (
            <Card key={project.id} className="flex h-full flex-col p-6">
              <div className="mb-2 flex flex-wrap gap-2">
                <Badge tone={project.status === 'ACTIVE' ? 'success' : 'neutral'}>
                  {project.status.toLowerCase()}
                </Badge>
                {project.fundingBody ? <Badge>{project.fundingBody}</Badge> : null}
              </div>
              <h3 className="font-display text-lg font-semibold leading-snug">{project.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{project.abstract}</p>
              <p className="mt-4 border-t border-border pt-3 text-xs text-muted">
                {project.lead ? `Led by ${project.lead.firstName} ${project.lead.lastName}` : 'Lead to be confirmed'}
                {project.fundingAmount ? ` · ${formatCurrency(Number(project.fundingAmount))}` : ''}
              </p>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
