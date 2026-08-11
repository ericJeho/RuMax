import { z } from 'zod';

import { audit, badRequest, handleError, notFound, ok, parseBody } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';

const schema = z.object({
  score: z.number().min(0),
  feedback: z.string().min(10).max(20_000),
});

/**
 * POST /api/submissions/:id/grade — record a mark and release it to the student.
 *
 * Only the lecturer who owns the course (or an administrator) may mark. The score is
 * validated against the assignment's maximum server-side, since a mark above the maximum
 * would silently corrupt every weighted aggregate downstream.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const marker = await requireRole('LECTURER', 'ADMIN', 'REGISTRAR');
    const { id } = await params;
    const body = await parseBody(request, schema);

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        assignment: { include: { course: { select: { id: true, code: true, lecturerId: true } } } },
        user: { select: { id: true, firstName: true } },
      },
    });
    if (!submission) throw notFound('Submission');

    if (marker.role === 'LECTURER' && submission.assignment.course.lecturerId !== marker.id) {
      throw notFound('Submission');
    }

    if (body.score > submission.assignment.maxScore) {
      throw badRequest(`The maximum for this assignment is ${submission.assignment.maxScore}.`);
    }

    const updated = await prisma.submission.update({
      where: { id },
      data: {
        score: body.score,
        feedback: body.feedback.trim(),
        status: 'GRADED',
        gradedById: marker.id,
        gradedAt: new Date(),
      },
    });

    await prisma.notification.create({
      data: {
        userId: submission.user.id,
        title: 'Assignment marked',
        body: `${submission.assignment.title} has been marked: ${body.score}/${submission.assignment.maxScore}.`,
        link: '/portal/assignments',
        category: 'grade',
      },
    });

    await audit({
      userId: marker.id,
      action: 'submission.grade',
      entityType: 'Submission',
      entityId: id,
      metadata: {
        student: submission.user.id,
        course: submission.assignment.course.code,
        score: body.score,
        max: submission.assignment.maxScore,
      },
    });

    return ok({ id: updated.id, score: updated.score, status: updated.status });
  } catch (error) {
    return handleError(error);
  }
}
