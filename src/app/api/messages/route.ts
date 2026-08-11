import { z } from 'zod';

import { audit, badRequest, created, handleError, ok, parseBody, rateLimitOrThrow } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

const schema = z.object({
  recipientId: z.string().min(1),
  subject: z.string().min(1).max(150),
  body: z.string().min(1).max(10_000),
});

export const dynamic = 'force-dynamic';

/** GET /api/messages — the caller's inbox. */
export async function GET() {
  try {
    const user = await requireUser();
    const messages = await prisma.message.findMany({
      where: { recipientId: user.id },
      include: { sender: { select: { firstName: true, lastName: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return ok({ messages, unread: messages.filter((m) => !m.readAt).length });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/messages
 *
 * Students may only write to staff who actually teach or administer them. Without this
 * restriction the messaging system becomes a directory of 148,000 addressable students.
 */
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    rateLimitOrThrow(`message:${user.id}`, 20, 3_600_000);

    const body = await parseBody(request, schema);
    if (body.recipientId === user.id) throw badRequest('You cannot message yourself.');

    const recipient = await prisma.user.findUnique({
      where: { id: body.recipientId },
      select: { id: true, role: true, firstName: true },
    });
    if (!recipient) throw badRequest('That recipient does not exist.');

    if (['STUDENT', 'ALUMNI', 'APPLICANT'].includes(user.role)) {
      const allowed =
        ['REGISTRAR', 'FINANCE', 'ADMIN'].includes(recipient.role) ||
        (await prisma.course.count({
          where: { lecturerId: recipient.id, registrations: { some: { userId: user.id } } },
        })) > 0;

      if (!allowed) {
        throw badRequest('You can only message staff who teach or administer your programme.');
      }
    }

    const message = await prisma.message.create({
      data: {
        senderId: user.id,
        recipientId: recipient.id,
        subject: body.subject.trim(),
        body: body.body.trim(),
      },
    });

    await prisma.notification.create({
      data: {
        userId: recipient.id,
        title: `New message from ${user.firstName} ${user.lastName}`,
        body: body.subject.trim(),
        link: '/portal/messages',
        category: 'message',
      },
    });

    await audit({
      userId: user.id,
      action: 'message.send',
      entityType: 'Message',
      entityId: message.id,
      metadata: { recipientId: recipient.id },
    });

    return created({ id: message.id, createdAt: message.createdAt });
  } catch (error) {
    return handleError(error);
  }
}
