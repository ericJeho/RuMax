import type { Metadata } from 'next';

import { Badge, Card, CardBody, CardHeader, CardTitle, EmptyState, PageHeader } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDuration } from '@/lib/format';

export const metadata: Metadata = { title: 'Course builder' };
export const dynamic = 'force-dynamic';

/**
 * Course builder.
 *
 * Shows the structure of every course you own — units, lessons and their runtime — so you
 * can see the shape of the course rather than a flat list of files. Content is authored
 * per lesson; the API that backs editing is `/api/courses/:id/modules`.
 */
export default async function CourseBuilderPage() {
  const user = await requireUser();

  const courses = await prisma.course.findMany({
    where: user.role === 'ADMIN' ? {} : { lecturerId: user.id },
    include: {
      modules: { include: { lessons: { orderBy: { position: 'asc' } } }, orderBy: { position: 'asc' } },
    },
    orderBy: { code: 'asc' },
  });

  return (
    <>
      <PageHeader
        title="Course builder"
        description="Units, lessons and materials. Aim for roughly ten hours of study per 15-credit unit."
      />

      {courses.length === 0 ? (
        <EmptyState title="No courses" description="You are not assigned to any courses." />
      ) : (
        <div className="space-y-6">
          {courses.map((course) => {
            const lessons = course.modules.flatMap((module) => module.lessons);
            const minutes = lessons.reduce((sum, lesson) => sum + lesson.durationMins, 0);

            return (
              <Card key={course.id}>
                <CardHeader className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle as="h2">
                    <span className="font-mono text-sm text-muted">{course.code}</span> {course.title}
                  </CardTitle>
                  <span className="flex flex-wrap gap-1.5">
                    <Badge>{course.modules.length} units</Badge>
                    <Badge>{lessons.length} lessons</Badge>
                    <Badge>{formatDuration(minutes)}</Badge>
                  </span>
                </CardHeader>

                <CardBody className="space-y-3">
                  {course.modules.map((module) => (
                    <details key={module.id} className="rounded-xl border border-border">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                        <span className="min-w-0">
                          <span className="block text-sm font-medium">{module.title}</span>
                          {module.summary ? (
                            <span className="mt-0.5 block truncate text-xs text-muted">{module.summary}</span>
                          ) : null}
                        </span>
                        <span className="shrink-0 text-xs text-muted">{module.lessons.length} lessons</span>
                      </summary>

                      <ul className="border-t border-border">
                        {module.lessons.map((lesson) => (
                          <li
                            key={lesson.id}
                            className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-2.5 last:border-0"
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-sm">{lesson.title}</span>
                              <span className="block text-xs capitalize text-muted">
                                {lesson.type.toLowerCase()} · {formatDuration(lesson.durationMins)}
                                {lesson.downloadable ? ' · downloadable' : ''}
                              </span>
                            </span>
                            <button className="shrink-0 text-xs font-medium text-brand hover:underline">
                              Edit
                            </button>
                          </li>
                        ))}
                      </ul>
                    </details>
                  ))}

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button className="btn-secondary text-sm">Add unit</button>
                    <button className="btn-secondary text-sm">Upload video</button>
                    <button className="btn-secondary text-sm">Upload PDF</button>
                    <button className="btn-secondary text-sm">Import from Moodle / Canvas</button>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
