import type { Metadata } from 'next';

import { Badge, Card, CardBody, PageHeader, StatCard, Table, Td, Th } from '@/components/ui';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatCurrency } from '@/lib/format';

export const metadata: Metadata = { title: 'Programmes' };
export const dynamic = 'force-dynamic';

export default async function AdminProgramsPage() {
  await requireRole('ADMIN', 'REGISTRAR');

  const programs = await prisma.program.findMany({
    include: {
      faculty: { select: { name: true } },
      _count: { select: { students: true, applications: true, courses: true } },
    },
    orderBy: [{ level: 'asc' }, { title: 'asc' }],
  });

  const totalStudents = programs.reduce((sum, program) => sum + program._count.students, 0);

  return (
    <>
      <PageHeader title="Programmes" description="The full catalogue, its curriculum size and how many students each programme carries." />

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <StatCard label="Programmes" value={programs.length} />
        <StatCard label="Published" value={programs.filter((p) => p.published).length} />
        <StatCard label="Students enrolled" value={totalStudents} />
        <StatCard label="Featured" value={programs.filter((p) => p.featured).length} hint="shown on the home page" />
      </div>

      <Card>
        <CardBody className="p-0">
          <Table>
            <caption className="sr-only">Programme catalogue</caption>
            <thead>
              <tr>
                <Th>Code</Th>
                <Th>Programme</Th>
                <Th>Faculty</Th>
                <Th>Level</Th>
                <Th className="text-right">Courses</Th>
                <Th className="text-right">Students</Th>
                <Th className="text-right">Applications</Th>
                <Th className="text-right">Tuition</Th>
                <Th className="text-right">Status</Th>
              </tr>
            </thead>
            <tbody>
              {programs.map((program) => (
                <tr key={program.id}>
                  <Td className="font-mono text-xs">{program.code}</Td>
                  <Td className="font-medium">{program.title}</Td>
                  <Td className="text-xs text-muted">{program.faculty.name}</Td>
                  <Td className="text-xs capitalize">{program.level.replace(/_/g, ' ').toLowerCase()}</Td>
                  <Td className="text-right tabular-nums">{program._count.courses}</Td>
                  <Td className="text-right tabular-nums">{program._count.students}</Td>
                  <Td className="text-right tabular-nums">{program._count.applications}</Td>
                  <Td className="text-right tabular-nums">
                    {formatCurrency(Number(program.tuitionPerYear), program.currency)}
                  </Td>
                  <Td className="text-right">
                    <Badge tone={program.published ? 'success' : 'warning'}>
                      {program.published ? 'Published' : 'Draft'}
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
