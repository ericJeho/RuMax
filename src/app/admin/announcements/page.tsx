import type { Metadata } from 'next';

import { Badge, Card, CardBody, CardHeader, CardTitle, PageHeader } from '@/components/ui';
import { AnnouncementComposer } from './composer';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Announcements' };
export const dynamic = 'force-dynamic';

export default async function AdminAnnouncementsPage() {
  await requireRole('ADMIN', 'REGISTRAR');

  const announcements = await prisma.announcement.findMany({
    include: { author: { select: { firstName: true, lastName: true } } },
    orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
    take: 50,
  });

  return (
    <>
      <PageHeader
        title="Announcements"
        description="Broadcast to the whole university or a single audience. Announcements appear in the relevant portals immediately."
      />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id}>
              <CardHeader className="flex flex-wrap items-start justify-between gap-3">
                <CardTitle>{announcement.title}</CardTitle>
                <div className="flex flex-wrap gap-1.5">
                  {announcement.pinned ? <Badge tone="brand">Pinned</Badge> : null}
                  <Badge>{announcement.audience.toLowerCase()}</Badge>
                </div>
              </CardHeader>
              <CardBody>
                <p className="text-sm leading-relaxed text-muted">{announcement.body}</p>
                <p className="mt-3 text-xs text-muted">
                  {announcement.author
                    ? `${announcement.author.firstName} ${announcement.author.lastName} · `
                    : ''}
                  {formatDate(announcement.publishedAt)}
                </p>
              </CardBody>
            </Card>
          ))}
          {announcements.length === 0 ? (
            <Card>
              <CardBody className="text-sm text-muted">No announcements yet.</CardBody>
            </Card>
          ) : null}
        </div>

        <AnnouncementComposer />
      </div>
    </>
  );
}
