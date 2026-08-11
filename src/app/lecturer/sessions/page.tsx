import type { Metadata } from 'next';
import { Video } from 'lucide-react';

import { Badge, Card, CardBody, CardHeader, CardTitle, EmptyState, PageHeader } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDate } from '@/lib/format';
import { integrations } from '@/lib/env';

export const metadata: Metadata = { title: 'Live sessions' };
export const dynamic = 'force-dynamic';

export default async function LiveSessionsPage() {
  const user = await requireUser();

  const sessions = await prisma.liveSession.findMany({
    where: { course: user.role === 'ADMIN' ? {} : { lecturerId: user.id } },
    include: { course: { select: { code: true, title: true, _count: { select: { registrations: true } } } } },
    orderBy: { startsAt: 'asc' },
  });

  const upcoming = sessions.filter((session) => session.endsAt >= new Date());
  const past = sessions.filter((session) => session.endsAt < new Date());

  return (
    <>
      <PageHeader
        title="Live sessions"
        description="Seminars and lectures scheduled through Zoom, Teams, Google Meet, Daily or Agora."
      />

      {!integrations.zoom ? (
        <Card className="mb-6">
          <CardBody className="text-sm leading-relaxed text-muted">
            No video provider is configured on this deployment. Sessions below use stored join
            links. Set <code className="text-brand">ZOOM_CLIENT_ID</code> and its secret (or the
            Daily/Agora equivalents) to create meetings automatically when you schedule a session —
            see <code className="text-brand">docs/INTEGRATIONS.md</code>.
          </CardBody>
        </Card>
      ) : null}

      {upcoming.length === 0 && past.length === 0 ? (
        <EmptyState
          icon={<Video size={30} aria-hidden />}
          title="No sessions scheduled"
          description="Schedule a session from any of your courses."
        />
      ) : null}

      {upcoming.length > 0 ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle as="h2">Upcoming</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            {upcoming.map((session) => (
              <div
                key={session.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
              >
                <div className="min-w-0">
                  <p className="font-medium">{session.title}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {session.course.code} · {formatDate(session.startsAt, 'en', { dateStyle: 'full', timeStyle: 'short' })}{' '}
                    · {session.course._count.registrations} invited
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{session.provider.replace(/_/g, ' ').toLowerCase()}</Badge>
                  <a href={session.joinUrl} className="btn-primary text-sm">
                    Start session
                  </a>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      ) : null}

      {past.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle as="h2">Past sessions</CardTitle>
          </CardHeader>
          <CardBody className="space-y-2">
            {past.map((session) => (
              <div key={session.id} className="flex items-center justify-between gap-3 border-b border-border/60 py-2 last:border-0">
                <span className="min-w-0">
                  <span className="block truncate text-sm">{session.title}</span>
                  <span className="block text-xs text-muted">
                    {session.course.code} · {formatDate(session.startsAt)}
                  </span>
                </span>
                {session.recordingUrl ? (
                  <a href={session.recordingUrl} className="shrink-0 text-sm text-brand hover:underline">
                    Recording
                  </a>
                ) : (
                  <span className="shrink-0 text-xs text-muted">No recording</span>
                )}
              </div>
            ))}
          </CardBody>
        </Card>
      ) : null}
    </>
  );
}
