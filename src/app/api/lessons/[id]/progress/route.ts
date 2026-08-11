import { z } from 'zod';

import { handleError, notFound, ok, parseBody } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

const schema = z.object({
  completed: z.boolean(),
  secondsSpent: z.number().int().min(0).max(86_400).optional(),
});

/**
 * POST /api/lessons/:id/progress — record that a student completed (or un-completed) a
 * lesson. Idempotent: repeated calls with the same value are a no-op.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await parseBody(request, schema);

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      select: { id: true, module: { select: { courseId: true } } },
    });
    if (!lesson) throw notFound('Lesson');

    // Progress may only be recorded against a course the student is registered for.
    const registration = await prisma.registration.findFirst({
      where: { userId: user.id, courseId: lesson.module.courseId, status: 'APPROVED' },
      select: { id: true },
    });
    if (!registration && user.role !== 'ADMIN') throw notFound('Lesson');

    const progress = await prisma.lessonProgress.upsert({
      where: { lessonId_userId: { lessonId: id, userId: user.id } },
      create: {
        lessonId: id,
        userId: user.id,
        completed: body.completed,
        secondsSpent: body.secondsSpent ?? 0,
        completedAt: body.completed ? new Date() : null,
      },
      update: {
        completed: body.completed,
        completedAt: body.completed ? new Date() : null,
        ...(body.secondsSpent ? { secondsSpent: { increment: body.secondsSpent } } : {}),
      },
    });

    return ok({ lessonId: progress.lessonId, completed: progress.completed });
  } catch (error) {
    return handleError(error);
  }
}
