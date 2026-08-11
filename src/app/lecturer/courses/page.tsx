import type { Metadata } from 'next';
import Link from 'next/link';

import { Badge, Card, EmptyState, PageHeader } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const metadata: Metadata = { title: 'My courses' };
export const dynamic = 'force-dynamic';

export default async function LecturerCoursesPage() {
  const user = await requireUser();

  const courses = await prisma.course.findMany({
    where: user.role === 'ADMIN' ? {} : { lecturerId: user.id },
    include: {
      department: { select: { name: true } },
      _count: {
        select: { registrations: true, modules: true, assignments: true, quizzes: true, forumThreads: true },
      },
    },
    orderBy: { code: 'asc' },
  });

  return (
    <>
      <PageHeader
        title="My courses"
        description="Everything you teach. Open a course to build content, see performance and manage assessment."
      />

      {courses.length === 0 ? (
        <EmptyState title="No courses assigned" description="Contact your head of department." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.id} hover className="flex h-full flex-col p-5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-muted">{course.code}</span>
                <Badge tone={course.published ? 'success' : 'warning'}>
                  {course.published ? 'Published' : 'Draft'}
                </Badge>
              </div>

              <h2 className="font-display text-base font-semibold leading-snug">
                <Link href={`/lecturer/courses/${course.slug}`} className="hover:text-brand">
                  {course.title}
                </Link>
              </h2>
              <p className="mt-1 text-xs text-muted">{course.department?.name}</p>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
                {course.description.slice(0, 120)}…
              </p>

              <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-4 text-xs">
                <Stat label="Enrolled" value={course._count.registrations} />
                <Stat label="Units" value={course._count.modules} />
                <Stat label="Assignments" value={course._count.assignments} />
                <Stat label="Quizzes" value={course._count.quizzes} />
              </dl>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="font-display text-lg font-semibold">{value}</dd>
    </div>
  );
}
