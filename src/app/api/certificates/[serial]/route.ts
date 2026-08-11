import { headers } from 'next/headers';

import { handleError, ok, rateLimitOrThrow } from '@/lib/api';
import { clientIp } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { hashCertificate, isValidSerial, verifyCertificateHash } from '@/lib/certificates';
import { SITE } from '@/lib/site';

export const dynamic = 'force-dynamic';

/**
 * GET /api/certificates/:serial — public credential verification.
 *
 * Deliberately unauthenticated: the point of a verifiable credential is that an employer
 * anywhere can check it without an account. Two things keep that safe:
 *  - the response discloses only what appears on the certificate face, never contact
 *    details, marks or anything else from the student record;
 *  - the stored hash is recomputed from the live record, so a tampered database row
 *    fails verification rather than quietly returning a forged "valid".
 */
export async function GET(_request: Request, { params }: { params: Promise<{ serial: string }> }) {
  try {
    const { serial: raw } = await params;
    const serial = raw.trim().toUpperCase();

    const headerList = await headers();
    const ip = clientIp(headerList) ?? 'unknown';
    rateLimitOrThrow(`verify:${ip}`, 30, 60_000);

    if (!isValidSerial(serial)) {
      return ok({
        valid: false,
        reason: 'malformed_serial',
        message: 'That is not a RuMax serial. They look like RX-2025-7KQ4-M2P9.',
      });
    }

    const certificate = await prisma.certificate.findUnique({
      where: { serial },
      include: {
        user: { select: { firstName: true, lastName: true, studentNumber: true } },
        program: { select: { title: true, level: true } },
      },
    });

    if (!certificate) {
      return ok({
        valid: false,
        reason: 'not_found',
        message: 'No certificate with that serial has been issued by this university.',
      });
    }

    const recomputed = hashCertificate({
      serial: certificate.serial,
      studentName: `${certificate.user.firstName} ${certificate.user.lastName}`,
      studentNumber: certificate.user.studentNumber ?? '',
      programTitle: certificate.program?.title ?? certificate.title,
      certificateType: certificate.type,
      classification: certificate.classification,
      issuedAt: certificate.issuedAt,
    });

    const intact = verifyCertificateHash(
      {
        serial: certificate.serial,
        studentName: `${certificate.user.firstName} ${certificate.user.lastName}`,
        studentNumber: certificate.user.studentNumber ?? '',
        programTitle: certificate.program?.title ?? certificate.title,
        certificateType: certificate.type,
        classification: certificate.classification,
        issuedAt: certificate.issuedAt,
      },
      certificate.documentHash,
    );

    // Record the check so graduates can see their credential being used, and so we can
    // detect scraping of the verification endpoint.
    await prisma.certificateVerification.create({
      data: { certificateId: certificate.id, ip },
    });

    if (certificate.revoked) {
      return ok({
        valid: false,
        reason: 'revoked',
        message: certificate.revokedReason ?? 'This credential has been revoked by the university.',
        serial: certificate.serial,
      });
    }

    if (!intact) {
      return ok({
        valid: false,
        reason: 'integrity_failure',
        message:
          'The record for this serial does not match its cryptographic signature. Contact the registrar before relying on this certificate.',
        serial: certificate.serial,
      });
    }

    return ok({
      valid: true,
      serial: certificate.serial,
      holder: `${certificate.user.firstName} ${certificate.user.lastName}`,
      studentNumber: certificate.user.studentNumber,
      award: certificate.title,
      awardType: certificate.type,
      level: certificate.program?.level ?? null,
      classification: certificate.classification,
      issuedAt: certificate.issuedAt,
      documentHash: recomputed,
      blockchainTx: certificate.blockchainTx,
      issuer: {
        name: SITE.name,
        registration: SITE.registrationNumber,
        accreditation: 'National Council for Higher Education',
      },
      verifiedAt: new Date().toISOString(),
    });
  } catch (error) {
    return handleError(error);
  }
}
