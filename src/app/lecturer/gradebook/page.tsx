import type { Metadata } from 'next';

import { Badge, Card, CardBody, CardHeader, CardTitle, EmptyState, PageHeader, Table, Td, Th } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { aggregateScore, letterFor } from '@/lib/grading';

export const metadata: Metadata = { title: 'Gradebook' };
export const dynamic = 'force-dynamic';

/**
 * The gradebook: every student against every assessment, per course.
 *
 * Running marks are computed from the weights actually assessed so far rather than the
 * full course weighting — a student who has done everything set is shown at their real
 * standing, not dragged toward zero by work that has not happened yet.
 */
export default async function GradebookPage() {
  const user = await requireUser();

  const courses = await prisma.course.findMany({
    where: user.role === 'ADMIN' ? {} : { lecturerId: user.id },
    include: {
      assignments: { where: { published: true }, orderBy: { dueAt: 'asc' } },
      registrations: {
        where: { status: 'APPROVED' },
        include: { user: { select: { id: true, firstName: true, lastName: true, studentNumber: true } } },
      },
    },
    orderBy: { code: 'asc' },
  });

  const submissions = await prisma.submission.findMany({
    where: { assignment: { courseId: { in: courses.map((c) => c.id) } } },
    select: { userId: true, assignmentId: true, score: true, status: true },
  });

  return (
    <>
      <PageHeader
        title="Gradebook"
        description="Marks across every course you teach. Running marks update as work is released."
      />

      {courses.length === 0 ? (
        <EmptyState title="No courses" description="You are not assigned to any courses." />
      ) : (
        <div className="space-y-8">
          {courses.map((course) => (
            <Card key={course.id}>
              <CardHeader className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle as="h2">
                  <span className="font-mono text-sm text-muted">{course.code}</span> {course.title}
                </CardTitle>
                <Badge>{course.registrations.length} students</Badge>
              </CardHeader>

              <CardBody className="p-0">
                {course.registrations.length === 0 ? (
                  <p className="p-5 text-sm text-muted">Nobody registered yet.</p>
                ) : (
                  <Table>
                    <caption className="sr-only">Gradebook for {course.code}</caption>
                    <thead>
                      <tr>
                        <Th className="sticky left-0 bg-surface">Student</Th>
                        {course.assignments.map((assignment) => (
                          <Th key={assignment.id} className="text-right">
                            <span className="block max-w-24 truncate" title={assignment.title}>
                              {assignment.title.split('—').pop()?.trim() ?? assignment.title}
                            </span>
                            <span className="block text-[10px] font-normal normal-case text-muted">
                              /{assignment.maxScore} · {Math.round(assignment.weight * 100)}%
                            </span>
                          </Th>
                        ))}
                        <Th className="text-right">Running</Th>
                        <Th className="text-right">Grade</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {course.registrations.map((registration) => {
                        const own = submissions.filter((s) => s.userId === registration.user.id);
                        const marked = course.assignments
                          .map((assignment) => {
                            const submission = own.find((s) => s.assignmentId === assignment.id);
                            if (!submission || submission.score === null) return null;
                            return {
                              score: (submission.score / assignment.maxScore) * 100,
                              weight: assignment.weight,
                            };
                          })
                          .filter((entry): entry is { score: number; weight: number } => entry !== null);

                        const running = marked.length > 0 ? aggregateScore(marked) : null;

                        return (
                          <tr key={registration.id}>
                            <Td className="sticky left-0 bg-surface">
                              <span className="block font-medium">
                                {registration.user.firstName} {registration.user.lastName}
                              </span>
                              <span className="block font-mono text-xs text-muted">
                                {registration.user.studentNumber}
                              </span>
                            </Td>

                            {course.assignments.map((assignment) => {
                              const submission = own.find((s) => s.assignmentId === assignment.id);
                              return (
                                <Td key={assignment.id} className="text-right tabular-nums">
                                  {submission?.score !== null && submission?.score !== undefined ? (
                                    submission.score
                                  ) : submission?.status === 'SUBMITTED' || submission?.status === 'LATE' ? (
                                    <span className="text-xs text-warning">to mark</span>
                                  ) : (
                                    <span className="text-xs text-muted">—</span>
                                  )}
                                </Td>
                              );
                            })}

                            <Td className="text-right font-semibold tabular-nums">
                              {running !== null ? `${running.toFixed(1)}%` : '—'}
                            </Td>
                            <Td className="text-right">
                              {running !== null ? (
                                <Badge tone={running >= 50 ? 'success' : 'danger'}>{letterFor(running)}</Badge>
                              ) : (
                                '—'
                              )}
                            </Td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
