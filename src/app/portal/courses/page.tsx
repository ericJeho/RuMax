import type { Metadata } from 'next';
import Link from 'next/link';

import { Badge, ButtonLink, Card, EmptyState, PageHeader, ProgressBar, StatusBadge } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const metadata: Metadata = { title: 'My courses' };
export const dynamic = 'force-dynamic';

export default async function MyCoursesPage() {
  const user = await requireUser();

  const registrations = await prisma.registration.findMany({
    where: { userId: user.id },
    include: {
      term: { select: { name: true, isCurrent: true } },
      course: {
        include: {
          lecturer: { select: { firstName: true, lastName: true } },
          modules: { select: { _count: { select: { lessons: true } } } },
        },
      },
    },
    orderBy: [{ term: { startDate: 'desc' } }, { createdAt: 'asc' }],
  });

  // One aggregate query for progress across every course, rather than N per card.
  const progressRows = await prisma.lessonProgress.groupBy({
    by: ['lessonId'],
    where: { userId: user.id, completed: true },
  });
  const completedLessonIds = new Set(progressRows.map((row) => row.lessonId));

  const lessonsByCourse = await prisma.lesson.findMany({
    where: { module: { courseId: { in: registrations.map((r) => r.courseId) } } },
    select: { id: true, module: { select: { courseId: true } } },
  });

  const progressByCourse = new Map<string, { total: number; done: number }>();
  for (const lesson of lessonsByCourse) {
    const courseId = lesson.module.courseId;
    const entry = progressByCourse.get(courseId) ?? { total: 0, done: 0 };
    entry.total += 1;
    if (completedLessonIds.has(lesson.id)) entry.done += 1;
    progressByCourse.set(courseId, entry);
  }

  const current = registrations.filter((r) => r.term.isCurrent);
  const past = registrations.filter((r) => !r.term.isCurrent);

  return (
    <>
      <PageHeader
        title="My courses"
        description="Everything you are registered for, this term and previously."
        actions={<ButtonLink href="/portal/registration">Register for courses</ButtonLink>}
      />

      {registrations.length === 0 ? (
        <EmptyState
          title="You are not registered for any courses"
          description="Registration opens before each term. Choose your courses to get started."
          action={<ButtonLink href="/portal/registration">Register now</ButtonLink>}
        />
      ) : null}

      {current.length > 0 ? (
        <section className="mb-10">
          <h2 className="mb-4 font-display text-lg font-semibold">This term</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {current.map((registration) => {
              const progress = progressByCourse.get(registration.courseId) ?? { total: 0, done: 0 };
              return (
                <Card key={registration.id} hover className="flex h-full flex-col p-5">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-muted">{registration.course.code}</span>
                    <StatusBadge status={registration.status} />
                  </div>
                  <h3 className="font-display text-base font-semibold leading-snug">
                    <Link href={`/portal/courses/${registration.course.slug}`} className="hover:text-brand">
                      {registration.course.title}
                    </Link>
                  </h3>
                  <p className="mt-1 text-xs text-muted">
                    {registration.course.lecturer
                      ? `${registration.course.lecturer.firstName} ${registration.course.lecturer.lastName}`
                      : 'Lecturer to be confirmed'}
                  </p>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
                    {registration.course.description.slice(0, 110)}…
                  </p>
                  <div className="mt-4">
                    <ProgressBar
                      value={progress.done}
                      max={Math.max(1, progress.total)}
                      label={`${progress.done}/${progress.total} lessons`}
                    />
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                    <Badge>{registration.course.credits} credits</Badge>
                    {registration.status === 'APPROVED' ? (
                      <Link
                        href={`/portal/courses/${registration.course.slug}`}
                        className="text-sm font-medium text-brand hover:underline"
                      >
                        {progress.done > 0 ? 'Continue' : 'Start'} →
                      </Link>
                    ) : (
                      <span className="text-xs text-muted">Awaiting approval</span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      ) : null}

      {past.length > 0 ? (
        <section>
          <h2 className="mb-4 font-display text-lg font-semibold">Previous terms</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {past.map((registration) => (
              <Card key={registration.id} className="p-5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-muted">{registration.course.code}</span>
                  <Badge>{registration.term.name}</Badge>
                </div>
                <h3 className="font-display text-base font-semibold leading-snug">
                  <Link href={`/portal/courses/${registration.course.slug}`} className="hover:text-brand">
                    {registration.course.title}
                  </Link>
                </h3>
                <p className="mt-2 text-xs text-muted">
                  Materials remain available for the lifetime of your account.
                </p>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
