import { createSchema, createYoga } from 'graphql-yoga';

import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { can, type Permission } from '@/lib/rbac';
import type { User } from '@prisma/client';

/**
 * GraphQL API.
 *
 * Sits alongside the REST routes rather than replacing them: REST handles the mutations
 * the portals perform (which need per-endpoint rate limiting and audit semantics), while
 * GraphQL serves the read-heavy, shape-varying queries that reporting and the mobile app
 * make. Both go through the same authorisation helpers — a GraphQL field is never a way
 * around a REST permission check.
 *
 * The public catalogue (programmes, faculties, courses, news) resolves without a session.
 * Anything touching a person requires one, and `me`-scoped fields resolve against the
 * caller's own record only.
 */

type Context = { user: User | null };

function requireSession(context: Context): User {
  if (!context.user) throw new Error('Authentication required.');
  return context.user;
}

function requirePermission(context: Context, permission: Permission): User {
  const user = requireSession(context);
  if (!can(user.role, permission)) throw new Error('You do not have permission for that.');
  return user;
}

const typeDefs = /* GraphQL */ `
  scalar DateTime

  type Faculty {
    id: ID!
    slug: String!
    name: String!
    description: String!
    departments: [Department!]!
    programs: [Program!]!
  }

  type Department {
    id: ID!
    slug: String!
    name: String!
    description: String!
  }

  type Program {
    id: ID!
    slug: String!
    code: String!
    title: String!
    level: String!
    mode: String!
    summary: String!
    description: String!
    durationMonths: Int!
    totalCredits: Int!
    tuitionPerYear: Float!
    currency: String!
    entryRequirements: [String!]!
    careerOutcomes: [String!]!
    featured: Boolean!
    faculty: Faculty!
    courses: [Course!]!
  }

  type Course {
    id: ID!
    slug: String!
    code: String!
    title: String!
    description: String!
    credits: Int!
    level: Int!
    lecturerName: String
  }

  type Post {
    id: ID!
    slug: String!
    title: String!
    excerpt: String!
    body: String!
    category: String!
    tags: [String!]!
    publishedAt: DateTime!
    eventStart: DateTime
    location: String
  }

  type Scholarship {
    id: ID!
    slug: String!
    name: String!
    description: String!
    coveragePct: Int!
    deadline: DateTime!
    slots: Int!
  }

  type CertificateCheck {
    valid: Boolean!
    serial: String
    holder: String
    award: String
    classification: String
    issuedAt: DateTime
    reason: String
  }

  type Viewer {
    id: ID!
    email: String!
    firstName: String!
    lastName: String!
    role: String!
    status: String!
    studentNumber: String
    program: Program
    cgpa: Float!
    creditsEarned: Int!
    outstandingBalance: Float!
  }

  type Enrolment {
    id: ID!
    status: String!
    course: Course!
    termName: String!
  }

  type GradeEntry {
    id: ID!
    courseCode: String!
    courseTitle: String!
    score: Float!
    letter: String!
    gradePoint: Float!
    credits: Int!
    termName: String!
  }

  type InstitutionStats {
    students: Int!
    lecturers: Int!
    programs: Int!
    courses: Int!
    countries: Int!
    graduates: Int!
  }

  type Query {
    "Public: the programme catalogue."
    programs(level: String, featured: Boolean, search: String, limit: Int = 50): [Program!]!
    program(slug: String!): Program
    faculties: [Faculty!]!
    faculty(slug: String!): Faculty
    courses(search: String, limit: Int = 50): [Course!]!
    posts(category: String, limit: Int = 20): [Post!]!
    scholarships: [Scholarship!]!
    stats: InstitutionStats!

    "Public: verify a credential by its printed serial."
    verifyCertificate(serial: String!): CertificateCheck!

    "Requires a session: the caller's own record."
    me: Viewer
    myEnrolments: [Enrolment!]!
    myGrades: [GradeEntry!]!
  }
`;

const resolvers = {
  Query: {
    programs: async (
      _parent: unknown,
      args: { level?: string; featured?: boolean; search?: string; limit?: number },
    ) =>
      prisma.program.findMany({
        where: {
          published: true,
          ...(args.level ? { level: args.level as never } : {}),
          ...(args.featured !== undefined ? { featured: args.featured } : {}),
          ...(args.search
            ? {
                OR: [
                  { title: { contains: args.search, mode: 'insensitive' as const } },
                  { summary: { contains: args.search, mode: 'insensitive' as const } },
                ],
              }
            : {}),
        },
        take: Math.min(args.limit ?? 50, 100),
        orderBy: { title: 'asc' },
      }),

    program: (_parent: unknown, args: { slug: string }) =>
      prisma.program.findFirst({ where: { slug: args.slug, published: true } }),

    faculties: () => prisma.faculty.findMany({ orderBy: { name: 'asc' } }),

    faculty: (_parent: unknown, args: { slug: string }) =>
      prisma.faculty.findUnique({ where: { slug: args.slug } }),

    courses: (_parent: unknown, args: { search?: string; limit?: number }) =>
      prisma.course.findMany({
        where: {
          published: true,
          ...(args.search
            ? {
                OR: [
                  { title: { contains: args.search, mode: 'insensitive' as const } },
                  { code: { contains: args.search, mode: 'insensitive' as const } },
                ],
              }
            : {}),
        },
        include: { lecturer: { select: { firstName: true, lastName: true } } },
        take: Math.min(args.limit ?? 50, 100),
        orderBy: { code: 'asc' },
      }),

    posts: (_parent: unknown, args: { category?: string; limit?: number }) =>
      prisma.post.findMany({
        where: { published: true, ...(args.category ? { category: args.category as never } : {}) },
        take: Math.min(args.limit ?? 20, 50),
        orderBy: { publishedAt: 'desc' },
      }),

    scholarships: () =>
      prisma.scholarship.findMany({ where: { published: true }, orderBy: { deadline: 'asc' } }),

    stats: async () => {
      const [students, lecturers, programs, courses, graduates, countries] = await Promise.all([
        prisma.user.count({ where: { role: 'STUDENT' } }),
        prisma.user.count({ where: { role: 'LECTURER' } }),
        prisma.program.count({ where: { published: true } }),
        prisma.course.count({ where: { published: true } }),
        prisma.user.count({ where: { status: 'GRADUATED' } }),
        prisma.user.findMany({ where: { country: { not: null } }, distinct: ['country'], select: { country: true } }),
      ]);
      return { students, lecturers, programs, courses, graduates, countries: countries.length };
    },

    verifyCertificate: async (_parent: unknown, args: { serial: string }) => {
      const certificate = await prisma.certificate.findUnique({
        where: { serial: args.serial.trim().toUpperCase() },
        include: { user: { select: { firstName: true, lastName: true } } },
      });

      if (!certificate) return { valid: false, reason: 'No certificate with that serial has been issued.' };
      if (certificate.revoked) {
        return { valid: false, serial: certificate.serial, reason: 'This credential has been revoked.' };
      }

      return {
        valid: true,
        serial: certificate.serial,
        holder: `${certificate.user.firstName} ${certificate.user.lastName}`,
        award: certificate.title,
        classification: certificate.classification,
        issuedAt: certificate.issuedAt,
      };
    },

    me: async (_parent: unknown, _args: unknown, context: Context) => {
      const user = requireSession(context);
      const [grades, invoices, program] = await Promise.all([
        prisma.grade.findMany({ where: { userId: user.id, published: true } }),
        prisma.invoice.findMany({ where: { userId: user.id } }),
        user.programId ? prisma.program.findUnique({ where: { id: user.programId } }) : null,
      ]);

      const { calculateCgpa } = await import('@/lib/grading');

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        studentNumber: user.studentNumber,
        program,
        cgpa: calculateCgpa(grades.map((grade) => ({ credits: grade.credits, score: grade.score }))),
        creditsEarned: grades.filter((g) => g.score >= 50).reduce((sum, g) => sum + g.credits, 0),
        outstandingBalance: invoices.reduce(
          (sum, invoice) => sum + Number(invoice.amount) - Number(invoice.amountPaid),
          0,
        ),
      };
    },

    myEnrolments: async (_parent: unknown, _args: unknown, context: Context) => {
      const user = requireSession(context);
      const registrations = await prisma.registration.findMany({
        where: { userId: user.id },
        include: {
          course: { include: { lecturer: { select: { firstName: true, lastName: true } } } },
          term: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      return registrations.map((registration) => ({
        id: registration.id,
        status: registration.status,
        course: registration.course,
        termName: registration.term.name,
      }));
    },

    myGrades: async (_parent: unknown, _args: unknown, context: Context) => {
      const user = requirePermission(context, 'grade:read:self');
      const grades = await prisma.grade.findMany({
        where: { userId: user.id, published: true },
        include: { course: { select: { code: true, title: true } }, term: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      });

      return grades.map((grade) => ({
        id: grade.id,
        courseCode: grade.course.code,
        courseTitle: grade.course.title,
        score: grade.score,
        letter: grade.letter,
        gradePoint: grade.gradePoint,
        credits: grade.credits,
        termName: grade.term.name,
      }));
    },
  },

  Program: {
    tuitionPerYear: (program: { tuitionPerYear: unknown }) => Number(program.tuitionPerYear),
    faculty: (program: { facultyId: string }) =>
      prisma.faculty.findUnique({ where: { id: program.facultyId } }),
    courses: async (program: { id: string }) => {
      const entries = await prisma.programCourse.findMany({
        where: { programId: program.id },
        include: { course: { include: { lecturer: { select: { firstName: true, lastName: true } } } } },
        orderBy: [{ year: 'asc' }, { semester: 'asc' }],
      });
      return entries.map((entry) => entry.course);
    },
  },

  Faculty: {
    departments: (faculty: { id: string }) =>
      prisma.department.findMany({ where: { facultyId: faculty.id }, orderBy: { name: 'asc' } }),
    programs: (faculty: { id: string }) =>
      prisma.program.findMany({ where: { facultyId: faculty.id, published: true }, orderBy: { title: 'asc' } }),
  },

  Course: {
    lecturerName: (course: { lecturer?: { firstName: string; lastName: string } | null }) =>
      course.lecturer ? `${course.lecturer.firstName} ${course.lecturer.lastName}` : null,
  },
};

const yoga = createYoga({
  schema: createSchema({ typeDefs, resolvers }),
  graphqlEndpoint: '/api/graphql',
  fetchAPI: { Response },
  context: async (): Promise<Context> => ({ user: await getCurrentUser() }),
  // In production, resolver errors are masked so an internal message (a Prisma error, a
  // constraint name) never reaches a client that is allowed to query anonymously.
  maskedErrors: process.env.NODE_ENV === 'production',
});

/**
 * Yoga's handler takes a server context as its second argument, which does not match the
 * route-context shape Next.js type-checks route exports against. Wrapping it in a
 * single-argument function satisfies both — Yoga builds its own context from the request.
 */
async function handler(request: Request): Promise<Response> {
  return yoga.handleRequest(request, {});
}

export const GET = handler;
export const POST = handler;
export const OPTIONS = handler;
