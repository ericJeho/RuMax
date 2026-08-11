import type { Metadata } from 'next';

import { Card, CardBody, CardHeader, CardTitle, EmptyState, PageHeader, ProgressBar, StatusBadge } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Attendance' };
export const dynamic = 'force-dynamic';

export default async function AttendancePage() {
  const user = await requireUser();

  const records = await prisma.attendanceRecord.findMany({
    where: { userId: user.id },
    include: { course: { select: { code: true, title: true } } },
    orderBy: { date: 'desc' },
  });

  const byCourse = new Map<string, { code: string; title: string; present: number; total: number }>();
  for (const record of records) {
    const entry = byCourse.get(record.courseId) ?? {
      code: record.course.code,
      title: record.course.title,
      present: 0,
      total: 0,
    };
    entry.total += 1;
    if (record.status === 'PRESENT' || record.status === 'LATE' || record.status === 'EXCUSED') {
      entry.present += 1;
    }
    byCourse.set(record.courseId, entry);
  }

  const overall = records.length
    ? Math.round(
        (records.filter((r) => r.status !== 'ABSENT').length / records.length) * 100,
      )
    : 0;

  return (
    <>
      <PageHeader
        title="Attendance"
        description="Attendance at live sessions. Recordings count toward engagement but not toward attendance."
      />

      {records.length === 0 ? (
        <EmptyState title="No attendance recorded" description="Records appear after your first live session." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle as="h2">Overall</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="font-display text-4xl font-semibold tabular-nums">{overall}%</p>
                <p className="mt-1 text-sm text-muted">
                  across {records.length} recorded sessions
                </p>
                {overall < 75 ? (
                  <p className="mt-3 rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs leading-relaxed text-warning">
                    Attendance below 75% may affect your eligibility to sit the final examination.
                    Contact your academic advisor if circumstances are making attendance difficult.
                  </p>
                ) : null}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle as="h2">By course</CardTitle>
              </CardHeader>
              <CardBody className="space-y-4">
                {[...byCourse.values()].map((entry) => (
                  <ProgressBar
                    key={entry.code}
                    value={entry.present}
                    max={entry.total}
                    label={`${entry.code} — ${entry.present}/${entry.total}`}
                    tone={entry.present / entry.total >= 0.75 ? 'success' : 'warning'}
                  />
                ))}
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle as="h2">Session history</CardTitle>
            </CardHeader>
            <CardBody className="space-y-2">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between gap-3 border-b border-border/60 py-2 text-sm last:border-0"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{record.course.code}</span>
                    <span className="block text-xs text-muted">{formatDate(record.date)}</span>
                  </span>
                  <StatusBadge status={record.status} />
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      )}
    </>
  );
}
