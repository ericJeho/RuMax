import type { Metadata } from 'next';

import { Card, CardBody, CardHeader, CardTitle, PageHeader } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { WEEKDAYS } from '@/lib/format';

export const metadata: Metadata = { title: 'Office hours' };
export const dynamic = 'force-dynamic';

export default async function OfficeHoursPage() {
  const user = await requireUser();

  const courses = await prisma.course.findMany({
    where: user.role === 'ADMIN' ? {} : { lecturerId: user.id },
    select: { code: true, title: true },
    orderBy: { code: 'asc' },
  });

  return (
    <>
      <PageHeader
        title="Office hours"
        description="Drop-in time your students can book. Publishing even one hour a week measurably reduces the number who quietly fall behind."
      />

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle as="h2">Weekly availability</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="grid gap-3 sm:grid-cols-2">
              {WEEKDAYS.slice(1, 6).map((day) => (
                <label key={day} className="rounded-xl border border-border p-3">
                  <span className="mb-2 block text-sm font-medium">{day}</span>
                  <span className="flex items-center gap-2">
                    <input type="time" defaultValue="15:00" className="input py-1.5 text-sm" aria-label={`${day} start`} />
                    <span className="text-xs text-muted">to</span>
                    <input type="time" defaultValue="16:00" className="input py-1.5 text-sm" aria-label={`${day} end`} />
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted">
              Times are stored in UTC and shown to each student in their own timezone. Students
              book 15-minute slots; you can cap the number of bookings per session.
            </p>
            <button className="btn-primary mt-4 text-sm">Publish availability</button>
          </CardBody>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle as="h2">Visible to</CardTitle>
          </CardHeader>
          <CardBody>
            <ul className="space-y-2 text-sm">
              {courses.map((course) => (
                <li key={course.code} className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate">{course.title}</span>
                  <span className="shrink-0 font-mono text-xs text-muted">{course.code}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-muted">
              Students on these courses see your office hours in their portal and can book without
              emailing you first.
            </p>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
