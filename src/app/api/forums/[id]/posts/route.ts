import { z } from 'zod';

import { audit, badRequest, created, handleError, notFound, parseBody, rateLimitOrThrow } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

const schema = z.object({ body: z.string().min(5).max(20_000) });

/** POST /api/forums/:id/posts — reply to a course discussion thread. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    rateLimitOrThrow(`forum:${user.id}`, 30, 3_600_000);

    const { id } = await params;
    const { body } = await parseBody(request, schema);

    const thread = await prisma.forumThread.findUnique({
      where: { id },
      select: { id: true, locked: true, courseId: true },
    });
    if (!thread) throw notFound('Thread');
    if (thread.locked) throw badRequest('This thread is locked.');

    if (thread.courseId) {
      const registered = await prisma.registration.findFirst({
        where: { userId: user.id, courseId: thread.courseId },
        select: { id: true },
      });
      const teaches = await prisma.course.count({
        where: { id: thread.courseId, lecturerId: user.id },
      });
      if (!registered && teaches === 0 && user.role !== 'ADMIN') throw notFound('Thread');
    }

    const post = await prisma.forumPost.create({
      data: { threadId: id, authorId: user.id, body: body.trim() },
    });

    // Bump the thread so active discussions rise to the top of the list.
    await prisma.forumThread.update({ where: { id }, data: { updatedAt: new Date() } });

    await audit({
      userId: user.id,
      action: 'forum.post',
      entityType: 'ForumPost',
      entityId: post.id,
      metadata: { threadId: id },
    });

    return created({ id: post.id, createdAt: post.createdAt });
  } catch (error) {
    return handleError(error);
  }
}
