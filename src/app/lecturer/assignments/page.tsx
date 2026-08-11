import type { Metadata } from 'next';

import { Badge, Card, CardBody, CardHeader, CardTitle, PageHeader, ProgressBar } from '@/components/ui';
import { AssignmentComposer } from './composer';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Assignments' };
export const dynamic = 'force-dynamic';

export default async function LecturerAssignmentsPage() {
  const user = await requireUser();

  const courses = await prisma.course.findMany({
    where: user.role === 'ADMIN' ? {} : { lecturerId: user.id },
    select: { id: true, code: true, title: true, _count: { select: { registrations: true } } },
    orderBy: { code: 'asc' },
  });

  const assignments = await prisma.assignment.findMany({
    where: { courseId: { in: courses.map((c) => c.id) } },
    include: {
      course: { select: { code: true, _count: { select: { registrations: true } } } },
      submissions: { select: { status: true } },
    },
    orderBy: { dueAt: 'desc' },
  });

  return (
    <>
      <PageHeader
        title="Assignments"
        description="Set work, watch it come in, and see at a glance who has not started."
      />

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          {assignments.map((assignment) => {
            const cohort = assignment.course._count.registrations || 1;
            const handedIn = assignment.submissions.filter((s) => s.status !== 'DRAFT').length;
            const marked = assignment.submissions.filter((s) => s.status === 'GRADED').length;
            const overdue = assignment.dueAt < new Date();

            return (
              <Card key={assignment.id}>
                <CardHeader className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>{assignment.title}</CardTitle>
                    <p className="mt-0.5 text-xs text-muted">
                      {assignment.course.code} · {Math.round(assignment.weight * 100)}% ·{' '}
                      {assignment.maxScore} marks · due {formatDate(assignment.dueAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {assignment.published ? (
                      <Badge tone="success">Published</Badge>
                    ) : (
                      <Badge tone="warning">Draft</Badge>
                    )}
                    {overdue ? <Badge>Closed</Badge> : <Badge tone="brand">Open</Badge>}
                  </div>
                </CardHeader>
                <CardBody className="space-y-3">
                  <p className="text-sm leading-relaxed text-muted">{assignment.instructions}</p>
                  <ProgressBar
                    value={handedIn}
                    max={cohort}
                    label={`${handedIn} of ${cohort} submitted`}
                    tone={handedIn / cohort > 0.75 ? 'success' : 'warning'}
                  />
                  <ProgressBar
                    value={marked}
                    max={Math.max(1, handedIn)}
                    label={`${marked} of ${handedIn} marked`}
                    tone={marked === handedIn ? 'success' : 'brand'}
                  />
                </CardBody>
              </Card>
            );
          })}

          {assignments.length === 0 ? (
            <Card>
              <CardBody className="text-sm text-muted">
                No assignments yet. Create one on the right.
              </CardBody>
            </Card>
          ) : null}
        </div>

        <AssignmentComposer
          courses={courses.map((course) => ({ id: course.id, label: `${course.code} — ${course.title}` }))}
        />
      </div>
    </>
  );
}
