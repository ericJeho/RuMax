import type { Metadata } from 'next';
import Link from 'next/link';

import { Badge, Card, CardBody, EmptyState, PageHeader } from '@/components/ui';
import { MarkAllRead } from './mark-all-read';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatRelative } from '@/lib/format';

export const metadata: Metadata = { title: 'Notifications' };
export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const user = await requireUser();

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const unread = notifications.filter((n) => !n.readAt).length;

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Deadlines, grades, payments and messages — everything the platform has told you."
        actions={unread > 0 ? <MarkAllRead /> : null}
      />

      {notifications.length === 0 ? (
        <EmptyState title="Nothing yet" description="Notifications appear here as things happen." />
      ) : (
        <Card>
          <CardBody className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start justify-between gap-4 rounded-xl border p-4 ${
                  notification.readAt ? 'border-border' : 'border-brand/40 bg-brand/5'
                }`}
              >
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    {notification.title}
                    <Badge>{notification.category}</Badge>
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{notification.body}</p>
                  {notification.link ? (
                    <Link
                      href={notification.link}
                      className="mt-1.5 inline-block text-sm font-medium text-brand hover:underline"
                    >
                      Open →
                    </Link>
                  ) : null}
                </div>
                <span className="shrink-0 text-xs text-muted">
                  {formatRelative(notification.createdAt)}
                </span>
              </div>
            ))}
          </CardBody>
        </Card>
      )}
    </>
  );
}
