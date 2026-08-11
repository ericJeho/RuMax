import type { Metadata } from 'next';

import { Badge, Card, CardBody, CardHeader, CardTitle, EmptyState, PageHeader, StatCard } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatCurrency, formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Research' };
export const dynamic = 'force-dynamic';

export default async function LecturerResearchPage() {
  const user = await requireUser();

  const [projects, publications] = await Promise.all([
    prisma.researchProject.findMany({
      where: user.role === 'ADMIN' ? {} : { leadId: user.id },
      include: { _count: { select: { publications: true } } },
      orderBy: { startDate: 'desc' },
    }),
    prisma.publication.findMany({
      where: user.role === 'ADMIN' ? {} : { authorId: user.id },
      orderBy: { year: 'desc' },
    }),
  ]);

  const citations = publications.reduce((sum, publication) => sum + publication.citations, 0);
  const funding = projects.reduce((sum, project) => sum + Number(project.fundingAmount ?? 0), 0);

  return (
    <>
      <PageHeader
        title="Research"
        description="Your projects, funding and publications. Everything here is deposited in the open-access repository."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active projects" value={projects.filter((p) => p.status === 'ACTIVE').length} />
        <StatCard label="Publications" value={publications.length} />
        <StatCard label="Citations" value={citations} />
        <StatCard label="Funding held" value={formatCurrency(funding)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle as="h2">Projects</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            {projects.length === 0 ? (
              <EmptyState title="No projects" description="Register a project to link publications and funding to it." />
            ) : (
              projects.map((project) => (
                <div key={project.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-medium leading-snug">{project.title}</p>
                    <Badge tone={project.status === 'ACTIVE' ? 'success' : 'neutral'}>
                      {project.status.toLowerCase()}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{project.abstract}</p>
                  <p className="mt-2 text-xs text-muted">
                    {project.fundingBody ?? 'Unfunded'}
                    {project.fundingAmount ? ` · ${formatCurrency(Number(project.fundingAmount))}` : ''} ·
                    started {formatDate(project.startDate)} · {project._count.publications} outputs
                  </p>
                </div>
              ))
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle as="h2">Publications</CardTitle>
            <button className="text-sm text-brand hover:underline">Deposit a paper</button>
          </CardHeader>
          <CardBody className="space-y-3">
            {publications.length === 0 ? (
              <EmptyState title="No publications" description="Deposited papers appear here and in the public repository." />
            ) : (
              publications.map((publication) => (
                <div key={publication.id} className="border-b border-border/60 pb-3 last:border-0 last:pb-0">
                  <p className="text-sm font-medium leading-snug">{publication.title}</p>
                  <p className="mt-1 text-xs text-muted">
                    {publication.journal ?? 'Preprint'} · {publication.year} · {publication.citations} citations
                    {publication.doi ? ` · doi:${publication.doi}` : ''}
                  </p>
                </div>
              ))
            )}
            <p className="border-t border-border pt-3 text-xs leading-relaxed text-muted">
              ORCID and CrossRef integration keeps this list in step with the public record — connect
              your ORCID iD in your profile to sync automatically.
            </p>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
