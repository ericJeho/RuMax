import type { Metadata } from 'next';

import { PageHero } from '@/components/site/page-hero';
import { Badge, Card, EmptyState } from '@/components/ui';
import { prisma } from '@/lib/db';
import { safeQuery } from '@/lib/queries';
import { formatCurrency, formatDate } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Research projects',
  description: 'Active and completed research projects at RuMax Global Digital University.',
  alternates: { canonical: '/research/projects' },
};

export const revalidate = 600;

export default async function ResearchProjectsPage() {
  const projects = await safeQuery(
    'projects',
    () =>
      prisma.researchProject.findMany({
        include: {
          lead: { select: { firstName: true, lastName: true } },
          _count: { select: { publications: true } },
        },
        orderBy: { startDate: 'desc' },
      }),
    [],
  );

  return (
    <>
      <PageHero
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Research', href: '/research' }, { label: 'Projects' }]}
        eyebrow="Research"
        title="Projects"
        description="Every project, its funder, its lead and what it has produced."
      />

      <section className="rx-container py-14">
        {projects.length === 0 ? (
          <EmptyState title="No projects" description="Registered projects will appear here." />
        ) : (
          <div className="space-y-5">
            {projects.map((project) => (
              <Card key={project.id} className="p-6">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge tone={project.status === 'ACTIVE' ? 'success' : 'neutral'}>
                    {project.status.toLowerCase()}
                  </Badge>
                  {project.keywords.map((keyword) => (
                    <Badge key={keyword}>{keyword}</Badge>
                  ))}
                </div>
                <h2 className="font-display text-xl font-semibold leading-snug">{project.title}</h2>
                <p className="mt-2 leading-relaxed text-muted">{project.abstract}</p>
                <dl className="mt-4 grid gap-4 border-t border-border pt-4 text-xs sm:grid-cols-4">
                  <div>
                    <dt className="text-muted">Lead</dt>
                    <dd className="mt-0.5 font-medium">
                      {project.lead ? `${project.lead.firstName} ${project.lead.lastName}` : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Funder</dt>
                    <dd className="mt-0.5 font-medium">{project.fundingBody ?? 'Unfunded'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Award</dt>
                    <dd className="mt-0.5 font-medium">
                      {project.fundingAmount ? formatCurrency(Number(project.fundingAmount)) : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Started · outputs</dt>
                    <dd className="mt-0.5 font-medium">
                      {formatDate(project.startDate)} · {project._count.publications}
                    </dd>
                  </div>
                </dl>
              </Card>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
