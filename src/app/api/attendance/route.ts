import { z } from 'zod';

import { audit, badRequest, handleError, notFound, ok, parseBody } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';

const schema = z.object({
  courseId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD.'),
  records: z
    .array(
      z.object({
        userId: z.string().min(1),
        status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
        note: z.string().max(300).optional(),
      }),
    )
    .min(1)
    .max(500),
});

/**
 * POST /api/attendance — save a register.
 *
 * Upserts on (student, course, date) so re-taking a register corrects it rather than
 * creating duplicate rows: registers get amended constantly after the fact.
 */
export async function POST(request: Request) {
  try {
    const user = await requireRole('LECTURER', 'ADMIN', 'REGISTRAR');
    const body = await parseBody(request, schema);

    const course = await prisma.course.findUnique({
      where: { id: body.courseId },
      select: { id: true, code: true, lecturerId: true },
    });
    if (!course) throw notFound('Course');
    if (user.role === 'LECTURER' && course.lecturerId !== user.id) throw notFound('Course');

    const date = new Date(`${body.date}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) throw badRequest('That date is not valid.');
    if (date.getTime() > Date.now() + 86_400_000) {
      throw badRequest('You cannot take a register for a future session.');
    }

    // Only students actually registered on the course may appear on its register.
    const registered = await prisma.registration.findMany({
      where: { courseId: course.id, status: 'APPROVED', userId: { in: body.records.map((r) => r.userId) } },
      select: { userId: true },
    });
    const allowed = new Set(registered.map((r) => r.userId));
    const records = body.records.filter((record) => allowed.has(record.userId));

    if (records.length === 0) throw badRequest('None of those students are registered on this course.');

    await prisma.$transaction(
      records.map((record) =>
        prisma.attendanceRecord.upsert({
          where: {
            userId_courseId_date: { userId: record.userId, courseId: course.id, date },
          },
          create: {
            userId: record.userId,
            courseId: course.id,
            date,
            status: record.status,
            note: record.note,
          },
          update: { status: record.status, note: record.note },
        }),
      ),
    );

    await audit({
      userId: user.id,
      action: 'attendance.record',
      entityType: 'Course',
      entityId: course.id,
      metadata: {
        course: course.code,
        date: body.date,
        recorded: records.length,
        absent: records.filter((r) => r.status === 'ABSENT').length,
      },
    });

    return ok({ recorded: records.length, skipped: body.records.length - records.length });
  } catch (error) {
    return handleError(error);
  }
}
