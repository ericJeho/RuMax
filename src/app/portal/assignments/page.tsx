import type { Metadata } from 'next';

import { Card, CardBody, CardHeader, CardTitle, EmptyState, PageHeader, StatusBadge } from '@/components/ui';
import { AssignmentPanel } from './assignment-panel';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDate, formatRelative } from '@/lib/format';

export const metadata: Metadata = { title: 'Assignments' };
export const dynamic = 'force-dynamic';

export default async function AssignmentsPage() {
  const user = await requireUser();

  const assignments = await prisma.assignment.findMany({
    where: {
      published: true,
      course: { registrations: { some: { userId: user.id, status: 'APPROVED' } } },
    },
    include: {
      course: { select: { code: true, title: true } },
      submissions: { where: { userId: user.id } },
    },
    orderBy: { dueAt: 'asc' },
  });

  const now = Date.now();
  const open = assignments.filter(
    (a) => a.dueAt.getTime() >= now && !['SUBMITTED', 'GRADED', 'RETURNED'].includes(a.submissions[0]?.status ?? ''),
  );
  const submitted = assignments.filter((a) =>
    ['SUBMITTED', 'GRADED', 'RETURNED'].includes(a.submissions[0]?.status ?? ''),
  );
  const missed = assignments.filter(
    (a) => a.dueAt.getTime() < now && !['SUBMITTED', 'GRADED', 'RETURNED'].includes(a.submissions[0]?.status ?? ''),
  );

  return (
    <>
      <PageHeader
        title="Assignments"
        description="Everything you have been set, what you have handed in, and the feedback you have received."
      />

      {assignments.length === 0 ? (
        <EmptyState
          title="No assignments yet"
          description="Assignments appear here once your lecturers publish them."
        />
      ) : null}

      {open.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-4 font-display text-lg font-semibold">Due now ({open.length})</h2>
          <div className="space-y-4">
            {open.map((assignment) => (
              <AssignmentPanel
                key={assignment.id}
                assignment={{
                  id: assignment.id,
                  title: assignment.title,
                  instructions: assignment.instructions,
                  maxScore: assignment.maxScore,
                  weight: assignment.weight,
                  allowLate: assignment.allowLate,
                  dueAtLabel: formatDate(assignment.dueAt, 'en', { dateStyle: 'full', timeStyle: 'short' }),
                  dueRelative: formatRelative(assignment.dueAt),
                  courseCode: assignment.course.code,
                  courseTitle: assignment.course.title,
                }}
                submission={
                  assignment.submissions[0]
                    ? {
                        content: assignment.submissions[0].content ?? '',
                        status: assignment.submissions[0].status,
                      }
                    : null
                }
              />
            ))}
          </div>
        </section>
      ) : null}

      {missed.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-4 font-display text-lg font-semibold text-danger">
            Past deadline ({missed.length})
          </h2>
          <div className="space-y-3">
            {missed.map((assignment) => (
              <Card key={assignment.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{assignment.title}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {assignment.course.code} · was due {formatDate(assignment.dueAt)}
                    </p>
                  </div>
                  <p className="text-xs text-muted">
                    {assignment.allowLate
                      ? 'Late submissions still accepted with a penalty — contact your lecturer.'
                      : 'Closed. Speak to your academic advisor about mitigating circumstances.'}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {submitted.length > 0 ? (
        <section>
          <h2 className="mb-4 font-display text-lg font-semibold">Submitted ({submitted.length})</h2>
          <div className="space-y-4">
            {submitted.map((assignment) => {
              const submission = assignment.submissions[0];
              return (
                <Card key={assignment.id}>
                  <CardHeader className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <CardTitle>{assignment.title}</CardTitle>
                      <p className="mt-0.5 text-xs text-muted">
                        {assignment.course.code} · submitted{' '}
                        {submission.submittedAt ? formatDate(submission.submittedAt) : '—'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={submission.status} />
                      {submission.score !== null ? (
                        <span className="font-display text-xl font-semibold tabular-nums">
                          {submission.score}
                          <span className="text-sm font-normal text-muted">/{assignment.maxScore}</span>
                        </span>
                      ) : null}
                    </div>
                  </CardHeader>

                  {submission.feedback ? (
                    <CardBody>
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
                        Feedback
                      </p>
                      <p className="text-sm leading-relaxed text-muted">{submission.feedback}</p>
                      {submission.similarity !== null ? (
                        <p className="mt-3 text-xs text-muted">
                          Similarity check: {submission.similarity}% match against the reference
                          corpus. Anything above 25% is reviewed by the academic integrity team.
                        </p>
                      ) : null}
                    </CardBody>
                  ) : (
                    <CardBody>
                      <p className="text-sm text-muted">
                        Marking in progress. Feedback is returned within 24 hours of the marking
                        window opening.
                      </p>
                    </CardBody>
                  )}
                </Card>
              );
            })}
          </div>
        </section>
      ) : null}
    </>
  );
}
