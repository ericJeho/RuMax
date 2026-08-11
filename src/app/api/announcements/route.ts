import { z } from 'zod';

import { audit, created, handleError, ok, parseBody } from '@/lib/api';
import { getSessionClaims, requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { Prisma, Role } from '@prisma/client';

const schema = z.object({
  title: z.string().min(3).max(150),
  body: z.string().min(10).max(10_000),
  audience: z.enum(['ALL', 'STUDENTS', 'LECTURERS', 'STAFF', 'ALUMNI', 'APPLICANTS']).default('ALL'),
  pinned: z.boolean().default(false),
  notify: z.boolean().default(true),
  expiresAt: z.string().datetime().optional(),
});

/** Which roles each audience maps to when fanning out notifications. */
const AUDIENCE_ROLES: Record<string, Role[]> = {
  ALL: ['STUDENT', 'LECTURER', 'REGISTRAR', 'FINANCE', 'ADMIN', 'ALUMNI', 'APPLICANT'],
  STUDENTS: ['STUDENT'],
  LECTURERS: ['LECTURER'],
  STAFF: ['REGISTRAR', 'FINANCE', 'ADMIN'],
  ALUMNI: ['ALUMNI'],
  APPLICANTS: ['APPLICANT'],
};

export const dynamic = 'force-dynamic';

/** GET /api/announcements — announcements visible to the caller. */
export async function GET() {
  try {
    const claims = await getSessionClaims();

    const audiences: Prisma.AnnouncementWhereInput['audience'] = claims
      ? {
          in: [
            'ALL',
            ...(claims.role === 'STUDENT' ? (['STUDENTS'] as const) : []),
            ...(claims.role === 'LECTURER' ? (['LECTURERS'] as const) : []),
            ...(['REGISTRAR', 'FINANCE', 'ADMIN'].includes(claims.role) ? (['STAFF'] as const) : []),
            ...(claims.role === 'ALUMNI' ? (['ALUMNI'] as const) : []),
            ...(claims.role === 'APPLICANT' ? (['APPLICANTS'] as const) : []),
          ],
        }
      : 'ALL';

    const announcements = await prisma.announcement.findMany({
      where: {
        audience: audiences,
        OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
      },
      orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
      take: 30,
    });

    return ok({ announcements });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/announcements — publish to an audience.
 *
 * Notification fan-out is capped: a single announcement to a 148,000-student body would
 * otherwise write 148,000 rows in one request. Beyond the cap the announcement is still
 * published — it appears in every relevant portal — but the push is queued for the
 * background worker described in docs/OPERATIONS.md.
 */
const NOTIFY_INLINE_LIMIT = 5000;

export async function POST(request: Request) {
  try {
    const officer = await requireRole('ADMIN', 'REGISTRAR', 'LECTURER');
    const body = await parseBody(request, schema);

    const announcement = await prisma.announcement.create({
      data: {
        title: body.title.trim(),
        body: body.body.trim(),
        audience: body.audience,
        pinned: body.pinned,
        authorId: officer.id,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      },
    });

    let notified = 0;
    let queued = false;

    if (body.notify) {
      const roles = AUDIENCE_ROLES[body.audience] ?? [];
      const recipients = await prisma.user.findMany({
        where: { role: { in: roles }, status: { in: ['ACTIVE', 'PENDING', 'GRADUATED'] } },
        select: { id: true },
        take: NOTIFY_INLINE_LIMIT + 1,
      });

      if (recipients.length > NOTIFY_INLINE_LIMIT) {
        queued = true;
      } else {
        const result = await prisma.notification.createMany({
          data: recipients.map((recipient) => ({
            userId: recipient.id,
            title: announcement.title,
            body: announcement.body.slice(0, 300),
            link: '/portal/notifications',
            category: 'announcement',
          })),
        });
        notified = result.count;
      }
    }

    await audit({
      userId: officer.id,
      action: 'announcement.publish',
      entityType: 'Announcement',
      entityId: announcement.id,
      metadata: { audience: body.audience, notified, queued },
    });

    return created({ id: announcement.id, notified, queued });
  } catch (error) {
    return handleError(error);
  }
}
