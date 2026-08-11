import type { Metadata } from 'next';

import { Avatar, Badge, Card, CardBody, CardHeader, CardTitle, EmptyState, PageHeader } from '@/components/ui';
import { ComposeMessage } from '@/app/portal/messages/compose';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatRelative } from '@/lib/format';

export const metadata: Metadata = { title: 'Messages' };
export const dynamic = 'force-dynamic';

export default async function LecturerMessagesPage() {
  const user = await requireUser();

  const [received, students] = await Promise.all([
    prisma.message.findMany({
      where: { recipientId: user.id },
      include: { sender: { select: { firstName: true, lastName: true, role: true, avatarUrl: true, studentNumber: true } } },
      orderBy: { createdAt: 'desc' },
      take: 60,
    }),
    // Staff may write to any student they teach, plus other staff.
    prisma.user.findMany({
      where: {
        OR: [
          { registrations: { some: { course: { lecturerId: user.id } } } },
          { role: { in: ['LECTURER', 'REGISTRAR', 'ADMIN', 'FINANCE'] } },
        ],
        id: { not: user.id },
      },
      select: { id: true, firstName: true, lastName: true, role: true, studentNumber: true },
      orderBy: { lastName: 'asc' },
      take: 400,
    }),
  ]);

  return (
    <>
      <PageHeader title="Messages" description="Correspondence with your students and colleagues." />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle as="h2">Inbox</CardTitle>
            <Badge>{received.filter((message) => !message.readAt).length} unread</Badge>
          </CardHeader>
          <CardBody className="space-y-3">
            {received.length === 0 ? (
              <EmptyState title="No messages" description="Messages from students appear here." />
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
                          {message.sender.studentNumber ? (
                            <span className="ml-2 font-mono text-xs font-normal text-muted">
                              {message.sender.studentNumber}
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs text-muted">{formatRelative(message.createdAt)}</p>
                      </div>
                      <p className="mt-0.5 font-medium">{message.subject}</p>
                      <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-muted">{message.body}</p>
                    </div>
                  </div>
                </article>
              ))
            )}
          </CardBody>
        </Card>

        <ComposeMessage
          contacts={students.map((student) => ({
            id: student.id,
            label: `${student.firstName} ${student.lastName}${student.studentNumber ? ` (${student.studentNumber})` : ` (${student.role.toLowerCase()})`}`,
          }))}
        />
      </div>
    </>
  );
}
