import type { Metadata } from 'next';

import { Badge, Card, CardBody, PageHeader, StatCard, Table, Td, Th } from '@/components/ui';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ROLE_LABELS } from '@/lib/rbac';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Staff' };
export const dynamic = 'force-dynamic';

export default async function StaffPage() {
  await requireRole('ADMIN', 'REGISTRAR');

  const staff = await prisma.user.findMany({
    where: { role: { in: ['LECTURER', 'REGISTRAR', 'FINANCE', 'ADMIN'] } },
    include: {
      _count: { select: { taughtCourses: true, publications: true, researchProjects: true } },
      headedFaculties: { select: { name: true } },
    },
    orderBy: [{ role: 'asc' }, { lastName: 'asc' }],
  });

  return (
    <>
      <PageHeader title="Faculty & staff" description="Academic and professional staff, their teaching load and research output." />

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <StatCard label="Total staff" value={staff.length} />
        <StatCard label="Lecturers" value={staff.filter((s) => s.role === 'LECTURER').length} />
        <StatCard label="Deans" value={staff.filter((s) => s.headedFaculties.length > 0).length} />
        <StatCard label="With 2FA" value={staff.filter((s) => s.twoFactorEnabled).length} hint="of all staff accounts" />
      </div>

      <Card>
        <CardBody className="p-0">
          <Table>
            <caption className="sr-only">Staff register</caption>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Role</Th>
                <Th className="text-right">Courses</Th>
                <Th className="text-right">Publications</Th>
                <Th>Dean of</Th>
                <Th>Last sign-in</Th>
                <Th className="text-right">2FA</Th>
              </tr>
            </thead>
            <tbody>
              {staff.map((person) => (
                <tr key={person.id}>
                  <Td>
                    <span className="block font-medium">
                      {person.firstName} {person.lastName}
                    </span>
                    <span className="block text-xs text-muted">{person.email}</span>
                    <span className="block font-mono text-xs text-muted">{person.staffNumber}</span>
                  </Td>
                  <Td className="text-xs">{ROLE_LABELS[person.role]}</Td>
                  <Td className="text-right tabular-nums">{person._count.taughtCourses}</Td>
                  <Td className="text-right tabular-nums">{person._count.publications}</Td>
                  <Td className="text-xs text-muted">
                    {person.headedFaculties.map((faculty) => faculty.name).join(', ') || '—'}
                  </Td>
                  <Td className="whitespace-nowrap text-xs">{formatDate(person.lastLoginAt)}</Td>
                  <Td className="text-right">
                    <Badge tone={person.twoFactorEnabled ? 'success' : 'warning'}>
                      {person.twoFactorEnabled ? 'On' : 'Off'}
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
