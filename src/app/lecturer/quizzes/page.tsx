import type { Metadata } from 'next';

import { PageHeader } from '@/components/ui';
import { QuizBuilder } from './quiz-builder';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const metadata: Metadata = { title: 'Quiz builder' };
export const dynamic = 'force-dynamic';

export default async function QuizBuilderPage() {
  const user = await requireUser();

  const courses = await prisma.course.findMany({
    where: user.role === 'ADMIN' ? {} : { lecturerId: user.id },
    select: { id: true, code: true, title: true },
    orderBy: { code: 'asc' },
  });

  const quizzes = await prisma.quiz.findMany({
    where: { courseId: { in: courses.map((c) => c.id) } },
    include: {
      course: { select: { code: true } },
      _count: { select: { questions: true, attempts: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <>
      <PageHeader
        title="Quiz builder"
        description="Build question banks, set the rules, and publish when you are ready. Unpublished quizzes are invisible to students."
      />

      <QuizBuilder
        courses={courses.map((course) => ({ id: course.id, label: `${course.code} — ${course.title}` }))}
        existing={quizzes.map((quiz) => ({
          id: quiz.id,
          title: quiz.title,
          courseCode: quiz.course.code,
          type: quiz.type,
          questions: quiz._count.questions,
          attempts: quiz._count.attempts,
          published: quiz.published,
          durationMins: quiz.durationMins,
          proctored: quiz.proctored,
        }))}
      />
    </>
  );
}
