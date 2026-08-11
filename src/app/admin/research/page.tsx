import type { Metadata } from 'next';

import { Badge, Card, CardBody, PageHeader, StatCard, Table, Td, Th } from '@/components/ui';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatCurrency, formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Research management' };
export const dynamic = 'force-dynamic';

export default async function AdminResearchPage() {
  await requireRole('ADMIN', 'REGISTRAR');

  const [projects, publications] = await Promise.all([
    prisma.researchProject.findMany({
      include: {
        lead: { select: { firstName: true, lastName: true } },
        _count: { select: { publications: true } },
      },
      orderBy: { startDate: 'desc' },
    }),
    prisma.publication.findMany({ orderBy: { year: 'desc' }, take: 50 }),
  ]);

  const funding = projects.reduce((sum, project) => sum + Number(project.fundingAmount ?? 0), 0);
  const citations = publications.reduce((sum, publication) => sum + publication.citations, 0);

  return (
    <>
      <PageHeader title="Research management" description="Projects, funding and the open-access publication record." />

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <StatCard label="Projects" value={projects.length} />
        <StatCard label="Active" value={projects.filter((project) => project.status === 'ACTIVE').length} />
        <StatCard label="Funding held" value={formatCurrency(funding)} />
        <StatCard label="Citations" value={citations} hint={`${publications.length} publications shown`} />
      </div>

      <Card>
        <CardBody className="p-0">
          <Table>
            <caption className="sr-only">Research projects</caption>
            <thead>
              <tr>
                <Th>Project</Th>
                <Th>Lead</Th>
                <Th>Funder</Th>
                <Th className="text-right">Award</Th>
                <Th>Started</Th>
                <Th className="text-right">Outputs</Th>
                <Th className="text-right">Status</Th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id}>
                  <Td className="font-medium">{project.title}</Td>
                  <Td className="text-xs">
                    {project.lead ? `${project.lead.firstName} ${project.lead.lastName}` : '—'}
                  </Td>
                  <Td className="text-xs text-muted">{project.fundingBody ?? '—'}</Td>
                  <Td className="text-right tabular-nums">
                    {project.fundingAmount ? formatCurrency(Number(project.fundingAmount)) : '—'}
                  </Td>
                  <Td className="whitespace-nowrap text-xs">{formatDate(project.startDate)}</Td>
                  <Td className="text-right tabular-nums">{project._count.publications}</Td>
                  <Td className="text-right">
                    <Badge tone={project.status === 'ACTIVE' ? 'success' : 'neutral'}>
                      {project.status.toLowerCase()}
                    </Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardBody>
      </Card>
    </>
  );
}
