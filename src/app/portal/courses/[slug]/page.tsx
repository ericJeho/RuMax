import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  CalendarClock,
  Download,
  FileText,
  FlaskConical,
  Headphones,
  MessageSquare,
  Presentation,
  Radio,
  Video,
} from 'lucide-react';

import {
  Badge,
  Breadcrumbs,
  ButtonLink,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  PageHeader,
  ProgressBar,
  StatusBadge,
} from '@/components/ui';
import { LessonList } from './lesson-list';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDate, formatDuration, formatRelative } from '@/lib/format';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await prisma.course.findUnique({ where: { slug }, select: { title: true } });
  return { title: course?.title ?? 'Course' };
}

const LESSON_ICONS = {
  VIDEO: Video,
  READING: FileText,
  PDF: FileText,
  SLIDES: Presentation,
  AUDIO: Headphones,
  LAB: FlaskConical,
  SIMULATION: FlaskConical,
  LIVE: Radio,
} as const;

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser();

  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      lecturer: { select: { firstName: true, lastName: true, bio: true, avatarUrl: true } },
      department: { select: { name: true } },
      modules: { include: { lessons: { orderBy: { position: 'asc' } } }, orderBy: { position: 'asc' } },
      assignments: { where: { published: true }, orderBy: { dueAt: 'asc' } },
      quizzes: { where: { published: true }, orderBy: { createdAt: 'asc' } },
      liveSessions: { where: { endsAt: { gte: new Date() } }, orderBy: { startsAt: 'asc' }, take: 3 },
      forumThreads: { orderBy: { updatedAt: 'desc' }, take: 5, include: { _count: { select: { posts: true } } } },
    },
  });

  if (!course) notFound();

  // Access control: students may only open courses they are registered for. Admins and
  // the course's own lecturer bypass this so they can review what students see.
  const registration = await prisma.registration.findFirst({
    where: { userId: user.id, courseId: course.id },
  });
  const privileged = user.role === 'ADMIN' || course.lecturerId === user.id;
  if (!registration && !privileged) notFound();

  const [progress, submissions] = await Promise.all([
    prisma.lessonProgress.findMany({
      where: { userId: user.id, lesson: { module: { courseId: course.id } } },
      select: { lessonId: true, completed: true },
    }),
    prisma.submission.findMany({
      where: { userId: user.id, assignment: { courseId: course.id } },
      select: { assignmentId: true, status: true, score: true },
    }),
  ]);

  const completed = new Set(progress.filter((p) => p.completed).map((p) => p.lessonId));
  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const totalMinutes = course.modules.reduce(
    (sum, m) => sum + m.lessons.reduce((s, l) => s + l.durationMins, 0),
    0,
  );

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Portal', href: '/portal' },
          { label: 'My courses', href: '/portal/courses' },
          { label: course.code },
        ]}
      />

      <PageHeader
        title={course.title}
        description={course.description}
        actions={
          <>
            <Badge tone="brand">{course.code}</Badge>
            <Badge>{course.credits} credits</Badge>
            <Badge>Level {course.level}</Badge>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle as="h2">Course content</CardTitle>
              <span className="text-xs text-muted">
                {course.modules.length} units · {totalLessons} lessons · {formatDuration(totalMinutes)}
              </span>
            </CardHeader>
            <CardBody>
              <ProgressBar
                value={completed.size}
                max={Math.max(1, totalLessons)}
                label={`${completed.size} of ${totalLessons} lessons complete`}
                className="mb-5"
              />

              <LessonList
                modules={course.modules.map((module) => ({
                  id: module.id,
                  title: module.title,
                  summary: module.summary,
                  lessons: module.lessons.map((lesson) => ({
                    id: lesson.id,
                    title: lesson.title,
                    type: lesson.type,
                    durationMins: lesson.durationMins,
                    downloadable: lesson.downloadable,
                    body: lesson.body,
                    completed: completed.has(lesson.id),
                  })),
                }))}
                iconNames={Object.keys(LESSON_ICONS)}
              />
            </CardBody>
          </Card>

          {course.assignments.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle as="h2">Assessment</CardTitle>
              </CardHeader>
              <CardBody className="space-y-3">
                {course.assignments.map((assignment) => {
                  const submission = submissions.find((s) => s.assignmentId === assignment.id);
                  return (
                    <div
                      key={assignment.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">{assignment.title}</p>
                        <p className="mt-0.5 text-xs text-muted">
                          Worth {Math.round(assignment.weight * 100)}% · due{' '}
                          {formatDate(assignment.dueAt, 'en', { dateStyle: 'medium', timeStyle: 'short' })} (
                          {formatRelative(assignment.dueAt)})
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {submission ? (
                          <>
                            <StatusBadge status={submission.status} />
                            {submission.score !== null && submission.score !== undefined ? (
                              <span className="text-sm font-semibold tabular-nums">
                                {submission.score}/{assignment.maxScore}
                              </span>
                            ) : null}
                          </>
                        ) : (
                          <Badge tone="warning">Not submitted</Badge>
                        )}
                        <ButtonLink href="/portal/assignments" variant="secondary" size="sm">
                          Open
                        </ButtonLink>
                      </div>
                    </div>
                  );
                })}

                {course.quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{quiz.title}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {quiz.durationMins} minutes · {quiz.maxAttempts} attempt
                        {quiz.maxAttempts === 1 ? '' : 's'} · worth {Math.round(quiz.weight * 100)}%
                        {quiz.proctored ? ' · proctored' : ''}
                      </p>
                    </div>
                    <ButtonLink href={`/portal/quizzes/${quiz.id}`} variant="secondary" size="sm">
                      {quiz.type === 'FINAL_EXAM' ? 'Exam details' : 'Start quiz'}
                    </ButtonLink>
                  </div>
                ))}
              </CardBody>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          {course.lecturer ? (
            <Card>
              <CardHeader>
                <CardTitle as="h2">Your lecturer</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="font-medium">
                  {course.lecturer.firstName} {course.lecturer.lastName}
                </p>
                <p className="mt-0.5 text-xs text-muted">{course.department?.name}</p>
                {course.lecturer.bio ? (
                  <p className="mt-3 text-sm leading-relaxed text-muted">{course.lecturer.bio}</p>
                ) : null}
                <ButtonLink href="/portal/messages" variant="secondary" size="sm" className="mt-4 w-full">
                  <MessageSquare size={14} aria-hidden />
                  Message lecturer
                </ButtonLink>
              </CardBody>
            </Card>
          ) : null}

          {course.liveSessions.length > 0 ? (
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle as="h2">Live sessions</CardTitle>
                <CalendarClock size={16} className="text-muted" aria-hidden />
              </CardHeader>
              <CardBody className="space-y-3">
                {course.liveSessions.map((session) => (
                  <div key={session.id} className="rounded-xl border border-border p-3">
                    <p className="text-sm font-medium">{session.title}</p>
                    <p className="mt-1 text-xs text-muted">
                      {formatDate(session.startsAt, 'en', { dateStyle: 'medium', timeStyle: 'short' })} ·{' '}
                      {session.provider.replace('_', ' ')}
                    </p>
                    <a
                      href={session.joinUrl}
                      className="mt-2 inline-block text-sm font-medium text-brand hover:underline"
                    >
                      Join session →
                    </a>
                  </div>
                ))}
              </CardBody>
            </Card>
          ) : null}

          {course.forumThreads.length > 0 ? (
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle as="h2">Discussion</CardTitle>
                <Link href="/portal/forums" className="text-sm text-brand hover:underline">
                  All threads
                </Link>
              </CardHeader>
              <CardBody className="space-y-3">
                {course.forumThreads.map((thread) => (
                  <div key={thread.id} className="border-b border-border/60 pb-3 last:border-0 last:pb-0">
                    <Link
                      href={`/portal/forums/${thread.id}`}
                      className="text-sm font-medium leading-snug hover:text-brand"
                    >
                      {thread.title}
                    </Link>
                    <p className="mt-1 text-xs text-muted">
                      {thread._count.posts} replies · {thread.views} views
                    </p>
                  </div>
                ))}
              </CardBody>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle as="h2">Offline study</CardTitle>
            </CardHeader>
            <CardBody>
              <p className="text-sm leading-relaxed text-muted">
                Every lesson marked downloadable can be saved for offline study. On a slow
                connection, use the audio-plus-slides version of each video.
              </p>
              <button
                type="button"
                className="btn-secondary mt-4 w-full"
                aria-label="Download all course materials"
              >
                <Download size={14} aria-hidden />
                Download all materials
              </button>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
