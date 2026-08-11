import type { Metadata } from 'next';
import Link from 'next/link';

import { Badge, Card, CardBody, PageHeader, StatCard, Table, Td, Th } from '@/components/ui';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Certificates' };
export const dynamic = 'force-dynamic';

export default async function AdminCertificatesPage() {
  await requireRole('ADMIN', 'REGISTRAR');

  const certificates = await prisma.certificate.findMany({
    include: {
      user: { select: { firstName: true, lastName: true, studentNumber: true } },
      program: { select: { title: true } },
      _count: { select: { verifications: true } },
    },
    orderBy: { issuedAt: 'desc' },
    take: 200,
  });

  const verifications = certificates.reduce((sum, certificate) => sum + certificate._count.verifications, 0);

  return (
    <>
      <PageHeader
        title="Certificates"
        description="Every credential the university has issued, and how often employers have checked it."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <StatCard label="Issued" value={certificates.length} />
        <StatCard label="Verifications" value={verifications} hint="external checks" />
        <StatCard label="Revoked" value={certificates.filter((c) => c.revoked).length} />
        <StatCard label="Chain-anchored" value={certificates.filter((c) => c.blockchainTx).length} />
      </div>

      <Card>
        <CardBody className="p-0">
          <Table>
            <caption className="sr-only">Issued certificates</caption>
            <thead>
              <tr>
                <Th>Serial</Th>
                <Th>Holder</Th>
                <Th>Award</Th>
                <Th>Classification</Th>
                <Th>Issued</Th>
                <Th className="text-right">Checks</Th>
                <Th className="text-right">Status</Th>
              </tr>
            </thead>
            <tbody>
              {certificates.map((certificate) => (
                <tr key={certificate.id}>
                  <Td className="font-mono text-xs">
                    <Link href={`/verify/${certificate.serial}`} className="text-brand hover:underline">
                      {certificate.serial}
                    </Link>
                  </Td>
                  <Td>
                    <span className="block font-medium">
                      {certificate.user.firstName} {certificate.user.lastName}
                    </span>
                    <span className="block font-mono text-xs text-muted">{certificate.user.studentNumber}</span>
                  </Td>
                  <Td className="text-sm">{certificate.title}</Td>
                  <Td className="text-xs text-muted">{certificate.classification ?? '—'}</Td>
                  <Td className="whitespace-nowrap text-xs">{formatDate(certificate.issuedAt)}</Td>
                  <Td className="text-right tabular-nums">{certificate._count.verifications}</Td>
                  <Td className="text-right">
                    <Badge tone={certificate.revoked ? 'danger' : 'success'}>
                      {certificate.revoked ? 'Revoked' : 'Valid'}
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
