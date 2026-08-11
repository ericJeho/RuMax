import type { Metadata } from 'next';
import Link from 'next/link';
import { MessageSquare, Pin } from 'lucide-react';

import { Badge, Card, CardBody, EmptyState, PageHeader } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatRelative, truncate } from '@/lib/format';

export const metadata: Metadata = { title: 'Discussion forums' };
export const dynamic = 'force-dynamic';

export default async function ForumsPage() {
  const user = await requireUser();

  const threads = await prisma.forumThread.findMany({
    where: { course: { registrations: { some: { userId: user.id, status: 'APPROVED' } } } },
    include: {
      author: { select: { firstName: true, lastName: true, role: true } },
      course: { select: { code: true, title: true } },
      _count: { select: { posts: true } },
    },
    orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
  });

  return (
    <>
      <PageHeader
        title="Discussion forums"
        description="Ask, answer and argue. The best explanations in your cohort usually come from other students."
      />

      {threads.length === 0 ? (
        <EmptyState
          icon={<MessageSquare size={30} aria-hidden />}
          title="No discussions yet"
          description="Start one from any course page — a half-formed question is still worth posting."
        />
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => (
            <Card key={thread.id} hover>
              <CardBody>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                      {thread.pinned ? (
                        <Badge tone="brand">
                          <Pin size={10} aria-hidden /> Pinned
                        </Badge>
                      ) : null}
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
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">
                      {truncate(thread.body, 190)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right text-xs text-muted">
                    <p className="font-display text-xl font-semibold text-fg">{thread._count.posts}</p>
                    <p>replies</p>
                    <p className="mt-2">{thread.views} views</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
