import type { Metadata } from 'next';

import { Card, CardBody, CardHeader, CardTitle, PageHeader, StatCard, StatusBadge, Table, Td, Th } from '@/components/ui';
import { DonutChart, TrendChart } from '@/components/charts';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getInstitutionalStats, getPaymentMix, getRevenueTrend } from '@/lib/admin';
import { formatCurrency, formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Finance' };
export const dynamic = 'force-dynamic';

export default async function AdminFinancePage() {
  await requireRole('ADMIN', 'FINANCE', 'REGISTRAR');

  const [stats, revenue, mix, overdue, recent] = await Promise.all([
    getInstitutionalStats(),
    getRevenueTrend(),
    getPaymentMix(),
    prisma.invoice.findMany({
      where: { dueDate: { lt: new Date() }, status: { in: ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'] } },
      include: { user: { select: { firstName: true, lastName: true, studentNumber: true, email: true } } },
      orderBy: { dueDate: 'asc' },
      take: 40,
    }),
    prisma.payment.findMany({
      include: { user: { select: { firstName: true, lastName: true, studentNumber: true } } },
      orderBy: { createdAt: 'desc' },
      take: 25,
    }),
  ]);

  const arrears = overdue.reduce(
    (sum, invoice) => sum + Number(invoice.amount) - Number(invoice.amountPaid),
    0,
  );

  return (
    <>
      <PageHeader
        title="Finance"
        description="Tuition billed, collected and outstanding, plus the arrears list the finance office works from."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Billed" value={formatCurrency(stats.billed)} />
        <StatCard label="Collected" value={formatCurrency(stats.collected)} hint={`${stats.collectionRate}% collection rate`} />
        <StatCard label="Outstanding" value={formatCurrency(stats.outstanding)} />
        <StatCard label="In arrears" value={formatCurrency(arrears)} hint={`${overdue.length} overdue invoices`} />
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle as="h2">Revenue, last 12 months</CardTitle>
          </CardHeader>
          <CardBody>
            <TrendChart data={revenue} xKey="month" series={[{ key: 'revenue', label: 'Revenue' }]} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h2">Method mix</CardTitle>
          </CardHeader>
          <CardBody>
            {mix.length > 0 ? (
              <DonutChart data={mix.map(({ name, value }) => ({ name, value }))} />
            ) : (
              <p className="text-sm text-muted">No payments recorded.</p>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle as="h2">Overdue accounts</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            <Table>
              <caption className="sr-only">Overdue invoices</caption>
              <thead>
                <tr>
                  <Th>Student</Th>
                  <Th>Invoice</Th>
                  <Th>Due</Th>
                  <Th className="text-right">Balance</Th>
                </tr>
              </thead>
              <tbody>
                {overdue.map((invoice) => (
                  <tr key={invoice.id}>
                    <Td>
                      <span className="block font-medium">
                        {invoice.user.firstName} {invoice.user.lastName}
                      </span>
                      <span className="block font-mono text-xs text-muted">{invoice.user.studentNumber}</span>
                    </Td>
                    <Td className="font-mono text-xs">{invoice.invoiceNumber}</Td>
                    <Td className="whitespace-nowrap text-xs">{formatDate(invoice.dueDate)}</Td>
                    <Td className="text-right tabular-nums text-danger">
                      {formatCurrency(Number(invoice.amount) - Number(invoice.amountPaid), invoice.currency)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {overdue.length === 0 ? <p className="p-5 text-sm text-muted">No overdue accounts.</p> : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h2">Recent payments</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            <Table>
              <caption className="sr-only">Recent payments</caption>
              <thead>
                <tr>
                  <Th>Reference</Th>
                  <Th>Student</Th>
                  <Th>Method</Th>
                  <Th className="text-right">Amount</Th>
                  <Th className="text-right">Status</Th>
                </tr>
              </thead>
              <tbody>
                {recent.map((payment) => (
                  <tr key={payment.id}>
                    <Td className="font-mono text-xs">{payment.reference}</Td>
                    <Td className="text-xs">
                      {payment.user.firstName} {payment.user.lastName}
                    </Td>
                    <Td className="text-xs capitalize">{payment.provider.replace(/_/g, ' ').toLowerCase()}</Td>
                    <Td className="text-right tabular-nums">
                      {formatCurrency(Number(payment.amount), payment.currency)}
                    </Td>
                    <Td className="text-right">
                      <StatusBadge status={payment.status} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
