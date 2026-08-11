import 'server-only';

import { prisma } from './db';

/**
 * Read helpers shared by the public pages.
 *
 * Marketing pages must render even when the database is unreachable — an outage in the
 * student records service should never take the university's public website down. Each
 * helper therefore wraps its query in {@link safeQuery}, which logs and falls back to an
 * empty result instead of throwing a 500 at a prospective applicant.
 */
export async function safeQuery<T>(label: string, run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch (error) {
    console.error(`[query:${label}] failed, serving fallback`, error);
    return fallback;
  }
}

export function getFeaturedPrograms(limit = 6) {
  return safeQuery(
    'featured-programs',
    () =>
      prisma.program.findMany({
        where: { published: true, featured: true },
        include: { faculty: { select: { name: true, slug: true } } },
        orderBy: { title: 'asc' },
        take: limit,
      }),
    [],
  );
}

export function getFaculties() {
  return safeQuery(
    'faculties',
    () =>
      prisma.faculty.findMany({
        include: {
          dean: { select: { firstName: true, lastName: true } },
          _count: { select: { programs: true, departments: true } },
        },
        orderBy: { name: 'asc' },
      }),
    [],
  );
}

export function getLatestPosts(category: 'NEWS' | 'BLOG' | 'EVENT' | 'PRESS' | undefined, limit = 3) {
  return safeQuery(
    'posts',
    () =>
      prisma.post.findMany({
        where: { published: true, ...(category ? { category } : {}) },
        orderBy: { publishedAt: 'desc' },
        take: limit,
      }),
    [],
  );
}

export function getUpcomingEvents(limit = 4) {
  return safeQuery(
    'events',
    () =>
      prisma.post.findMany({
        where: { published: true, category: 'EVENT', eventStart: { gte: new Date() } },
        orderBy: { eventStart: 'asc' },
        take: limit,
      }),
    [],
  );
}

export function getCurrentTerm() {
  return safeQuery(
    'current-term',
    () => prisma.academicTerm.findFirst({ where: { isCurrent: true } }),
    null,
  );
}

export function getScholarships(limit?: number) {
  return safeQuery(
    'scholarships',
    () =>
      prisma.scholarship.findMany({
        where: { published: true },
        orderBy: { deadline: 'asc' },
        ...(limit ? { take: limit } : {}),
      }),
    [],
  );
}

export function getPartners() {
  return safeQuery('partners', () => prisma.partner.findMany({ orderBy: { name: 'asc' } }), []);
}

export function getFaqs() {
  return safeQuery(
    'faqs',
    () => prisma.faqEntry.findMany({ orderBy: [{ category: 'asc' }, { position: 'asc' }] }),
    [],
  );
}

export function getJobs(limit?: number) {
  return safeQuery(
    'jobs',
    () =>
      prisma.jobPosting.findMany({
        where: { published: true, closesAt: { gte: new Date() } },
        orderBy: { closesAt: 'asc' },
        ...(limit ? { take: limit } : {}),
      }),
    [],
  );
}

/** Live headline counts for the landing page and the admin dashboard. */
export async function getUniversityStats() {
  return safeQuery(
    'university-stats',
    async () => {
      const [students, programs, courses, lecturers, countries, graduates] = await Promise.all([
        prisma.user.count({ where: { role: 'STUDENT' } }),
        prisma.program.count({ where: { published: true } }),
        prisma.course.count({ where: { published: true } }),
        prisma.user.count({ where: { role: 'LECTURER' } }),
        prisma.user.findMany({ where: { country: { not: null } }, distinct: ['country'], select: { country: true } }),
        prisma.user.count({ where: { status: 'GRADUATED' } }),
      ]);
      return {
        students,
        programs,
        courses,
        lecturers,
        countries: countries.length,
        graduates,
      };
    },
    { students: 0, programs: 0, courses: 0, lecturers: 0, countries: 0, graduates: 0 },
  );
}
