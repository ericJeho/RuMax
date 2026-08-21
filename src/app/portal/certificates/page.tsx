import type { Metadata } from 'next';
import Link from 'next/link';
import { Award, ShieldCheck } from 'lucide-react';

import { Badge, Card, CardBody, EmptyState, PageHeader } from '@/components/ui';
import { CopyButton } from '@/components/ui/interactive';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDate } from '@/lib/format';
import { SITE } from '@/lib/site';
import { env } from '@/lib/env';

export const metadata: Metadata = { title: 'Certificates' };
export const dynamic = 'force-dynamic';

export default async function CertificatesPage() {
  const user = await requireUser();

  const certificates = await prisma.certificate.findMany({
    where: { userId: user.id },
    include: { program: { select: { title: true, level: true } }, _count: { select: { verifications: true } } },
    orderBy: { issuedAt: 'desc' },
  });

  return (
    <>
      <PageHeader
        title="Certificates"
        description="Your awards. Each one carries a serial that anyone can verify without contacting the university."
      />

      {certificates.length === 0 ? (
        <EmptyState
          icon={<Award size={30} aria-hidden />}
          title="No certificates yet"
          description="Certificates are issued when Senate confers your award, or when you complete a certificate-bearing short course."
        />
      ) : (
        <div className="space-y-6">
          {certificates.map((certificate) => (
            <Card key={certificate.id} className="overflow-hidden">
              {/* The certificate face, laid out to print on A4 landscape. */}
              <div className="relative border-b border-border bg-mesh p-8 sm:p-12">
                <div className="mx-auto max-w-2xl text-center">
                  <p className="text-xs uppercase tracking-[0.25em] text-muted">{SITE.name}</p>
                  <p className="mt-1 text-[11px] italic text-muted">
                    {SITE.motto} — {SITE.mottoTranslation}
                  </p>

                  <p className="mt-8 text-sm text-muted">This is to certify that</p>
                  <p className="mt-2 font-display text-3xl font-semibold">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="mt-4 text-sm text-muted">has been awarded the</p>
                  <p className="mt-2 font-display text-xl font-semibold text-brand">
                    {certificate.title}
                  </p>
                  {certificate.classification ? (
                    <p className="mt-2 text-sm">{certificate.classification}</p>
                  ) : null}

                  <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs text-muted">
                    <span>Issued {formatDate(certificate.issuedAt, 'en', { dateStyle: 'long' })}</span>
                    <span>Serial {certificate.serial}</span>
                    <span>Student number {user.studentNumber}</span>
                  </div>
                </div>
              </div>

              <CardBody className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <ShieldCheck size={15} className="text-success" aria-hidden />
                    Verifiable credential
                    {certificate.revoked ? <Badge tone="danger">Revoked</Badge> : null}
                  </p>
                  <p className="mt-1 break-all font-mono text-xs text-muted">
                    SHA-256 {certificate.documentHash.slice(0, 32)}…
                  </p>
                  {certificate.blockchainTx ? (
                    <p className="mt-0.5 break-all font-mono text-xs text-muted">
                      Anchored {certificate.blockchainTx.slice(0, 22)}…
                    </p>
                  ) : null}
                  <p className="mt-1.5 text-xs text-muted">
                    Verified {certificate._count.verifications} time
                    {certificate._count.verifications === 1 ? '' : 's'} by employers and institutions.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <CopyButton
                    value={`${env.NEXT_PUBLIC_SITE_URL}/verify/${certificate.serial}`}
                    label="Copy verification link"
                  />
                  <Link href={`/verify/${certificate.serial}`} className="btn-secondary text-sm">
                    Open verification page
                  </Link>
                  <a href={`/api/certificates/${certificate.serial}`} className="btn-secondary text-sm" download>
                    Download data
                  </a>
                  {/* The printable document. Opens in its own tab because it is a page to
                      be printed, not a panel within the portal. */}
                  <Link
                    href={`/certificates/${certificate.serial}`}
                    target="_blank"
                    rel="noopener"
                    className="btn-primary text-sm"
                  >
                    View certificate
                  </Link>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
