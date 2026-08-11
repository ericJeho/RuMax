import 'server-only';

import { prisma } from './db';

/**
 * Institutional analytics.
 *
 * These are the figures the university publishes and governs by: enrolment, revenue,
 * admissions conversion, retention and completion. They are computed from the live
 * tables rather than a warehouse, which is correct at this scale; docs/ANALYTICS.md
 * describes the read-replica and materialised-view path for larger deployments.
 */

export async function getInstitutionalStats() {
  const now = new Date();
  const yearAgo = new Date(now.getTime() - 365 * 86_400_000);

  const [
    students,
    newStudents,
    lecturers,
    programs,
    courses,
    applications,
    admittedApplications,
    graduates,
    invoiceTotals,
    paymentTotals,
    activeSessions,
    countries,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.user.count({ where: { role: 'STUDENT', admittedAt: { gte: yearAgo } } }),
    prisma.user.count({ where: { role: 'LECTURER' } }),
    prisma.program.count({ where: { published: true } }),
    prisma.course.count({ where: { published: true } }),
    prisma.application.count(),
    prisma.application.count({ where: { status: { in: ['OFFER_MADE', 'ACCEPTED', 'ENROLLED'] } } }),
    prisma.user.count({ where: { status: 'GRADUATED' } }),
    prisma.invoice.aggregate({ _sum: { amount: true, amountPaid: true } }),
    prisma.payment.aggregate({ where: { status: 'SUCCEEDED' }, _sum: { amount: true } }),
    prisma.session.count({ where: { revokedAt: null, expiresAt: { gte: now } } }),
    prisma.user.findMany({ where: { country: { not: null } }, distinct: ['country'], select: { country: true } }),
  ]);

  const billed = Number(invoiceTotals._sum.amount ?? 0);
  const collected = Number(invoiceTotals._sum.amountPaid ?? 0);

  return {
    students,
    newStudents,
    lecturers,
    programs,
    courses,
    applications,
    admittedApplications,
    graduates,
    countries: countries.length,
    activeSessions,
    revenue: Number(paymentTotals._sum.amount ?? 0),
    billed,
    collected,
    outstanding: billed - collected,
    collectionRate: billed === 0 ? 0 : Math.round((collected / billed) * 100),
    conversionRate: applications === 0 ? 0 : Math.round((admittedApplications / applications) * 100),
  };
}

/** Admissions funnel, in the order applications actually move through it. */
export async function getAdmissionsFunnel() {
  const grouped = await prisma.application.groupBy({ by: ['status'], _count: { _all: true } });
  const counts = new Map(grouped.map((row) => [row.status, row._count._all]));

  const order = [
    'DRAFT',
    'SUBMITTED',
    'UNDER_REVIEW',
    'INTERVIEW',
    'OFFER_MADE',
    'ACCEPTED',
    'ENROLLED',
  ] as const;

  return order.map((status) => ({
    stage: status.replace(/_/g, ' ').toLowerCase(),
    count: counts.get(status) ?? 0,
  }));
}

/** Enrolment split by programme level — what the institution actually teaches. */
export async function getEnrolmentByLevel() {
  const programs = await prisma.program.findMany({
    select: { level: true, _count: { select: { students: true } } },
  });

  const totals = new Map<string, number>();
  for (const program of programs) {
    const key = program.level.replace(/_/g, ' ').toLowerCase();
    totals.set(key, (totals.get(key) ?? 0) + program._count.students);
  }

  return [...totals.entries()]
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

/** Monthly revenue for the last twelve months. */
export async function getRevenueTrend() {
  const since = new Date();
  since.setMonth(since.getMonth() - 11);
  since.setDate(1);

  const payments = await prisma.payment.findMany({
    where: { status: 'SUCCEEDED', paidAt: { gte: since } },
    select: { amount: true, paidAt: true, provider: true },
  });

  const months = new Map<string, number>();
  for (let i = 0; i < 12; i += 1) {
    const date = new Date(since);
    date.setMonth(since.getMonth() + i);
    months.set(date.toISOString().slice(0, 7), 0);
  }

  for (const payment of payments) {
    if (!payment.paidAt) continue;
    const key = payment.paidAt.toISOString().slice(0, 7);
    if (months.has(key)) months.set(key, (months.get(key) ?? 0) + Number(payment.amount));
  }

  return [...months.entries()].map(([month, revenue]) => ({
    month: new Date(`${month}-01T00:00:00Z`).toLocaleString('en', { month: 'short', timeZone: 'UTC' }),
    revenue: Math.round(revenue),
  }));
}

/** Payment method mix — which rails our students actually use. */
export async function getPaymentMix() {
  const grouped = await prisma.payment.groupBy({
    by: ['provider'],
    where: { status: 'SUCCEEDED' },
    _sum: { amount: true },
    _count: { _all: true },
  });

  return grouped
    .map((row) => ({
      name: row.provider.replace(/_/g, ' ').toLowerCase(),
      value: Number(row._sum.amount ?? 0),
      count: row._count._all,
    }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Students at risk of dropping out.
 *
 * A deliberately simple, explainable rule rather than an opaque model: no approved
 * registrations this term, or nothing submitted, or a published fail average. A
 * retention officer has to be able to justify why a student was contacted.
 */
export async function getRetentionRisk(limit = 25) {
  const term = await prisma.academicTerm.findFirst({ where: { isCurrent: true } });

  const students = await prisma.user.findMany({
    where: { role: 'STUDENT', status: 'ACTIVE' },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      studentNumber: true,
      lastLoginAt: true,
      program: { select: { title: true } },
      registrations: {
        where: term ? { termId: term.id, status: 'APPROVED' } : { status: 'APPROVED' },
        select: { id: true },
      },
      grades: { where: { published: true }, select: { score: true } },
      submissions: { where: { status: { in: ['SUBMITTED', 'GRADED', 'LATE'] } }, select: { id: true } },
      invoices: { select: { amount: true, amountPaid: true } },
    },
    take: 500,
  });

  return students
    .map((student) => {
      const reasons: string[] = [];
      const average =
        student.grades.length > 0
          ? student.grades.reduce((sum, grade) => sum + grade.score, 0) / student.grades.length
          : null;
      const owed = student.invoices.reduce(
        (sum, invoice) => sum + Number(invoice.amount) - Number(invoice.amountPaid),
        0,
      );

      if (student.registrations.length === 0) reasons.push('No approved registrations this term');
      if (student.submissions.length === 0) reasons.push('Never submitted any work');
      if (average !== null && average < 45) reasons.push(`Average ${average.toFixed(0)}% — failing`);
      if (owed > 1000) reasons.push(`Owes ${owed.toFixed(0)}`);
      if (!student.lastLoginAt) reasons.push('Has never signed in');
      else if (Date.now() - student.lastLoginAt.getTime() > 45 * 86_400_000) {
        reasons.push('No sign-in for 45+ days');
      }

      return {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        studentNumber: student.studentNumber,
        program: student.program?.title ?? '—',
        average,
        reasons,
        score: reasons.length,
      };
    })
    .filter((student) => student.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
