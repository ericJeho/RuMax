import type { Metadata } from 'next';

import { Card, CardBody, EmptyState, PageHeader, StatCard } from '@/components/ui';
import { AdmissionsReview } from './review';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getAdmissionsFunnel } from '@/lib/admin';

export const metadata: Metadata = { title: 'Admissions' };
export const dynamic = 'force-dynamic';

export default async function AdmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole('ADMIN', 'REGISTRAR');
  const { status } = await searchParams;

  const applications = await prisma.application.findMany({
    where: status && status !== 'ALL' ? { status: status as never } : { status: { not: 'DRAFT' } },
    include: {
      program: { select: { title: true, code: true, level: true } },
      documents: { select: { id: true, type: true, fileName: true, verified: true } },
    },
    orderBy: [{ status: 'asc' }, { submittedAt: 'asc' }],
    take: 100,
  });

  const funnel = await getAdmissionsFunnel();
  const awaiting = funnel.find((stage) => stage.stage === 'submitted')?.count ?? 0;
  const reviewing = funnel.find((stage) => stage.stage === 'under review')?.count ?? 0;
  const offers = funnel.find((stage) => stage.stage === 'offer made')?.count ?? 0;
  const enrolled = funnel.find((stage) => stage.stage === 'enrolled')?.count ?? 0;

  return (
    <>
      <PageHeader
        title="Admissions"
        description="Review applications, make offers and enrol students. Every decision is recorded in the audit log against the officer who made it."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Awaiting first review" value={awaiting} hint="Target: within 5 working days" />
        <StatCard label="Under review" value={reviewing} />
        <StatCard label="Offers outstanding" value={offers} />
        <StatCard label="Enrolled" value={enrolled} />
      </div>

      {applications.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              title="No applications"
              description="Applications appear here once prospective students submit them."
            />
          </CardBody>
        </Card>
      ) : (
        <AdmissionsReview
          applications={applications.map((application) => ({
            id: application.id,
            reference: application.reference,
            status: application.status,
            name: `${application.firstName} ${application.lastName}`,
            email: application.email,
            phone: application.phone,
            country: application.country,
            nationality: application.nationality,
            program: `${application.program.code} — ${application.program.title}`,
            level: application.program.level,
            qualification: application.highestQualification,
            institution: application.institution,
            graduationYear: application.graduationYear,
            gpa: application.gpa,
            personalStatement: application.personalStatement,
            intakeTerm: application.intakeTerm,
            feePaid: application.applicationFeePaid,
            reviewNotes: application.reviewNotes,
            submittedAt: application.submittedAt?.toISOString() ?? null,
            documents: application.documents.map((document) => ({
              id: document.id,
              type: document.type,
              fileName: document.fileName,
              verified: document.verified,
            })),
          }))}
        />
      )}
    </>
  );
}
