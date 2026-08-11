import { headers } from 'next/headers';
import { z } from 'zod';

import { audit, badRequest, created, handleError, parseBody, rateLimitOrThrow } from '@/lib/api';
import { clientIp, getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatApplicationReference } from '@/lib/certificates';

const schema = z.object({
  programId: z.string().min(1),
  intakeTerm: z.string().max(100).optional(),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email(),
  phone: z.string().max(40).optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().max(40).optional(),
  nationality: z.string().max(80).optional(),
  country: z.string().min(1).max(80),
  highestQualification: z.string().max(200).optional(),
  institution: z.string().max(200).optional(),
  graduationYear: z.number().int().min(1950).max(2100).optional(),
  gpa: z.string().max(60).optional(),
  fundingSource: z.string().max(120).optional(),
  personalStatement: z.string().min(100).max(20_000),
  declaration: z.literal(true, {
    errorMap: () => ({ message: 'You must confirm the declaration before submitting.' }),
  }),
  documents: z.array(z.string()).max(12).default([]),
});

/**
 * POST /api/applications — submit an application.
 *
 * Open to anonymous callers by design: requiring an account before applying is a barrier
 * that costs more applications than it prevents spam. Rate limiting per IP plus the
 * duplicate check below is the trade we make instead. If the applicant does happen to be
 * signed in, the application is linked to their account so they can track it.
 */
export async function POST(request: Request) {
  try {
    const headerList = await headers();
    const ip = clientIp(headerList) ?? 'unknown';
    rateLimitOrThrow(`apply:${ip}`, 5, 3_600_000);

    const body = await parseBody(request, schema);
    const user = await getCurrentUser();

    const program = await prisma.program.findUnique({ where: { id: body.programId } });
    if (!program || !program.published) throw badRequest('That programme is not open for applications.');

    const email = body.email.trim().toLowerCase();

    // One live application per person per programme. A second is almost always an
    // accidental resubmit, and duplicates make the admissions queue much harder to work.
    const existing = await prisma.application.findFirst({
      where: {
        email,
        programId: body.programId,
        status: { notIn: ['REJECTED', 'WITHDRAWN', 'DECLINED'] },
      },
      select: { reference: true },
    });
    if (existing) {
      throw badRequest(
        `You already have an application to this programme (${existing.reference}). Track it rather than applying again.`,
      );
    }

    const sequence = (await prisma.application.count()) + 1;
    const reference = formatApplicationReference(sequence);

    const application = await prisma.application.create({
      data: {
        reference,
        userId: user?.id,
        programId: body.programId,
        status: 'SUBMITTED',
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
        email,
        phone: body.phone,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        gender: body.gender,
        nationality: body.nationality,
        country: body.country,
        highestQualification: body.highestQualification,
        institution: body.institution,
        graduationYear: body.graduationYear,
        gpa: body.gpa,
        fundingSource: body.fundingSource,
        intakeTerm: body.intakeTerm,
        personalStatement: body.personalStatement.trim(),
        submittedAt: new Date(),
        // Uploads arrive as declared types on this deployment; with S3 configured the
        // client uploads directly to a pre-signed URL and posts the resulting keys here.
        documents: {
          create: body.documents.map((type) => ({
            type: type as never,
            fileName: `${type.toLowerCase()}.pdf`,
            fileUrl: `/uploads/applications/${reference}/${type.toLowerCase()}.pdf`,
          })),
        },
      },
    });

    if (user) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Application submitted',
          body: `Your application to ${program.title} was received. Reference ${reference}.`,
          link: '/apply/status',
          category: 'admissions',
        },
      });
    }

    await audit({
      userId: user?.id ?? null,
      action: 'application.submit',
      entityType: 'Application',
      entityId: application.id,
      metadata: { reference, program: program.code },
      ip,
    });

    return created({
      reference,
      status: application.status,
      message: 'Application received. We aim to give a first decision within five working days.',
    });
  } catch (error) {
    return handleError(error);
  }
}
