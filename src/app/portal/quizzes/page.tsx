import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

import { Badge, Card, CardBody, CardHeader, CardTitle, EmptyState, PageHeader } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Quizzes & exams' };
export const dynamic = 'force-dynamic';

export default async function QuizzesPage() {
  const user = await requireUser();

  const quizzes = await prisma.quiz.findMany({
    where: { course: { registrations: { some: { userId: user.id, status: 'APPROVED' } } } },
    include: {
      course: { select: { code: true, title: true } },
      attempts: { where: { userId: user.id }, orderBy: { attemptNo: 'desc' } },
      _count: { select: { questions: true } },
    },
    orderBy: [{ type: 'asc' }, { createdAt: 'asc' }],
  });

  const available = quizzes.filter((q) => q.published);
  const upcoming = quizzes.filter((q) => !q.published);

  return (
    <>
      <PageHeader
        title="Quizzes & examinations"
        description="Practice quizzes are unlimited and do not count. Assessed quizzes and examinations are timed."
      />

      {quizzes.length === 0 ? (
        <EmptyState title="No assessments available" description="These appear once your lecturer publishes them." />
      ) : null}

      {available.length > 0 ? (
        <section className="mb-8 space-y-4">
          <h2 className="font-display text-lg font-semibold">Open now</h2>
          {available.map((quiz) => {
            const best = quiz.attempts.reduce<number | null>(
              (max, attempt) =>
                attempt.score !== null && attempt.maxScore
                  ? Math.max(max ?? 0, Math.round((attempt.score / attempt.maxScore) * 100))
                  : max,
              null,
            );
            const used = quiz.attempts.filter((a) => a.status !== 'IN_PROGRESS').length;
            const exhausted = used >= quiz.maxAttempts;

            return (
              <Card key={quiz.id}>
                <CardHeader className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>{quiz.title}</CardTitle>
                    <p className="mt-0.5 text-xs text-muted">
                      {quiz.course.code} · {quiz.course.title}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={quiz.type === 'FINAL_EXAM' ? 'danger' : 'brand'}>
                      {quiz.type.replace('_', ' ').toLowerCase()}
                    </Badge>
                    <Badge>{quiz.durationMins} min</Badge>
                    <Badge>
                      {used}/{quiz.maxAttempts} attempts
                    </Badge>
                    {best !== null ? <Badge tone="success">Best {best}%</Badge> : null}
                  </div>
                </CardHeader>
                <CardBody className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-muted">{quiz.description}</p>
                    <p className="mt-1.5 text-xs text-muted">
                      {quiz.questionsToServe > 0
                        ? `${quiz.questionsToServe} questions drawn at random from a bank of ${quiz._count.questions}`
                        : `${quiz._count.questions} questions`}
                      {quiz.closesAt ? ` · closes ${formatDate(quiz.closesAt)}` : ''}
                      {quiz.proctored ? ' · proctored' : ''}
                    </p>
                  </div>
                  {exhausted ? (
                    <span className="text-sm text-muted">No attempts remaining</span>
                  ) : (
                    <Link href={`/portal/quizzes/${quiz.id}`} className="btn-primary shrink-0 text-sm">
                      {quiz.attempts.some((a) => a.status === 'IN_PROGRESS') ? 'Resume attempt' : 'Start'}
                    </Link>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </section>
      ) : null}

      {upcoming.length > 0 ? (
        <section>
          <h2 className="mb-4 font-display text-lg font-semibold">Scheduled</h2>
          <div className="space-y-3">
            {upcoming.map((quiz) => (
              <Card key={quiz.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{quiz.title}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {quiz.course.code} ·{' '}
                      {quiz.opensAt ? `opens ${formatDate(quiz.opensAt)}` : 'date to be confirmed'}
                    </p>
                  </div>
                  {quiz.proctored ? (
                    <span className="flex items-center gap-1.5 text-xs text-warning">
                      <ShieldAlert size={13} aria-hidden />
                      Proctored — camera and lockdown browser required
                    </span>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
