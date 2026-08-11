import type { Metadata } from 'next';
import Link from 'next/link';

import { Badge, Card, CardBody, EmptyState, PageHeader } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatRelative, truncate } from '@/lib/format';

export const metadata: Metadata = { title: 'Discussion boards' };
export const dynamic = 'force-dynamic';

export default async function LecturerForumsPage() {
  const user = await requireUser();

  const threads = await prisma.forumThread.findMany({
    where: { course: user.role === 'ADMIN' ? {} : { lecturerId: user.id } },
    include: {
      author: { select: { firstName: true, lastName: true, role: true } },
      course: { select: { code: true } },
      posts: { select: { isAnswer: true, authorId: true } },
    },
    orderBy: [{ updatedAt: 'desc' }],
  });

  const unanswered = threads.filter((thread) => !thread.posts.some((post) => post.isAnswer));

  return (
    <>
      <PageHeader
        title="Discussion boards"
        description={`${unanswered.length} thread${unanswered.length === 1 ? '' : 's'} without an accepted answer. These are where your time goes furthest.`}
      />

      {threads.length === 0 ? (
        <EmptyState title="No discussions" description="Threads from your courses appear here." />
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => {
            const answered = thread.posts.some((post) => post.isAnswer);
            return (
              <Card key={thread.id} hover>
                <CardBody>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                        <span className="font-mono">{thread.course?.code}</span>
                        <span>·</span>
                        <span>
                          {thread.author.firstName} {thread.author.lastName}
                        </span>
                        <span>·</span>
                        <span>{formatRelative(thread.createdAt)}</span>
                      </p>
                      <h2 className="font-display text-base font-semibold leading-snug">
                        <Link href={`/portal/forums/${thread.id}`} className="hover:text-brand">
                          {thread.title}
                        </Link>
                      </h2>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted">{truncate(thread.body, 180)}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <Badge tone={answered ? 'success' : 'warning'}>
                        {answered ? 'Answered' : 'Needs an answer'}
                      </Badge>
                      <span className="text-xs text-muted">{thread.posts.length} replies</span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
