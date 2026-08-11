import 'server-only';

import { prisma } from './db';
import { auditDegree, calculateCgpa, type GradedCourse } from './grading';

/**
 * Student-side read models.
 *
 * These compose the several tables a student screen needs into one shape, so pages stay
 * declarative and the same numbers (GPA, outstanding balance, progress) are computed in
 * exactly one place rather than being re-derived per screen.
 */

export async function getStudentOverview(userId: string) {
  const [user, term] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { program: { include: { faculty: true } } },
    }),
    prisma.academicTerm.findFirst({ where: { isCurrent: true } }),
  ]);

  const [registrations, grades, invoices, notifications, upcomingAssignments, announcements] =
    await Promise.all([
      prisma.registration.findMany({
        where: { userId, ...(term ? { termId: term.id } : {}) },
        include: {
          course: {
            include: {
              lecturer: { select: { firstName: true, lastName: true } },
              _count: { select: { modules: true, assignments: true } },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.grade.findMany({
        where: { userId, published: true },
        include: { course: { select: { code: true, title: true } }, term: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.invoice.findMany({ where: { userId }, orderBy: { dueDate: 'desc' } }),
      prisma.notification.findMany({
        where: { userId, readAt: null },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
      prisma.assignment.findMany({
        where: {
          published: true,
          dueAt: { gte: new Date() },
          course: { registrations: { some: { userId, status: 'APPROVED' } } },
        },
        include: {
          course: { select: { code: true, title: true, slug: true } },
          submissions: { where: { userId }, select: { status: true, submittedAt: true, score: true } },
        },
        orderBy: { dueAt: 'asc' },
        take: 8,
      }),
      prisma.announcement.findMany({
        where: { audience: { in: ['ALL', 'STUDENTS'] } },
        orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
        take: 4,
      }),
    ]);

  const gradedCourses: GradedCourse[] = grades.map((g) => ({ credits: g.credits, score: g.score }));
  const cgpa = calculateCgpa(gradedCourses);

  const outstanding = invoices.reduce(
    (sum, invoice) => sum + Number(invoice.amount) - Number(invoice.amountPaid),
    0,
  );

  return {
    user,
    term,
    registrations,
    grades,
    invoices,
    notifications,
    upcomingAssignments,
    announcements,
    cgpa,
    outstanding,
    creditsEarned: grades.filter((g) => g.score >= 50).reduce((sum, g) => sum + g.credits, 0),
  };
}

/** Per-course completion, derived from lesson progress rather than guessed. */
export async function getCourseProgress(userId: string, courseId: string) {
  const [total, completed] = await Promise.all([
    prisma.lesson.count({ where: { module: { courseId } } }),
    prisma.lessonProgress.count({ where: { userId, completed: true, lesson: { module: { courseId } } } }),
  ]);
  return { total, completed, percent: total === 0 ? 0 : Math.round((completed / total) * 100) };
}

export async function getGraduationAudit(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      program: { include: { courses: { include: { course: { select: { code: true, title: true } } } } } },
    },
  });

  const [grades, invoices, inProgress] = await Promise.all([
    prisma.grade.findMany({
      where: { userId, published: true },
      include: { course: { select: { code: true } } },
    }),
    prisma.invoice.findMany({ where: { userId } }),
    prisma.registration.findMany({
      where: { userId, status: 'APPROVED' },
      include: { course: { select: { credits: true, code: true } } },
    }),
  ]);

  const passedCodes = new Set(grades.filter((g) => g.score >= 50).map((g) => g.course.code));
  const coreCourses = user.program?.courses.filter((pc) => pc.isCore) ?? [];
  const outstandingCore = coreCourses
    .filter((pc) => !passedCodes.has(pc.course.code))
    .map((pc) => `${pc.course.code} ${pc.course.title}`);

  const feesCleared = invoices.every(
    (invoice) => Number(invoice.amount) - Number(invoice.amountPaid) <= 0,
  );

  const audit = auditDegree({
    requiredCredits: user.program?.totalCredits ?? 0,
    completed: grades.map((g) => ({ credits: g.credits, score: g.score })),
    inProgressCredits: inProgress
      .filter((r) => !passedCodes.has(r.course.code))
      .reduce((sum, r) => sum + r.course.credits, 0),
    outstandingCoreCourses: outstandingCore,
    feesCleared,
  });

  return { user, audit, grades, coreCourses, passedCodes };
}

export async function getTranscript(userId: string) {
  const [user, grades] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId }, include: { program: true } }),
    prisma.grade.findMany({
      where: { userId, published: true },
      include: {
        course: { select: { code: true, title: true } },
        term: { select: { name: true, academicYear: true, startDate: true } },
      },
      orderBy: [{ term: { startDate: 'asc' } }, { createdAt: 'asc' }],
    }),
  ]);

  // Group by term so the transcript prints in the order it was earned.
  const byTerm = new Map<string, typeof grades>();
  for (const grade of grades) {
    const key = grade.term.name;
    byTerm.set(key, [...(byTerm.get(key) ?? []), grade]);
  }

  const terms = [...byTerm.entries()].map(([name, entries]) => ({
    name,
    entries,
    gpa: calculateCgpa(entries.map((g) => ({ credits: g.credits, score: g.score }))),
    credits: entries.filter((g) => g.score >= 50).reduce((sum, g) => sum + g.credits, 0),
  }));

  return {
    user,
    terms,
    cgpa: calculateCgpa(grades.map((g) => ({ credits: g.credits, score: g.score }))),
    totalCredits: grades.filter((g) => g.score >= 50).reduce((sum, g) => sum + g.credits, 0),
  };
}
