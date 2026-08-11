import { z } from 'zod';

import { audit, badRequest, handleError, notFound, ok, parseBody } from '@/lib/api';
import { requireRole, hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatInvoiceNumber, formatStudentNumber } from '@/lib/certificates';

const schema = z.object({
  status: z.enum(['UNDER_REVIEW', 'INTERVIEW', 'OFFER_MADE', 'ACCEPTED', 'REJECTED', 'ENROLLED', 'WITHDRAWN']),
  notes: z.string().max(5000).optional(),
  interviewAt: z.string().datetime().optional(),
});

/** Documents that must be on file before an offer can be issued. */
const REQUIRED_DOCUMENTS = ['PASSPORT_PHOTO', 'ACADEMIC_CERTIFICATE', 'TRANSCRIPT'] as const;

/**
 * POST /api/applications/:id/decision — move an application through admissions.
 *
 * Enrolment is the consequential step and does several things atomically: it promotes
 * the applicant's account to STUDENT, issues a student number, attaches them to the
 * programme, and raises their first tuition invoice. Doing these separately risks a
 * student who exists but cannot register, or one who is registered but never billed.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const officer = await requireRole('ADMIN', 'REGISTRAR');
    const { id } = await params;
    const body = await parseBody(request, schema);

    const application = await prisma.application.findUnique({
      where: { id },
      include: { program: true, documents: { select: { type: true } }, user: true },
    });
    if (!application) throw notFound('Application');

    if (body.status === 'OFFER_MADE') {
      const present = new Set(application.documents.map((document) => document.type));
      const missing = REQUIRED_DOCUMENTS.filter((type) => !present.has(type));
      if (missing.length > 0) {
        throw badRequest(
          `Cannot issue an offer while these documents are missing: ${missing
            .map((type) => type.replace(/_/g, ' ').toLowerCase())
            .join(', ')}.`,
        );
      }
    }

    if (body.status === 'ENROLLED' && !['OFFER_MADE', 'ACCEPTED'].includes(application.status)) {
      throw badRequest('An applicant must have an offer before they can be enrolled.');
    }

    let studentNumber: string | null = null;

    await prisma.$transaction(async (tx) => {
      await tx.application.update({
        where: { id },
        data: {
          status: body.status,
          reviewNotes: body.notes
            ? `${application.reviewNotes ? `${application.reviewNotes}\n\n` : ''}[${new Date()
                .toISOString()
                .slice(0, 10)} ${officer.firstName} ${officer.lastName}] ${body.notes}`
            : application.reviewNotes,
          reviewedById: officer.id,
          reviewedAt: new Date(),
          ...(body.status === 'INTERVIEW' && body.interviewAt
            ? { interviewAt: new Date(body.interviewAt) }
            : {}),
          ...(body.status === 'OFFER_MADE'
            ? { offerIssuedAt: new Date(), offerExpiresAt: new Date(Date.now() + 28 * 86_400_000) }
            : {}),
        },
      });

      if (body.status !== 'ENROLLED') return;

      const admissionYear = new Date().getFullYear();
      const cohortSize = await tx.user.count({ where: { role: 'STUDENT' } });
      studentNumber = formatStudentNumber(admissionYear, cohortSize + 1);

      // The applicant may not have an account yet — applications can be submitted by
      // someone who registered, or created on their behalf by an admissions officer.
      const account = application.user
        ? await tx.user.update({
            where: { id: application.user.id },
            data: {
              role: 'STUDENT',
              status: 'ACTIVE',
              studentNumber,
              programId: application.programId,
              yearOfStudy: 1,
              admittedAt: new Date(),
              country: application.country ?? application.user.country,
            },
          })
        : await tx.user.create({
            data: {
              email: application.email.toLowerCase(),
              // A random unusable password: the student sets their own via the welcome
              // email's reset link. We never generate a password anyone could guess.
              passwordHash: await hashPassword(crypto.randomUUID() + crypto.randomUUID()),
              firstName: application.firstName,
              lastName: application.lastName,
              role: 'STUDENT',
              status: 'ACTIVE',
              studentNumber,
              programId: application.programId,
              yearOfStudy: 1,
              admittedAt: new Date(),
              country: application.country,
              phone: application.phone,
            },
          });

      await tx.application.update({ where: { id }, data: { userId: account.id } });

      const term = await tx.academicTerm.findFirst({ where: { isCurrent: true } });
      const invoiceCount = await tx.invoice.count();

      await tx.invoice.create({
        data: {
          invoiceNumber: formatInvoiceNumber(invoiceCount + 1),
          userId: account.id,
          termId: term?.id,
          description: `Tuition — ${term?.name ?? 'first term'}`,
          amount: application.program.tuitionPerYear,
          currency: application.program.currency,
          dueDate: new Date(Date.now() + 30 * 86_400_000),
          items: [
            { label: `${application.program.title} tuition`, amount: Number(application.program.tuitionPerYear) },
          ],
        },
      });

      await tx.notification.create({
        data: {
          userId: account.id,
          title: 'Welcome to RuMax',
          body: `You are enrolled on ${application.program.title} as ${studentNumber}. Register for courses to begin.`,
          link: '/portal/registration',
          category: 'admissions',
        },
      });
    });

    // Applicants with an account are told about every other decision too.
    if (application.userId && body.status !== 'ENROLLED') {
      await prisma.notification.create({
        data: {
          userId: application.userId,
          title: `Application ${body.status.replace(/_/g, ' ').toLowerCase()}`,
          body:
            body.status === 'OFFER_MADE'
              ? `Congratulations — you have been offered a place on ${application.program.title}. The offer is open for 28 days.`
              : `Your application ${application.reference} is now ${body.status.replace(/_/g, ' ').toLowerCase()}.`,
          link: '/apply/status',
          category: 'admissions',
        },
      });
    }

    await audit({
      userId: officer.id,
      action: 'application.decision',
      entityType: 'Application',
      entityId: id,
      metadata: {
        reference: application.reference,
        from: application.status,
        to: body.status,
        studentNumber,
      },
    });

    return ok({ id, status: body.status, studentNumber });
  } catch (error) {
    return handleError(error);
  }
}
