import type { Metadata } from 'next';

import { Card, CardBody, PageHeader, StatCard, Table, Td, Th } from '@/components/ui';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Library management' };
export const dynamic = 'force-dynamic';

export default async function AdminLibraryPage() {
  await requireRole('ADMIN', 'REGISTRAR');

  const [items, loans, overdue] = await Promise.all([
    prisma.libraryItem.findMany({ orderBy: { title: 'asc' }, take: 200 }),
    prisma.libraryLoan.count({ where: { returnedAt: null } }),
    prisma.libraryLoan.findMany({
      where: { returnedAt: null, dueAt: { lt: new Date() } },
      include: {
        item: { select: { title: true } },
        user: { select: { firstName: true, lastName: true, studentNumber: true } },
      },
      orderBy: { dueAt: 'asc' },
      take: 30,
    }),
  ]);

  return (
    <>
      <PageHeader title="Library management" description="Catalogue, loans and overdue items." />

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <StatCard label="Catalogue (this view)" value={items.length} hint="of 2.4m items" />
        <StatCard label="On loan" value={loans} />
        <StatCard label="Overdue" value={overdue.length} />
        <StatCard label="Downloadable" value={items.filter((item) => item.downloadable).length} />
      </div>

      {overdue.length > 0 ? (
        <Card className="mb-6">
          <CardBody className="p-0">
            <Table>
              <caption className="sr-only">Overdue loans</caption>
              <thead>
                <tr>
                  <Th>Item</Th>
                  <Th>Borrower</Th>
                  <Th>Due</Th>
                </tr>
              </thead>
              <tbody>
                {overdue.map((loan) => (
                  <tr key={loan.id}>
                    <Td>{loan.item.title}</Td>
                    <Td>
                      <span className="block">
                        {loan.user.firstName} {loan.user.lastName}
                      </span>
                      <span className="block font-mono text-xs text-muted">{loan.user.studentNumber}</span>
                    </Td>
                    <Td className="whitespace-nowrap text-xs text-danger">{formatDate(loan.dueAt)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardBody className="p-0">
          <Table>
            <caption className="sr-only">Library catalogue</caption>
            <thead>
              <tr>
                <Th>Title</Th>
                <Th>Authors</Th>
                <Th>Type</Th>
                <Th className="text-right">Year</Th>
                <Th className="text-right">Copies</Th>
                <Th className="text-right">Available</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <Td className="font-medium">{item.title}</Td>
                  <Td className="text-xs text-muted">{item.authors.join(', ')}</Td>
                  <Td className="text-xs capitalize">{item.type.replace(/_/g, ' ').toLowerCase()}</Td>
                  <Td className="text-right tabular-nums">{item.year ?? '—'}</Td>
                  <Td className="text-right tabular-nums">{item.copies}</Td>
                  <Td className="text-right tabular-nums">{item.available}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardBody>
      </Card>
    </>
  );
}
