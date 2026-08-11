import type { Metadata } from 'next';

import { Card, CardBody, CardHeader, CardTitle, PageHeader, StatCard, Table, Td, Th } from '@/components/ui';
import { ColumnChart, DonutChart, TrendChart } from '@/components/charts';
import { requireRole } from '@/lib/auth';
import { getAdmissionsFunnel, getEnrolmentByLevel, getInstitutionalStats, getRevenueTrend } from '@/lib/admin';
import { prisma } from '@/lib/db';
import { formatCurrency, formatNumber } from '@/lib/format';

export const metadata: Metadata = { title: 'Analytics' };
export const dynamic = 'force-dynamic';

export default async function AdminAnalyticsPage() {
  await requireRole('ADMIN', 'REGISTRAR', 'FINANCE');

  const [stats, funnel, levels, revenue, gradeRows, byCountry] = await Promise.all([
    getInstitutionalStats(),
    getAdmissionsFunnel(),
    getEnrolmentByLevel(),
    getRevenueTrend(),
    prisma.grade.findMany({ where: { published: true }, select: { score: true, credits: true } }),
    prisma.user.groupBy({
      by: ['country'],
      where: { role: 'STUDENT', country: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { country: 'desc' } },
      take: 10,
    }),
  ]);

  const passRate = gradeRows.length
    ? Math.round((gradeRows.filter((grade) => grade.score >= 50).length / gradeRows.length) * 100)
    : 0;
  const meanMark = gradeRows.length
    ? gradeRows.reduce((sum, grade) => sum + grade.score, 0) / gradeRows.length
    : 0;

  const bands = [
    { name: '0–39', min: 0, max: 40 },
    { name: '40–49', min: 40, max: 50 },
    { name: '50–59', min: 50, max: 60 },
    { name: '60–69', min: 60, max: 70 },
    { name: '70–79', min: 70, max: 80 },
    { name: '80–100', min: 80, max: 101 },
  ].map((band) => ({
    name: band.name,
    results: gradeRows.filter((grade) => grade.score >= band.min && grade.score < band.max).length,
  }));

  return (
    <>
      <PageHeader
        title="Institutional analytics"
        description="Enrolment, admissions, attainment and revenue. These figures are published annually in the university's transparency report."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Students" value={formatNumber(stats.students)} hint={`${stats.countries} countries`} />
        <StatCard label="Pass rate" value={`${passRate}%`} hint={`mean mark ${meanMark.toFixed(1)}%`} />
        <StatCard label="Admissions conversion" value={`${stats.conversionRate}%`} hint="application to offer or beyond" />
        <StatCard label="Collection rate" value={`${stats.collectionRate}%`} hint={formatCurrency(stats.outstanding) + ' outstanding'} />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle as="h2">Attainment distribution</CardTitle>
          </CardHeader>
          <CardBody>
            <ColumnChart data={bands} xKey="name" series={[{ key: 'results', label: 'Published results' }]} />
            <p className="mt-3 text-xs leading-relaxed text-muted">
              A healthy distribution peaks in the 60–69 band. A peak at the pass mark itself usually
              indicates marking clustered around the boundary and is worth investigating.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h2">Enrolment by level</CardTitle>
          </CardHeader>
          <CardBody>
            {levels.length > 0 ? (
              <DonutChart data={levels} centerLabel={formatNumber(stats.students)} />
            ) : (
              <p className="text-sm text-muted">No enrolment recorded.</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h2">Admissions funnel</CardTitle>
          </CardHeader>
          <CardBody>
            <ColumnChart data={funnel} xKey="stage" series={[{ key: 'count', label: 'Applications' }]} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h2">Revenue trend</CardTitle>
          </CardHeader>
          <CardBody>
            <TrendChart data={revenue} xKey="month" series={[{ key: 'revenue', label: 'Revenue' }]} />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle as="h2">Top countries by enrolment</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          <Table>
            <caption className="sr-only">Student numbers by country</caption>
            <thead>
              <tr>
                <Th>Country</Th>
                <Th className="text-right">Students</Th>
                <Th className="text-right">Share</Th>
              </tr>
            </thead>
            <tbody>
              {byCountry.map((row) => (
                <tr key={row.country}>
                  <Td>{row.country}</Td>
                  <Td className="text-right tabular-nums">{row._count._all}</Td>
                  <Td className="text-right tabular-nums">
                    {stats.students ? `${Math.round((row._count._all / stats.students) * 100)}%` : '—'}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardBody>
      </Card>
    </>
  );
}
