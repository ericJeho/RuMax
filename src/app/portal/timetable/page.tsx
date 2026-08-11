import type { Metadata } from 'next';

import { Badge, Card, CardBody, CardHeader, CardTitle, EmptyState, PageHeader } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDate, WEEKDAYS } from '@/lib/format';

export const metadata: Metadata = { title: 'Timetable' };
export const dynamic = 'force-dynamic';

export default async function TimetablePage() {
  const user = await requireUser();

  const term = await prisma.academicTerm.findFirst({ where: { isCurrent: true } });

  const [slots, sessions] = await Promise.all([
    prisma.timetableSlot.findMany({
      where: {
        ...(term ? { termId: term.id } : {}),
        course: { registrations: { some: { userId: user.id, status: 'APPROVED' } } },
      },
      include: { course: { select: { code: true, title: true, slug: true } } },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    }),
    prisma.liveSession.findMany({
      where: {
        endsAt: { gte: new Date() },
        course: { registrations: { some: { userId: user.id, status: 'APPROVED' } } },
      },
      include: { course: { select: { code: true } } },
      orderBy: { startsAt: 'asc' },
      take: 6,
    }),
  ]);

  const byDay = WEEKDAYS.map((day, index) => ({
    day,
    index,
    slots: slots.filter((slot) => slot.dayOfWeek === index),
  })).filter((entry) => entry.index >= 1 && entry.index <= 5);

  return (
    <>
      <PageHeader
        title="Timetable"
        description={
          term
            ? `${term.name} · times shown in UTC. Your local timezone is ${user.timezone}.`
            : 'No active term.'
        }
      />

      {slots.length === 0 ? (
        <EmptyState
          title="Nothing scheduled"
          description="Live sessions appear here once your registrations are approved and your lecturers publish their schedule."
        />
      ) : (
        <>
          <div className="mb-6 grid gap-4 lg:grid-cols-5">
            {byDay.map((entry) => (
              <Card key={entry.day} className="p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
                  {entry.day}
                </p>
                {entry.slots.length === 0 ? (
                  <p className="text-xs text-muted">No sessions</p>
                ) : (
                  <ul className="space-y-2">
                    {entry.slots.map((slot) => (
                      <li key={slot.id} className="rounded-xl border border-border bg-surface-2/50 p-3">
                        <p className="font-mono text-[11px] text-brand">
                          {slot.startTime} – {slot.endTime}
                        </p>
                        <p className="mt-1 text-sm font-medium leading-snug">{slot.course.code}</p>
                        <p className="text-xs leading-snug text-muted">{slot.course.title}</p>
                        <p className="mt-1 text-[11px] text-muted">{slot.location}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            ))}
          </div>

          {sessions.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle as="h2">Next live sessions</CardTitle>
              </CardHeader>
              <CardBody className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
                  >
                    <div>
                      <p className="font-medium">{session.title}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {session.course.code} ·{' '}
                        {formatDate(session.startsAt, 'en', { dateStyle: 'full', timeStyle: 'short' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge>{session.provider.replace('_', ' ').toLowerCase()}</Badge>
                      <a href={session.joinUrl} className="btn-primary text-sm">
                        Join
                      </a>
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>
          ) : null}
        </>
      )}
    </>
  );
}
