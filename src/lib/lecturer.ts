import 'server-only';

import { prisma } from './db';
import { aggregateScore } from './grading';

/**
 * Read models for the lecturer portal.
 *
 * The analytics here answer the questions a lecturer actually asks — who is falling
 * behind, which assessment is not working, what is still unmarked — rather than
 * presenting engagement metrics nobody acts on.
 */

export async function getLecturerOverview(lecturerId: string) {
  const [courses, toMark, upcoming, recentSubmissions] = await Promise.all([
    prisma.course.findMany({
      where: { lecturerId },
      include: {
        _count: { select: { registrations: true, assignments: true, quizzes: true, modules: true } },
        registrations: { where: { status: 'APPROVED' }, select: { id: true } },
      },
      orderBy: { code: 'asc' },
    }),
    prisma.submission.count({
      where: { status: { in: ['SUBMITTED', 'LATE'] }, assignment: { course: { lecturerId } } },
    }),
    prisma.assignment.findMany({
      where: { course: { lecturerId }, dueAt: { gte: new Date() } },
      include: {
        course: { select: { code: true } },
        _count: { select: { submissions: true } },
      },
      orderBy: { dueAt: 'asc' },
      take: 5,
    }),
    prisma.submission.findMany({
      where: { assignment: { course: { lecturerId } }, status: { in: ['SUBMITTED', 'LATE'] } },
      include: {
        user: { select: { firstName: true, lastName: true, studentNumber: true } },
        assignment: { select: { title: true, maxScore: true, course: { select: { code: true } } } },
      },
      orderBy: { submittedAt: 'desc' },
      take: 8,
    }),
  ]);

  const studentCount = courses.reduce((sum, course) => sum + course.registrations.length, 0);

  return { courses, toMark, upcoming, recentSubmissions, studentCount };
}

export type StudentPerformance = {
  userId: string;
  name: string;
  studentNumber: string | null;
  runningMark: number;
  submitted: number;
  expected: number;
  lessonsComplete: number;
  lessonsTotal: number;
  atRisk: boolean;
};

/**
 * Per-student performance in one course.
 *
 * "At risk" combines a running mark below the pass line with low engagement — either
 * alone is noisy, but a student who is both behind on marks and behind on material is
 * almost always one an early conversation can still help.
 */
export async function getCoursePerformance(courseId: string): Promise<StudentPerformance[]> {
  const [registrations, assignments, submissions, lessons, progress] = await Promise.all([
    prisma.registration.findMany({
      where: { courseId, status: 'APPROVED' },
      include: { user: { select: { id: true, firstName: true, lastName: true, studentNumber: true } } },
    }),
    prisma.assignment.findMany({ where: { courseId, published: true }, select: { id: true, weight: true, maxScore: true } }),
    prisma.submission.findMany({
      where: { assignment: { courseId } },
      select: { userId: true, assignmentId: true, score: true, status: true },
    }),
    prisma.lesson.findMany({ where: { module: { courseId } }, select: { id: true } }),
    prisma.lessonProgress.findMany({
      where: { completed: true, lesson: { module: { courseId } } },
      select: { userId: true, lessonId: true },
    }),
  ]);

  const dueByNow = assignments.length;
  const lessonTotal = lessons.length;

  return registrations
    .map((registration) => {
      const own = submissions.filter((s) => s.userId === registration.user.id);
      const marked = own.filter((s) => s.score !== null);

      const runningMark = aggregateScore(
        marked.map((submission) => {
          const assignment = assignments.find((a) => a.id === submission.assignmentId);
          const max = assignment?.maxScore ?? 100;
          return { score: ((submission.score ?? 0) / max) * 100, weight: assignment?.weight ?? 0.1 };
        }),
      );

      const lessonsComplete = progress.filter((p) => p.userId === registration.user.id).length;
      const engagement = lessonTotal === 0 ? 1 : lessonsComplete / lessonTotal;
      const submissionRate = dueByNow === 0 ? 1 : own.filter((s) => s.status !== 'DRAFT').length / dueByNow;

      return {
        userId: registration.user.id,
        name: `${registration.user.firstName} ${registration.user.lastName}`,
        studentNumber: registration.user.studentNumber,
        runningMark: marked.length > 0 ? runningMark : 0,
        submitted: own.filter((s) => s.status !== 'DRAFT').length,
        expected: dueByNow,
        lessonsComplete,
        lessonsTotal: lessonTotal,
        atRisk: (marked.length > 0 && runningMark < 50) || (engagement < 0.3 && submissionRate < 0.5),
      };
    })
    .sort((a, b) => Number(b.atRisk) - Number(a.atRisk) || a.runningMark - b.runningMark);
}

/** Assessment-level statistics: mean, spread and pass rate for each piece of work. */
export async function getAssessmentStats(courseId: string) {
  const assignments = await prisma.assignment.findMany({
    where: { courseId },
    include: { submissions: { where: { score: { not: null } }, select: { score: true } } },
    orderBy: { dueAt: 'asc' },
  });

  return assignments.map((assignment) => {
    const scores = assignment.submissions.map((s) => ((s.score ?? 0) / assignment.maxScore) * 100);
    const mean = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const sorted = [...scores].sort((a, b) => a - b);
    const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;

    return {
      id: assignment.id,
      title: assignment.title,
      marked: scores.length,
      mean: Math.round(mean * 10) / 10,
      median: Math.round(median * 10) / 10,
      passRate: scores.length ? Math.round((scores.filter((s) => s >= 50).length / scores.length) * 100) : 0,
      lowest: sorted[0] ?? 0,
      highest: sorted[sorted.length - 1] ?? 0,
    };
  });
}
