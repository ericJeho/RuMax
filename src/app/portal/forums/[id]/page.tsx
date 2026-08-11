import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CheckCircle2, ThumbsUp } from 'lucide-react';

import { Avatar, Badge, Breadcrumbs, Card, CardBody, PageHeader } from '@/components/ui';
import { ReplyForm } from './reply-form';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatRelative } from '@/lib/format';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const thread = await prisma.forumThread.findUnique({ where: { id }, select: { title: true } });
  return { title: thread?.title ?? 'Discussion' };
}

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();

  const thread = await prisma.forumThread.findUnique({
    where: { id },
    include: {
      author: { select: { firstName: true, lastName: true, role: true, avatarUrl: true } },
      course: { select: { code: true, title: true, id: true } },
      posts: {
        include: { author: { select: { firstName: true, lastName: true, role: true, avatarUrl: true } } },
        orderBy: [{ isAnswer: 'desc' }, { createdAt: 'asc' }],
      },
    },
  });
  if (!thread) notFound();

  if (thread.course) {
    const registered = await prisma.registration.findFirst({
      where: { userId: user.id, courseId: thread.course.id },
      select: { id: true },
    });
    if (!registered && user.role !== 'ADMIN') notFound();
  }

  // View counting is best-effort and must never block rendering the page.
  await prisma.forumThread
    .update({ where: { id }, data: { views: { increment: 1 } } })
    .catch(() => undefined);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Portal', href: '/portal' },
          { label: 'Forums', href: '/portal/forums' },
          { label: thread.course?.code ?? 'Discussion' },
        ]}
      />

      <PageHeader
        title={thread.title}
        description={`${thread.course?.code ?? ''} ${thread.course?.title ?? ''} · ${thread.posts.length} replies · ${thread.views} views`}
      />

      <div className="mx-auto max-w-3xl space-y-4">
        <Card>
          <CardBody>
            <Post
              name={`${thread.author.firstName} ${thread.author.lastName}`}
              role={thread.author.role}
              avatarUrl={thread.author.avatarUrl}
              body={thread.body}
              when={formatRelative(thread.createdAt)}
            />
          </CardBody>
        </Card>

        {thread.posts.map((post) => (
          <Card key={post.id} className={post.isAnswer ? 'border-success/40' : undefined}>
            <CardBody>
              {post.isAnswer ? (
                <Badge tone="success" className="mb-3">
                  <CheckCircle2 size={11} aria-hidden />
                  Marked as the answer
                </Badge>
              ) : null}
              <Post
                name={`${post.author.firstName} ${post.author.lastName}`}
                role={post.author.role}
                avatarUrl={post.author.avatarUrl}
                body={post.body}
                when={formatRelative(post.createdAt)}
                upvotes={post.upvotes}
              />
            </CardBody>
          </Card>
        ))}

        {thread.locked ? (
          <Card>
            <CardBody className="text-sm text-muted">
              This thread is locked. Start a new one if you have a follow-up question.
            </CardBody>
          </Card>
        ) : (
          <ReplyForm threadId={thread.id} />
        )}
      </div>
    </>
  );
}

function Post({
  name,
  role,
  avatarUrl,
  body,
  when,
  upvotes,
}: {
  name: string;
  role: string;
  avatarUrl?: string | null;
  body: string;
  when: string;
  upvotes?: number;
}) {
  return (
    <div className="flex gap-3">
      <Avatar name={name} src={avatarUrl} size={38} />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline gap-2 text-sm">
          <span className="font-semibold">{name}</span>
          <span className="text-xs capitalize text-muted">{role.toLowerCase()}</span>
          <span className="text-xs text-muted">· {when}</span>
        </p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted">{body}</p>
        {upvotes !== undefined ? (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
            <ThumbsUp size={12} aria-hidden />
            {upvotes} found this helpful
          </p>
        ) : null}
      </div>
    </div>
  );
}
