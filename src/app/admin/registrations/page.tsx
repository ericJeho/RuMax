import type { Metadata } from 'next';

import { Card, CardBody, EmptyState, PageHeader, StatCard } from '@/components/ui';
import { RegistrationApprovals } from './approvals';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const metadata: Metadata = { title: 'Registrations' };
export const dynamic = 'force-dynamic';

export default async function AdminRegistrationsPage() {
  await requireRole('ADMIN', 'REGISTRAR');

  const [pending, approved, rejected] = await Promise.all([
    prisma.registration.findMany({
      where: { status: 'PENDING' },
      include: {
        user: { select: { firstName: true, lastName: true, studentNumber: true, program: { select: { title: true } } } },
        course: { select: { code: true, title: true, credits: true } },
        term: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 200,
    }),
    prisma.registration.count({ where: { status: 'APPROVED' } }),
    prisma.registration.count({ where: { status: 'REJECTED' } }),
  ]);

  return (
    <>
      <PageHeader
        title="Course registrations"
        description="Approve or decline registrations. Students cannot access course material until their registration is approved, so this queue matters."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Awaiting approval" value={pending.length} hint="Target: 2 working days" />
        <StatCard label="Approved" value={approved} />
        <StatCard label="Declined" value={rejected} />
      </div>

      {pending.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState title="Queue is clear" description="Every registration has been processed." />
          </CardBody>
        </Card>
      ) : (
        <RegistrationApprovals
          registrations={pending.map((registration) => ({
            id: registration.id,
            student: `${registration.user.firstName} ${registration.user.lastName}`,
            studentNumber: registration.user.studentNumber,
            program: registration.user.program?.title ?? '—',
            course: `${registration.course.code} — ${registration.course.title}`,
            credits: registration.course.credits,
            term: registration.term.name,
          }))}
        />
      )}
    </>
  );
}
