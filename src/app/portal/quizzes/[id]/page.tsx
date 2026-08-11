import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AlertTriangle, Camera, Clock, Lock, Shuffle } from 'lucide-react';

import { Alert, Badge, Breadcrumbs, Card, CardBody, CardHeader, CardTitle, PageHeader } from '@/components/ui';
import { QuizRunner } from './quiz-runner';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const quiz = await prisma.quiz.findUnique({ where: { id }, select: { title: true } });
  return { title: quiz?.title ?? 'Assessment' };
}

export default async function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      course: { select: { code: true, title: true, slug: true, id: true } },
      attempts: { where: { userId: user.id }, orderBy: { attemptNo: 'desc' } },
      _count: { select: { questions: true } },
    },
  });
  if (!quiz) notFound();

  const registration = await prisma.registration.findFirst({
    where: { userId: user.id, courseId: quiz.course.id, status: 'APPROVED' },
    select: { id: true },
  });
  if (!registration) notFound();

  const completed = quiz.attempts.filter((a) => a.status !== 'IN_PROGRESS');
  const remaining = quiz.maxAttempts - completed.length;
  const now = new Date();
  const notOpen = quiz.opensAt ? quiz.opensAt > now : false;
  const closed = quiz.closesAt ? quiz.closesAt < now : false;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Portal', href: '/portal' },
          { label: 'Quizzes & exams', href: '/portal/quizzes' },
          { label: quiz.title },
        ]}
      />

      <PageHeader
        title={quiz.title}
        description={quiz.description ?? undefined}
        actions={
          <>
            <Badge tone={quiz.type === 'FINAL_EXAM' ? 'danger' : 'brand'}>
              {quiz.type.replace('_', ' ').toLowerCase()}
            </Badge>
            <Badge>{quiz.course.code}</Badge>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div>
          {!quiz.published ? (
            <Alert tone="info" title="Not yet open">
              Your lecturer has not released this assessment. It will appear here when it opens
              {quiz.opensAt ? ` on ${formatDate(quiz.opensAt, 'en', { dateStyle: 'full', timeStyle: 'short' })}` : ''}.
            </Alert>
          ) : notOpen ? (
            <Alert tone="info" title="Opens later">
              This assessment opens on{' '}
              {formatDate(quiz.opensAt!, 'en', { dateStyle: 'full', timeStyle: 'short' })}.
            </Alert>
          ) : closed ? (
            <Alert tone="warning" title="Closed">
              The window for this assessment ended on {formatDate(quiz.closesAt!)}.
            </Alert>
          ) : remaining <= 0 ? (
            <Alert tone="warning" title="No attempts remaining">
              You have used all {quiz.maxAttempts} attempts. Contact your lecturer if you believe
              this is wrong.
            </Alert>
          ) : (
            <QuizRunner
              quizId={quiz.id}
              title={quiz.title}
              durationMins={quiz.durationMins}
              proctored={quiz.proctored}
              passMark={quiz.passMark}
            />
          )}

          {completed.length > 0 ? (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle as="h2">Your attempts</CardTitle>
              </CardHeader>
              <CardBody className="space-y-2">
                {completed.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm"
                  >
                    <span>
                      Attempt {attempt.attemptNo}
                      <span className="ml-2 text-xs text-muted">
                        {attempt.submittedAt ? formatDate(attempt.submittedAt, 'en', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                      </span>
                    </span>
                    <span className="font-semibold tabular-nums">
                      {attempt.score !== null && attempt.maxScore
                        ? `${Math.round((attempt.score / attempt.maxScore) * 100)}%`
                        : 'Awaiting marking'}
                    </span>
                  </div>
                ))}
              </CardBody>
            </Card>
          ) : null}
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle as="h2">Before you start</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3 text-sm">
            <Detail icon={<Clock size={15} aria-hidden />} label="Time limit">
              {quiz.durationMins} minutes from the moment you begin. The timer keeps running if you
              close the tab.
            </Detail>
            <Detail icon={<Shuffle size={15} aria-hidden />} label="Questions">
              {quiz.questionsToServe > 0
                ? `${quiz.questionsToServe} drawn at random from ${quiz._count.questions}`
                : `${quiz._count.questions} questions`}
              {quiz.shuffle ? ', order shuffled' : ''}
            </Detail>
            <Detail icon={<AlertTriangle size={15} aria-hidden />} label="Attempts">
              {remaining} of {quiz.maxAttempts} remaining. Pass mark {quiz.passMark}%.
            </Detail>
            {quiz.proctored ? (
              <Detail icon={<Camera size={15} aria-hidden />} label="Proctoring">
                Your camera stays on and tab switches are recorded. Recordings are reviewed only if
                the system flags something and are deleted after 90 days.
              </Detail>
            ) : null}
            {quiz.lockdownBrowser ? (
              <Detail icon={<Lock size={15} aria-hidden />} label="Lockdown">
                Copy, paste and right-click are disabled for the duration of the assessment.
              </Detail>
            ) : null}
            <p className="border-t border-border pt-3 text-xs leading-relaxed text-muted">
              Your answers save automatically as you go. If your connection drops, reopen this page
              and your attempt resumes where you left off.
            </p>
          </CardBody>
        </Card>
      </div>
    </>
  );
}

function Detail({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 shrink-0 text-brand">{icon}</span>
      <span>
        <span className="block font-medium">{label}</span>
        <span className="block text-xs leading-relaxed text-muted">{children}</span>
      </span>
    </div>
  );
}
