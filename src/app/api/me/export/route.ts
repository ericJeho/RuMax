import { audit, handleError } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/me/export — GDPR Article 15 subject access export.
 *
 * Returns everything the platform holds about the caller in a portable format. Password
 * hashes and 2FA secrets are excluded: they are credentials rather than personal data,
 * and exporting them would create a risk with no benefit to the data subject.
 */
export async function GET() {
  try {
    const user = await requireUser();

    const [
      registrations,
      grades,
      submissions,
      attempts,
      invoices,
      payments,
      certificates,
      messagesSent,
      messagesReceived,
      notifications,
      attendance,
      applications,
      forumPosts,
      tutorConversations,
      sessions,
    ] = await Promise.all([
      prisma.registration.findMany({ where: { userId: user.id }, include: { course: { select: { code: true, title: true } } } }),
      prisma.grade.findMany({ where: { userId: user.id }, include: { course: { select: { code: true } } } }),
      prisma.submission.findMany({ where: { userId: user.id }, include: { assignment: { select: { title: true } } } }),
      prisma.quizAttempt.findMany({ where: { userId: user.id }, include: { quiz: { select: { title: true } } } }),
      prisma.invoice.findMany({ where: { userId: user.id } }),
      prisma.payment.findMany({ where: { userId: user.id } }),
      prisma.certificate.findMany({ where: { userId: user.id } }),
      prisma.message.findMany({ where: { senderId: user.id } }),
      prisma.message.findMany({ where: { recipientId: user.id } }),
      prisma.notification.findMany({ where: { userId: user.id } }),
      prisma.attendanceRecord.findMany({ where: { userId: user.id } }),
      prisma.application.findMany({ where: { userId: user.id }, include: { documents: true } }),
      prisma.forumPost.findMany({ where: { authorId: user.id } }),
      prisma.tutorConversation.findMany({ where: { userId: user.id } }),
      prisma.session.findMany({
        where: { userId: user.id },
        select: { createdAt: true, expiresAt: true, revokedAt: true, ip: true, userAgent: true },
      }),
    ]);

    const { passwordHash: _hash, twoFactorSecret: _secret, ...profile } = user;

    await audit({ userId: user.id, action: 'gdpr.export', entityType: 'User', entityId: user.id });

    const payload = {
      exportedAt: new Date().toISOString(),
      basis: 'GDPR Article 15 — right of access by the data subject',
      note: 'Credentials (password hash, 2FA secret) are deliberately excluded.',
      profile,
      academic: { registrations, grades, submissions, quizAttempts: attempts, attendance },
      finance: { invoices, payments },
      credentials: certificates,
      admissions: applications,
      communications: { messagesSent, messagesReceived, notifications, forumPosts },
      aiAssistance: tutorConversations,
      security: { sessions },
    };

    return new Response(JSON.stringify(payload, null, 2), {
      headers: {
        'content-type': 'application/json',
        'content-disposition': `attachment; filename="rumax-data-export-${user.id}.json"`,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
