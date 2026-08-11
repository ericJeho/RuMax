import { z } from 'zod';

import { audit, badRequest, created, handleError, notFound, parseBody } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';

const schema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(3).max(200),
  instructions: z.string().min(20).max(20_000),
  maxScore: z.number().int().min(1).max(1000).default(100),
  weight: z.number().min(0).max(1).default(0.15),
  dueAt: z.string().datetime(),
  allowLate: z.boolean().default(true),
  published: z.boolean().default(true),
});

/**
 * POST /api/assignments — set a new piece of work.
 *
 * Publishing notifies every approved student on the course. Creating it as a draft
 * notifies nobody, which is what you want while the brief is still being written.
 */
export async function POST(request: Request) {
  try {
    const user = await requireRole('LECTURER', 'ADMIN');
    const body = await parseBody(request, schema);

    const course = await prisma.course.findUnique({
      where: { id: body.courseId },
      select: { id: true, code: true, title: true, lecturerId: true },
    });
    if (!course) throw notFound('Course');
    if (user.role === 'LECTURER' && course.lecturerId !== user.id) throw notFound('Course');

    const dueAt = new Date(body.dueAt);
    if (dueAt.getTime() < Date.now()) throw badRequest('The deadline is in the past.');

    const assignment = await prisma.assignment.create({
      data: {
        courseId: course.id,
        title: body.title.trim(),
        instructions: body.instructions.trim(),
        maxScore: body.maxScore,
        weight: body.weight,
        dueAt,
        allowLate: body.allowLate,
        published: body.published,
      },
    });

    let notified = 0;
    if (body.published) {
      const students = await prisma.registration.findMany({
        where: { courseId: course.id, status: 'APPROVED' },
        select: { userId: true },
      });

      const result = await prisma.notification.createMany({
        data: students.map((student) => ({
          userId: student.userId,
          title: `New assignment: ${assignment.title}`,
          body: `${course.code} — due ${dueAt.toISOString().slice(0, 10)}. Worth ${Math.round(body.weight * 100)}% of the course.`,
          link: '/portal/assignments',
          category: 'assignment',
        })),
      });
      notified = result.count;
    }

    await audit({
      userId: user.id,
      action: 'assignment.create',
      entityType: 'Assignment',
      entityId: assignment.id,
      metadata: { course: course.code, published: body.published, notified },
    });

    return created({ id: assignment.id, notified, published: assignment.published });
  } catch (error) {
    return handleError(error);
  }
}
