import { z } from 'zod';

import { audit, handleError, ok, parseBody } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';

const schema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(500),
  status: z.enum(['APPROVED', 'REJECTED']),
  reason: z.string().max(1000).optional(),
});

/**
 * POST /api/registrations/decision — approve or decline registrations in bulk.
 *
 * Registrations already decided are left alone rather than re-decided, so a double
 * submit cannot flip an approval a student is already studying under.
 */
export async function POST(request: Request) {
  try {
    const officer = await requireRole('ADMIN', 'REGISTRAR');
    const body = await parseBody(request, schema);

    const registrations = await prisma.registration.findMany({
      where: { id: { in: body.ids }, status: 'PENDING' },
      include: {
        course: { select: { code: true, title: true } },
        term: { select: { name: true } },
      },
    });

    if (registrations.length === 0) return ok({ updated: 0, notified: 0 });

    const result = await prisma.registration.updateMany({
      where: { id: { in: registrations.map((r) => r.id) }, status: 'PENDING' },
      data: {
        status: body.status,
        approvedById: officer.id,
        approvedAt: body.status === 'APPROVED' ? new Date() : null,
      },
    });

    const notifications = await prisma.notification.createMany({
      data: registrations.map((registration) => ({
        userId: registration.userId,
        title: body.status === 'APPROVED' ? 'Registration approved' : 'Registration declined',
        body:
          body.status === 'APPROVED'
            ? `You are registered for ${registration.course.code} ${registration.course.title} in ${registration.term.name}. Course material is now open to you.`
            : `Your registration for ${registration.course.code} was declined.${body.reason ? ` ${body.reason}` : ' Contact the registrar to discuss.'}`,
        link: '/portal/courses',
        category: 'registration',
      })),
    });

    await audit({
      userId: officer.id,
      action: 'registration.decision',
      entityType: 'Registration',
      metadata: { status: body.status, count: result.count, reason: body.reason },
    });

    return ok({ updated: result.count, notified: notifications.count });
  } catch (error) {
    return handleError(error);
  }
}
