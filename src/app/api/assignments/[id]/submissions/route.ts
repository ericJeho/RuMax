import { z } from 'zod';

import { audit, badRequest, handleError, notFound, ok, parseBody } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

const schema = z.object({
  content: z.string().max(200_000),
  fileUrl: z.string().url().optional(),
  status: z.enum(['DRAFT', 'SUBMITTED']),
});

/**
 * POST /api/assignments/:id/submissions
 *
 * Creates or updates the caller's submission. A submission that has already been graded
 * is immutable — students cannot silently replace work after receiving a mark.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await parseBody(request, schema);

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: { course: { select: { id: true, code: true } } },
    });
    if (!assignment || !assignment.published) throw notFound('Assignment');

    const registration = await prisma.registration.findFirst({
      where: { userId: user.id, courseId: assignment.course.id, status: 'APPROVED' },
      select: { id: true },
    });
    if (!registration) throw notFound('Assignment');

    const existing = await prisma.submission.findUnique({
      where: { assignmentId_userId: { assignmentId: id, userId: user.id } },
    });

    if (existing && ['GRADED', 'RETURNED'].includes(existing.status)) {
      throw badRequest('This assignment has already been marked and can no longer be changed.');
    }

    const past = assignment.dueAt.getTime() < Date.now();
    if (body.status === 'SUBMITTED' && past && !assignment.allowLate) {
      throw badRequest('The deadline has passed and this assignment does not accept late work.');
    }

    // A submission handed in after the deadline is recorded as LATE, not SUBMITTED, so
    // the lecturer can apply the published penalty rather than having to check dates.
    const status = body.status === 'SUBMITTED' ? (past ? 'LATE' : 'SUBMITTED') : 'DRAFT';

    const submission = await prisma.submission.upsert({
      where: { assignmentId_userId: { assignmentId: id, userId: user.id } },
      create: {
        assignmentId: id,
        userId: user.id,
        content: body.content,
        fileUrl: body.fileUrl,
        status,
        submittedAt: body.status === 'SUBMITTED' ? new Date() : null,
      },
      update: {
        content: body.content,
        fileUrl: body.fileUrl,
        status,
        submittedAt: body.status === 'SUBMITTED' ? new Date() : existing?.submittedAt,
      },
    });

    if (body.status === 'SUBMITTED') {
      await audit({
        userId: user.id,
        action: 'assignment.submit',
        entityType: 'Submission',
        entityId: submission.id,
        metadata: { assignment: assignment.title, course: assignment.course.code, late: past },
      });

      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Assignment submitted',
          body: `${assignment.title} was received${past ? ' after the deadline' : ''}.`,
          link: '/portal/assignments',
          category: 'assignment',
        },
      });
    }

    return ok({
      id: submission.id,
      status: submission.status,
      submittedAt: submission.submittedAt,
    });
  } catch (error) {
    return handleError(error);
  }
}
