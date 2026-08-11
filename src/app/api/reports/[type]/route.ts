import { audit, handleError, notFound } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getAdmissionsFunnel, getInstitutionalStats, getPaymentMix } from '@/lib/admin';
import { calculateCgpa } from '@/lib/grading';
import { SITE } from '@/lib/site';

export const dynamic = 'force-dynamic';

/**
 * GET /api/reports/:type — standing institutional reports.
 *
 * Reports are aggregates only: no report returns a named individual, so they can be
 * shared with committees and statutory bodies without a data-protection review each
 * time. Person-level extracts go through the student record with its own audit trail.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ type: string }> }) {
  try {
    const officer = await requireRole('ADMIN', 'REGISTRAR', 'FINANCE');
    const { type } = await params;

    const header = {
      institution: SITE.name,
      report: type,
      generatedAt: new Date().toISOString(),
      generatedBy: `${officer.firstName} ${officer.lastName} (${officer.role})`,
      note: 'Aggregate figures only. No individual student is identified in this report.',
    };

    let data: unknown;

    switch (type) {
      case 'enrolment': {
        const [byProgram, byCountry, byYear, stats] = await Promise.all([
          prisma.program.findMany({
            select: { code: true, title: true, level: true, _count: { select: { students: true } } },
            orderBy: { code: 'asc' },
          }),
          prisma.user.groupBy({
            by: ['country'],
            where: { role: 'STUDENT' },
            _count: { _all: true },
            orderBy: { _count: { country: 'desc' } },
          }),
          prisma.user.groupBy({
            by: ['yearOfStudy'],
            where: { role: 'STUDENT' },
            _count: { _all: true },
            orderBy: { yearOfStudy: 'asc' },
          }),
          getInstitutionalStats(),
        ]);

        data = {
          headcount: stats.students,
          byProgramme: byProgram.map((program) => ({
            code: program.code,
            title: program.title,
            level: program.level,
            students: program._count.students,
          })),
          byCountry: byCountry.map((row) => ({ country: row.country, students: row._count._all })),
          byYearOfStudy: byYear.map((row) => ({ year: row.yearOfStudy, students: row._count._all })),
        };
        break;
      }

      case 'attainment': {
        const grades = await prisma.grade.findMany({
          where: { published: true },
          select: { score: true, credits: true, course: { select: { code: true, title: true } } },
        });

        const byCourse = new Map<string, { title: string; scores: number[] }>();
        for (const grade of grades) {
          const entry = byCourse.get(grade.course.code) ?? { title: grade.course.title, scores: [] };
          entry.scores.push(grade.score);
          byCourse.set(grade.course.code, entry);
        }

        data = {
          resultsPublished: grades.length,
          overallPassRate: grades.length
            ? Math.round((grades.filter((g) => g.score >= 50).length / grades.length) * 100)
            : 0,
          overallMean: grades.length
            ? Math.round((grades.reduce((sum, g) => sum + g.score, 0) / grades.length) * 10) / 10
            : 0,
          cumulativeGpa: calculateCgpa(grades.map((g) => ({ credits: g.credits, score: g.score }))),
          byCourse: [...byCourse.entries()].map(([code, entry]) => ({
            code,
            title: entry.title,
            results: entry.scores.length,
            mean: Math.round((entry.scores.reduce((a, b) => a + b, 0) / entry.scores.length) * 10) / 10,
            passRate: Math.round((entry.scores.filter((s) => s >= 50).length / entry.scores.length) * 100),
          })),
        };
        break;
      }

      case 'finance': {
        const [stats, mix, byStatus] = await Promise.all([
          getInstitutionalStats(),
          getPaymentMix(),
          prisma.invoice.groupBy({ by: ['status'], _count: { _all: true }, _sum: { amount: true, amountPaid: true } }),
        ]);

        data = {
          billed: stats.billed,
          collected: stats.collected,
          outstanding: stats.outstanding,
          collectionRatePercent: stats.collectionRate,
          byInvoiceStatus: byStatus.map((row) => ({
            status: row.status,
            invoices: row._count._all,
            billed: Number(row._sum.amount ?? 0),
            paid: Number(row._sum.amountPaid ?? 0),
          })),
          byPaymentMethod: mix,
        };
        break;
      }

      case 'admissions': {
        const [funnel, byProgram] = await Promise.all([
          getAdmissionsFunnel(),
          prisma.application.groupBy({ by: ['programId', 'status'], _count: { _all: true } }),
        ]);

        const programs = await prisma.program.findMany({ select: { id: true, code: true, title: true } });
        const nameById = new Map(programs.map((program) => [program.id, `${program.code} ${program.title}`]));

        data = {
          funnel,
          byProgramme: byProgram.map((row) => ({
            programme: nameById.get(row.programId) ?? row.programId,
            status: row.status,
            applications: row._count._all,
          })),
        };
        break;
      }

      case 'retention': {
        const [withdrawn, graduated, active, noRegistrations] = await Promise.all([
          prisma.user.count({ where: { status: 'WITHDRAWN' } }),
          prisma.user.count({ where: { status: 'GRADUATED' } }),
          prisma.user.count({ where: { role: 'STUDENT', status: 'ACTIVE' } }),
          prisma.user.count({ where: { role: 'STUDENT', status: 'ACTIVE', registrations: { none: {} } } }),
        ]);

        const cohort = withdrawn + graduated + active;
        data = {
          activeStudents: active,
          graduated,
          withdrawn,
          neverRegistered: noRegistrations,
          completionRatePercent: cohort ? Math.round((graduated / cohort) * 100) : 0,
          withdrawalRatePercent: cohort ? Math.round((withdrawn / cohort) * 100) : 0,
        };
        break;
      }

      case 'research': {
        const [projects, publications, funding] = await Promise.all([
          prisma.researchProject.groupBy({ by: ['status'], _count: { _all: true } }),
          prisma.publication.groupBy({ by: ['year'], _count: { _all: true }, _sum: { citations: true }, orderBy: { year: 'desc' } }),
          prisma.researchProject.aggregate({ _sum: { fundingAmount: true } }),
        ]);

        data = {
          projectsByStatus: projects.map((row) => ({ status: row.status, projects: row._count._all })),
          publicationsByYear: publications.map((row) => ({
            year: row.year,
            publications: row._count._all,
            citations: Number(row._sum.citations ?? 0),
          })),
          totalFundingHeld: Number(funding._sum.fundingAmount ?? 0),
        };
        break;
      }

      default:
        throw notFound('Report');
    }

    await audit({
      userId: officer.id,
      action: 'report.generate',
      entityType: 'Report',
      entityId: type,
    });

    return new Response(JSON.stringify({ ...header, data }, null, 2), {
      headers: {
        'content-type': 'application/json',
        'content-disposition': `attachment; filename="rumax-${type}-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
