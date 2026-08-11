import type { Metadata } from 'next';
import { Download } from 'lucide-react';

import {
  Alert,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  PageHeader,
  StatCard,
  StatusBadge,
  Table,
  Td,
  Th,
} from '@/components/ui';
import { PaymentPanel } from './payment-panel';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatCurrency, formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Finance' };
export const dynamic = 'force-dynamic';

export default async function FinancePage() {
  const user = await requireUser();

  const [invoices, payments] = await Promise.all([
    prisma.invoice.findMany({
      where: { userId: user.id },
      include: { term: { select: { name: true } } },
      orderBy: { dueDate: 'desc' },
    }),
    prisma.payment.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } }),
  ]);

  const billed = invoices.reduce((sum, i) => sum + Number(i.amount), 0);
  const paid = invoices.reduce((sum, i) => sum + Number(i.amountPaid), 0);
  const outstanding = billed - paid;
  const overdue = invoices.filter(
    (i) => i.dueDate < new Date() && Number(i.amount) > Number(i.amountPaid),
  );

  const payable = invoices
    .filter((i) => Number(i.amount) > Number(i.amountPaid))
    .map((i) => ({
      id: i.id,
      invoiceNumber: i.invoiceNumber,
      description: i.description,
      balance: Number(i.amount) - Number(i.amountPaid),
      currency: i.currency,
    }));

  return (
    <>
      <PageHeader
        title="Finance"
        description="Invoices, payments and receipts. All amounts in the currency shown on each invoice."
      />

      {overdue.length > 0 ? (
        <Alert tone="danger" title="Overdue balance" className="mb-6">
          {overdue.length} invoice{overdue.length === 1 ? ' is' : 's are'} past the due date. Results
          may be withheld while an account is in arrears — if you cannot pay right now, contact the
          finance office and we will set up a plan rather than leaving it unresolved.
        </Alert>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total billed" value={formatCurrency(billed)} />
        <StatCard label="Total paid" value={formatCurrency(paid)} />
        <StatCard
          label="Outstanding"
          value={formatCurrency(outstanding)}
          hint={outstanding > 0 ? 'Due now' : 'Account settled'}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle as="h2">Invoices</CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              {invoices.length === 0 ? (
                <div className="p-5">
                  <EmptyState title="No invoices" description="Invoices are issued at the start of each term." />
                </div>
              ) : (
                <Table>
                  <caption className="sr-only">Your invoices</caption>
                  <thead>
                    <tr>
                      <Th>Invoice</Th>
                      <Th>Description</Th>
                      <Th>Due</Th>
                      <Th className="text-right">Amount</Th>
                      <Th className="text-right">Balance</Th>
                      <Th className="text-right">Status</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <Td className="font-mono text-xs">{invoice.invoiceNumber}</Td>
                        <Td>
                          {invoice.description}
                          {invoice.term ? (
                            <span className="block text-xs text-muted">{invoice.term.name}</span>
                          ) : null}
                        </Td>
                        <Td className="whitespace-nowrap text-xs">{formatDate(invoice.dueDate)}</Td>
                        <Td className="text-right tabular-nums">
                          {formatCurrency(Number(invoice.amount), invoice.currency)}
                        </Td>
                        <Td className="text-right tabular-nums">
                          {formatCurrency(
                            Number(invoice.amount) - Number(invoice.amountPaid),
                            invoice.currency,
                          )}
                        </Td>
                        <Td className="text-right">
                          <StatusBadge status={invoice.status} />
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle as="h2">Payment history</CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              {payments.length === 0 ? (
                <p className="p-5 text-sm text-muted">No payments recorded.</p>
              ) : (
                <Table>
                  <caption className="sr-only">Your payments</caption>
                  <thead>
                    <tr>
                      <Th>Reference</Th>
                      <Th>Method</Th>
                      <Th>Date</Th>
                      <Th className="text-right">Amount</Th>
                      <Th className="text-right">Status</Th>
                      <Th className="text-right">Receipt</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id}>
                        <Td className="font-mono text-xs">{payment.reference}</Td>
                        <Td className="capitalize">{payment.provider.replace(/_/g, ' ').toLowerCase()}</Td>
                        <Td className="whitespace-nowrap text-xs">{formatDate(payment.paidAt ?? payment.createdAt)}</Td>
                        <Td className="text-right tabular-nums">
                          {formatCurrency(Number(payment.amount), payment.currency)}
                        </Td>
                        <Td className="text-right">
                          <StatusBadge status={payment.status} />
                        </Td>
                        <Td className="text-right">
                          {payment.status === 'SUCCEEDED' ? (
                            <a
                              href={`/api/payments/${payment.id}/receipt`}
                              className="inline-flex items-center gap-1 text-xs text-brand hover:underline"
                            >
                              <Download size={12} aria-hidden />
                              PDF
                            </a>
                          ) : (
                            '—'
                          )}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <PaymentPanel invoices={payable} />

          <Card>
            <CardHeader>
              <CardTitle as="h2">Instalment plans</CardTitle>
            </CardHeader>
            <CardBody>
              <p className="text-sm leading-relaxed text-muted">
                Tuition can be split across three instalments per term at no extra cost: 40% at
                registration, 30% at mid-term, 30% before examinations. Set this up before the
                first due date — plans cannot be applied retrospectively to an overdue invoice.
              </p>
              <button className="btn-secondary mt-4 w-full text-sm">Request an instalment plan</button>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle as="h2">Refunds</CardTitle>
            </CardHeader>
            <CardBody>
              <p className="text-sm leading-relaxed text-muted">
                Withdraw within 14 days of a term starting for a full refund, or up to week four for
                50%. After week four no refund is due. Refunds return to the original payment
                method within 10 working days.
              </p>
              <button className="btn-secondary mt-4 w-full text-sm">Request a refund</button>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
