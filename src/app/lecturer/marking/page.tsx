import type { Metadata } from 'next';

import { Card, CardBody, EmptyState, PageHeader } from '@/components/ui';
import { MarkingQueue } from './marking-queue';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const metadata: Metadata = { title: 'Marking queue' };
export const dynamic = 'force-dynamic';

export default async function MarkingPage() {
  const user = await requireUser();

  const submissions = await prisma.submission.findMany({
    where: {
      status: { in: ['SUBMITTED', 'LATE'] },
      assignment: { course: user.role === 'ADMIN' ? {} : { lecturerId: user.id } },
    },
    include: {
      user: { select: { firstName: true, lastName: true, studentNumber: true } },
      assignment: {
        select: {
          id: true,
          title: true,
          maxScore: true,
          instructions: true,
          course: { select: { code: true, title: true } },
        },
      },
    },
    orderBy: [{ status: 'desc' }, { submittedAt: 'asc' }],
    take: 50,
  });

  return (
    <>
      <PageHeader
        title="Marking queue"
        description={`${submissions.length} submission${submissions.length === 1 ? '' : 's'} waiting. Oldest first — the 24-hour clock starts when a student hands in.`}
      />

      {submissions.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              title="Queue is clear"
              description="Every submission has been marked and returned. Well done."
            />
          </CardBody>
        </Card>
      ) : (
        <MarkingQueue
          submissions={submissions.map((submission) => ({
            id: submission.id,
            content: submission.content ?? '',
            fileUrl: submission.fileUrl,
            status: submission.status,
            similarity: submission.similarity,
            submittedAt: submission.submittedAt?.toISOString() ?? null,
            student: {
              name: `${submission.user.firstName} ${submission.user.lastName}`,
              studentNumber: submission.user.studentNumber,
            },
            assignment: {
              title: submission.assignment.title,
              maxScore: submission.assignment.maxScore,
              instructions: submission.assignment.instructions,
              courseCode: submission.assignment.course.code,
            },
          }))}
        />
      )}
    </>
  );
}
