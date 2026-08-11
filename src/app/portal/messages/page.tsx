import type { Metadata } from 'next';

import { Avatar, Badge, Card, CardBody, CardHeader, CardTitle, EmptyState, PageHeader } from '@/components/ui';
import { ComposeMessage } from './compose';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatRelative } from '@/lib/format';

export const metadata: Metadata = { title: 'Messages' };
export const dynamic = 'force-dynamic';

export default async function MessagesPage() {
  const user = await requireUser();

  const [received, sent, contacts] = await Promise.all([
    prisma.message.findMany({
      where: { recipientId: user.id },
      include: { sender: { select: { firstName: true, lastName: true, role: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.message.findMany({
      where: { senderId: user.id },
      include: { recipient: { select: { firstName: true, lastName: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    // People a student can legitimately write to: the lecturers teaching them, plus the
    // registrar. Free-form recipient entry would turn the portal into a spam vector.
    prisma.user.findMany({
      where: {
        OR: [
          { taughtCourses: { some: { registrations: { some: { userId: user.id } } } } },
          { role: { in: ['REGISTRAR', 'FINANCE'] } },
        ],
      },
      select: { id: true, firstName: true, lastName: true, role: true },
      orderBy: { lastName: 'asc' },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Messages"
        description="Direct messages with your lecturers and university offices."
      />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle as="h2">Inbox</CardTitle>
              <Badge>{received.filter((m) => !m.readAt).length} unread</Badge>
            </CardHeader>
            <CardBody className="space-y-3">
              {received.length === 0 ? (
                <EmptyState title="No messages" description="Messages from staff appear here." />
              ) : (
                received.map((message) => (
                  <article
                    key={message.id}
                    className={`rounded-xl border p-4 ${message.readAt ? 'border-border' : 'border-brand/40 bg-brand/5'}`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar
                        name={`${message.sender.firstName} ${message.sender.lastName}`}
                        src={message.sender.avatarUrl}
                        size={36}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="text-sm font-semibold">
                            {message.sender.firstName} {message.sender.lastName}
                            <span className="ml-2 text-xs font-normal capitalize text-muted">
                              {message.sender.role.toLowerCase()}
                            </span>
                          </p>
                          <p className="text-xs text-muted">{formatRelative(message.createdAt)}</p>
                        </div>
                        <p className="mt-0.5 font-medium">{message.subject}</p>
                        <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-muted">
                          {message.body}
                        </p>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </CardBody>
          </Card>

          {sent.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle as="h2">Sent</CardTitle>
              </CardHeader>
              <CardBody className="space-y-2">
                {sent.map((message) => (
                  <div key={message.id} className="border-b border-border/60 py-2 last:border-0">
                    <p className="text-sm font-medium">{message.subject}</p>
                    <p className="text-xs text-muted">
                      To {message.recipient.firstName} {message.recipient.lastName} ·{' '}
                      {formatRelative(message.createdAt)}
                    </p>
                  </div>
                ))}
              </CardBody>
            </Card>
          ) : null}
        </div>

        <ComposeMessage
          contacts={contacts.map((contact) => ({
            id: contact.id,
            label: `${contact.firstName} ${contact.lastName} (${contact.role.toLowerCase()})`,
          }))}
        />
      </div>
    </>
  );
}
