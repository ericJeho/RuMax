import { handleError, ok } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

/** POST /api/notifications/read-all — clears the caller's unread badge. */
export async function POST() {
  try {
    const user = await requireUser();
    const result = await prisma.notification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });
    return ok({ marked: result.count });
  } catch (error) {
    return handleError(error);
  }
}
