import type { Metadata } from 'next';

import { Alert, Card, CardBody, CardHeader, CardTitle, EmptyState, PageHeader } from '@/components/ui';
import { RegistrationForm } from './registration-form';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDate } from '@/lib/format';
import { MAX_CREDITS_PER_TERM, MIN_CREDITS_PER_TERM, prerequisitesMet } from '@/lib/grading';

export const metadata: Metadata = { title: 'Course registration' };
export const dynamic = 'force-dynamic';

export default async function RegistrationPage() {
  const user = await requireUser();
  const term = await prisma.academicTerm.findFirst({ where: { isCurrent: true } });

  if (!term) {
    return (
      <>
        <PageHeader title="Course registration" />
        <EmptyState
          title="No active term"
          description="Registration opens before each term begins. Check the academic calendar for dates."
        />
      </>
    );
  }

  const now = new Date();
  const open = term.registrationOpens <= now && term.registrationCloses >= now;

  const [program, existing, grades] = await Promise.all([
    user.programId
      ? prisma.program.findUnique({
          where: { id: user.programId },
          include: {
            courses: {
              include: {
                course: {
                  include: {
                    lecturer: { select: { firstName: true, lastName: true } },
                    prerequisites: { include: { prerequisite: { select: { code: true, title: true } } } },
                  },
                },
              },
              orderBy: [{ year: 'asc' }, { semester: 'asc' }],
            },
          },
        })
      : null,
    prisma.registration.findMany({
      where: { userId: user.id, termId: term.id },
      select: { courseId: true, status: true },
    }),
    prisma.grade.findMany({
      where: { userId: user.id, published: true },
      include: { course: { select: { code: true } } },
    }),
  ]);

  const passedCodes = grades.filter((g) => g.score >= 50).map((g) => g.course.code);
  const registeredIds = new Set(existing.map((r) => r.courseId));

  const options = (program?.courses ?? []).map((entry) => {
    const prerequisiteCodes = entry.course.prerequisites.map((p) => p.prerequisite.code);
    const check = prerequisitesMet(prerequisiteCodes, passedCodes);
    return {
      id: entry.course.id,
      code: entry.course.code,
      title: entry.course.title,
      credits: entry.course.credits,
      year: entry.year,
      semester: entry.semester,
      isCore: entry.isCore,
      lecturer: entry.course.lecturer
        ? `${entry.course.lecturer.firstName} ${entry.course.lecturer.lastName}`
        : null,
      prerequisites: prerequisiteCodes,
      missingPrerequisites: check.missing,
      alreadyPassed: passedCodes.includes(entry.course.code),
      alreadyRegistered: registeredIds.has(entry.course.id),
    };
  });

  return (
    <>
      <PageHeader
        title="Course registration"
        description={`${term.name} · registration ${open ? 'is open' : 'is closed'} (${formatDate(term.registrationOpens)} – ${formatDate(term.registrationCloses)})`}
      />

      {!open ? (
        <Alert tone="warning" title="Registration is closed" className="mb-6">
          The registration window for {term.name} ran from {formatDate(term.registrationOpens)} to{' '}
          {formatDate(term.registrationCloses)}. Late registration requires Dean&rsquo;s approval —
          contact the registrar through the help desk.
        </Alert>
      ) : null}

      {!program ? (
        <EmptyState
          title="No programme assigned"
          description="You are not yet enrolled on a programme. If you have accepted an offer, the registrar will complete your enrolment shortly."
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <RegistrationForm courses={options} termName={term.name} disabled={!open} />

          <Card className="h-fit">
            <CardHeader>
              <CardTitle as="h2">Registration rules</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3 text-sm leading-relaxed text-muted">
              <p>
                <strong className="text-fg">Credit load.</strong> Between {MIN_CREDITS_PER_TERM} and{' '}
                {MAX_CREDITS_PER_TERM} credits per term. Above the maximum needs the Dean&rsquo;s
                written approval.
              </p>
              <p>
                <strong className="text-fg">Prerequisites.</strong> A course whose prerequisites you
                have not passed cannot be selected. The missing course is named on the card so you
                know what to take first.
              </p>
              <p>
                <strong className="text-fg">Approval.</strong> Registrations are submitted to the
                registrar and are usually approved within two working days. You can start studying
                as soon as approval comes through.
              </p>
              <p>
                <strong className="text-fg">Changing your mind.</strong> You may drop a course
                without penalty until the end of week two. After that a withdrawal is recorded on
                your transcript.
              </p>
              <p>
                <strong className="text-fg">Fees.</strong> An invoice is raised once your
                registration is approved. Registration does not require payment up front.
              </p>
            </CardBody>
          </Card>
        </div>
      )}
    </>
  );
}
