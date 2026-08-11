import { z } from 'zod';

import { audit, badRequest, created, handleError, ok, parseBody } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { prerequisitesMet, validateRegistrationLoad } from '@/lib/grading';

const schema = z.object({ courseIds: z.array(z.string().min(1)).min(1).max(12) });

export const dynamic = 'force-dynamic';

/** GET /api/registrations — the caller's registrations for the current term. */
export async function GET() {
  try {
    const user = await requireUser();
    const registrations = await prisma.registration.findMany({
      where: { userId: user.id },
      include: {
        course: { select: { code: true, title: true, credits: true, slug: true } },
        term: { select: { name: true, isCurrent: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return ok({ registrations });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/registrations — register for courses in the current term.
 *
 * Every rule the UI enforces is re-checked here: the registration window, prerequisites,
 * the credit cap (including credits already registered this term), and that each course
 * actually belongs to the student's programme. The client is a convenience, not a gate.
 */
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const { courseIds } = await parseBody(request, schema);

    if (!user.programId) throw badRequest('You are not enrolled on a programme yet.');

    const term = await prisma.academicTerm.findFirst({ where: { isCurrent: true } });
    if (!term) throw badRequest('There is no active academic term.');

    const now = new Date();
    if (term.registrationOpens > now || term.registrationCloses < now) {
      throw badRequest('Registration for this term is closed. Contact the registrar for late registration.');
    }

    const [programCourses, grades, existing] = await Promise.all([
      prisma.programCourse.findMany({
        where: { programId: user.programId, courseId: { in: courseIds } },
        include: {
          course: {
            include: { prerequisites: { include: { prerequisite: { select: { code: true } } } } },
          },
        },
      }),
      prisma.grade.findMany({
        where: { userId: user.id, published: true },
        include: { course: { select: { code: true } } },
      }),
      prisma.registration.findMany({
        where: { userId: user.id, termId: term.id, status: { in: ['PENDING', 'APPROVED'] } },
        include: { course: { select: { id: true, credits: true, code: true } } },
      }),
    ]);

    if (programCourses.length !== courseIds.length) {
      throw badRequest('One or more of the selected courses is not part of your programme.');
    }

    const alreadyRegistered = programCourses.filter((pc) =>
      existing.some((registration) => registration.course.id === pc.courseId),
    );
    if (alreadyRegistered.length > 0) {
      throw badRequest(
        `You are already registered for ${alreadyRegistered.map((pc) => pc.course.code).join(', ')} this term.`,
      );
    }

    const passedCodes = grades.filter((g) => g.score >= 50).map((g) => g.course.code);
    for (const entry of programCourses) {
      const required = entry.course.prerequisites.map((p) => p.prerequisite.code);
      const check = prerequisitesMet(required, passedCodes);
      if (!check.met) {
        throw badRequest(
          `${entry.course.code} requires ${check.missing.join(', ')}, which you have not yet passed.`,
        );
      }
    }

    const newCredits = programCourses.reduce((sum, pc) => sum + pc.course.credits, 0);
    const existingCredits = existing.reduce((sum, r) => sum + r.course.credits, 0);
    const loadError = validateRegistrationLoad(newCredits + existingCredits);
    // Only the upper bound blocks a submission: a student may build up to the minimum
    // across several visits, so rejecting an under-load here would be wrong.
    if (loadError && newCredits + existingCredits > 21) throw badRequest(loadError);

    const result = await prisma.registration.createMany({
      data: programCourses.map((pc) => ({
        userId: user.id,
        courseId: pc.courseId,
        termId: term.id,
        status: 'PENDING' as const,
      })),
      skipDuplicates: true,
    });

    await audit({
      userId: user.id,
      action: 'registration.create',
      entityType: 'Registration',
      metadata: { term: term.name, courses: programCourses.map((pc) => pc.course.code), credits: newCredits },
    });

    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Registration submitted',
        body: `${result.count} course${result.count === 1 ? '' : 's'} submitted for approval for ${term.name}.`,
        link: '/portal/registration',
        category: 'registration',
      },
    });

    return created({ created: result.count, termId: term.id, totalCredits: newCredits + existingCredits });
  } catch (error) {
    return handleError(error);
  }
}
