import type { Metadata } from 'next';

import { Badge, Card, CardBody, PageHeader, StatCard, Table, Td, Th } from '@/components/ui';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Scholarships' };
export const dynamic = 'force-dynamic';

export default async function AdminScholarshipsPage() {
  await requireRole('ADMIN', 'REGISTRAR', 'FINANCE');
  const scholarships = await prisma.scholarship.findMany({ orderBy: { deadline: 'asc' } });

  const open = scholarships.filter((scholarship) => scholarship.deadline >= new Date());
  const slots = scholarships.reduce((sum, scholarship) => sum + scholarship.slots, 0);

  return (
    <>
      <PageHeader title="Scholarships" description="Funding schemes, their coverage and how many places each carries." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Schemes" value={scholarships.length} />
        <StatCard label="Open for application" value={open.length} />
        <StatCard label="Places offered" value={slots} />
      </div>

      <Card>
        <CardBody className="p-0">
          <Table>
            <caption className="sr-only">Scholarship schemes</caption>
            <thead>
              <tr>
                <Th>Scheme</Th>
                <Th className="text-right">Coverage</Th>
                <Th className="text-right">Places</Th>
                <Th>Deadline</Th>
                <Th className="text-right">Status</Th>
              </tr>
            </thead>
            <tbody>
              {scholarships.map((scholarship) => (
                <tr key={scholarship.id}>
                  <Td>
                    <span className="block font-medium">{scholarship.name}</span>
                    <span className="block text-xs text-muted">{scholarship.description.slice(0, 110)}…</span>
                  </Td>
                  <Td className="text-right tabular-nums">{scholarship.coveragePct}%</Td>
                  <Td className="text-right tabular-nums">{scholarship.slots}</Td>
                  <Td className="whitespace-nowrap text-xs">{formatDate(scholarship.deadline)}</Td>
                  <Td className="text-right">
                    <Badge tone={scholarship.deadline >= new Date() ? 'success' : 'neutral'}>
                      {scholarship.deadline >= new Date() ? 'Open' : 'Closed'}
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
