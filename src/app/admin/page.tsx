import type { Metadata } from 'next';
import Link from 'next/link';
import { Banknote, GraduationCap, TrendingUp, UserCheck, Users } from 'lucide-react';

import {
  Badge,
  ButtonLink,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  PageHeader,
  StatCard,
  Table,
  Td,
  Th,
} from '@/components/ui';
import { ColumnChart, DonutChart, TrendChart } from '@/components/charts';
import { requireRole } from '@/lib/auth';
import {
  getAdmissionsFunnel,
  getEnrolmentByLevel,
  getInstitutionalStats,
  getPaymentMix,
  getRetentionRisk,
  getRevenueTrend,
} from '@/lib/admin';
import { formatCompact, formatCurrency, formatNumber } from '@/lib/format';

export const metadata: Metadata = { title: 'Administration' };
export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const user = await requireRole('ADMIN', 'REGISTRAR', 'FINANCE');

  const [stats, funnel, levels, revenue, mix, risk] = await Promise.all([
    getInstitutionalStats(),
    getAdmissionsFunnel(),
    getEnrolmentByLevel(),
    getRevenueTrend(),
    getPaymentMix(),
    user.role === 'FINANCE' ? Promise.resolve([]) : getRetentionRisk(10),
  ]);

  return (
    <>
      <PageHeader
        title="University overview"
        description="Live institutional figures. These are the numbers the University Council governs by."
        actions={
          <ButtonLink href="/admin/reports" variant="secondary">
            Generate report
          </ButtonLink>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Enrolled students"
          value={formatNumber(stats.students)}
          hint={`${formatNumber(stats.newStudents)} admitted this year`}
          icon={<Users size={18} aria-hidden />}
          trend={{ direction: 'up', value: `${stats.countries} countries represented` }}
        />
        <StatCard
          label="Revenue collected"
          value={formatCurrency(stats.revenue)}
          hint={`${stats.collectionRate}% of billed tuition`}
          icon={<Banknote size={18} aria-hidden />}
        />
        <StatCard
          label="Applications"
          value={formatNumber(stats.applications)}
          hint={`${stats.conversionRate}% reach offer or beyond`}
          icon={<UserCheck size={18} aria-hidden />}
        />
        <StatCard
          label="Graduates"
          value={formatNumber(stats.graduates)}
          hint={`${stats.programs} programmes · ${stats.courses} courses`}
          icon={<GraduationCap size={18} aria-hidden />}
        />
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle as="h2">Revenue, last 12 months</CardTitle>
            <TrendingUp size={16} className="text-muted" aria-hidden />
          </CardHeader>
          <CardBody>
            <TrendChart data={revenue} xKey="month" series={[{ key: 'revenue', label: 'Revenue' }]} />
            <dl className="mt-4 grid grid-cols-3 gap-4 border-t border-border pt-4 text-sm">
              <div>
                <dt className="text-muted">Billed</dt>
                <dd className="font-display text-lg font-semibold">{formatCompact(stats.billed)}</dd>
              </div>
              <div>
                <dt className="text-muted">Collected</dt>
                <dd className="font-display text-lg font-semibold text-success">
                  {formatCompact(stats.collected)}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Outstanding</dt>
                <dd className="font-display text-lg font-semibold text-warning">
                  {formatCompact(stats.outstanding)}
                </dd>
              </div>
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h2">Payment methods</CardTitle>
          </CardHeader>
          <CardBody>
            {mix.length > 0 ? (
              <>
                <DonutChart data={mix.map(({ name, value }) => ({ name, value }))} />
                <Table className="mt-2">
                  <caption className="sr-only">Payment volume by method</caption>
                  <thead>
                    <tr>
                      <Th>Method</Th>
                      <Th className="text-right">Payments</Th>
                      <Th className="text-right">Value</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {mix.map((row) => (
                      <tr key={row.name}>
                        <Td className="capitalize">{row.name}</Td>
                        <Td className="text-right tabular-nums">{row.count}</Td>
                        <Td className="text-right tabular-nums">{formatCompact(row.value)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </>
            ) : (
              <p className="text-sm text-muted">No payments recorded.</p>
            )}
          </CardBody>
        </Card>
      </div>

      {user.role !== 'FINANCE' ? (
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle as="h2">Admissions funnel</CardTitle>
              <Link href="/admin/admissions" className="text-sm text-brand hover:underline">
                Review applications
              </Link>
            </CardHeader>
            <CardBody>
              <ColumnChart
                data={funnel}
                xKey="stage"
                series={[{ key: 'count', label: 'Applications' }]}
              />
              <p className="mt-3 text-xs leading-relaxed text-muted">
                The steepest drop is where to focus. A large gap between offer and acceptance
                usually means fees or visa uncertainty rather than a change of mind.
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
        </div>
      ) : null}

      {risk.length > 0 ? (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle as="h2">Retention risk</CardTitle>
            <Badge tone="warning">{risk.length} students</Badge>
          </CardHeader>
          <CardBody className="p-0">
            <Table>
              <caption className="sr-only">Students flagged as at risk of withdrawing</caption>
              <thead>
                <tr>
                  <Th>Student</Th>
                  <Th>Programme</Th>
                  <Th className="text-right">Average</Th>
                  <Th>Why flagged</Th>
                </tr>
              </thead>
              <tbody>
                {risk.map((student) => (
                  <tr key={student.id}>
                    <Td>
                      <span className="block font-medium">{student.name}</span>
                      <span className="block font-mono text-xs text-muted">{student.studentNumber}</span>
                    </Td>
                    <Td className="text-xs">{student.program}</Td>
                    <Td className="text-right tabular-nums">
                      {student.average !== null ? `${student.average.toFixed(0)}%` : '—'}
                    </Td>
                    <Td>
                      <span className="flex flex-wrap gap-1">
                        {student.reasons.map((reason) => (
                          <Badge key={reason} tone="warning">
                            {reason}
                          </Badge>
                        ))}
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <p className="border-t border-border px-4 py-3 text-xs leading-relaxed text-muted">
              Flags are rule-based and explainable, never a black-box score: a student is listed
              only when two or more concrete conditions hold, and the conditions are shown so the
              retention team can judge for themselves.
            </p>
          </CardBody>
        </Card>
      ) : null}
    </>
  );
}
