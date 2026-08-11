import type { Metadata } from 'next';

import { Badge, Card, CardBody, PageHeader, StatCard, Table, Td, Th } from '@/components/ui';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { calculateCgpa } from '@/lib/grading';
import { formatCurrency, formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Students' };
export const dynamic = 'force-dynamic';

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireRole('ADMIN', 'REGISTRAR', 'FINANCE');
  const { q } = await searchParams;

  const students = await prisma.user.findMany({
    where: {
      role: { in: ['STUDENT', 'ALUMNI'] },
      ...(q
        ? {
            OR: [
              { firstName: { contains: q, mode: 'insensitive' } },
              { lastName: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
              { studentNumber: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    include: {
      program: { select: { title: true, code: true } },
      grades: { where: { published: true }, select: { score: true, credits: true } },
      invoices: { select: { amount: true, amountPaid: true } },
    },
    orderBy: [{ status: 'asc' }, { lastName: 'asc' }],
    take: 200,
  });

  const active = students.filter((student) => student.status === 'ACTIVE').length;
  const graduated = students.filter((student) => student.status === 'GRADUATED').length;
  const owing = students.filter((student) =>
    student.invoices.some((invoice) => Number(invoice.amount) > Number(invoice.amountPaid)),
  ).length;

  return (
    <>
      <PageHeader
        title="Student management"
        description="The student register. Search by name, email or student number."
      />

      <form className="mb-6" role="search">
        <label htmlFor="q" className="sr-only">
          Search students
        </label>
        <input
          id="q"
          name="q"
          defaultValue={q}
          placeholder="Search by name, email or student number"
          className="input max-w-md"
        />
      </form>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <StatCard label="Shown" value={students.length} hint="max 200 per page" />
        <StatCard label="Active" value={active} />
        <StatCard label="Graduated" value={graduated} />
        <StatCard label="With a balance" value={owing} />
      </div>

      <Card>
        <CardBody className="p-0">
          <Table>
            <caption className="sr-only">Student register</caption>
            <thead>
              <tr>
                <Th>Student</Th>
                <Th>Programme</Th>
                <Th className="text-right">Year</Th>
                <Th className="text-right">CGPA</Th>
                <Th className="text-right">Balance</Th>
                <Th>Admitted</Th>
                <Th className="text-right">Status</Th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const cgpa = calculateCgpa(student.grades.map((g) => ({ credits: g.credits, score: g.score })));
                const balance = student.invoices.reduce(
                  (sum, invoice) => sum + Number(invoice.amount) - Number(invoice.amountPaid),
                  0,
                );

                return (
                  <tr key={student.id}>
                    <Td>
                      <span className="block font-medium">
                        {student.firstName} {student.lastName}
                      </span>
                      <span className="block font-mono text-xs text-muted">{student.studentNumber}</span>
                      <span className="block text-xs text-muted">{student.email}</span>
                    </Td>
                    <Td className="text-xs">{student.program?.title ?? '—'}</Td>
                    <Td className="text-right tabular-nums">{student.yearOfStudy ?? '—'}</Td>
                    <Td className="text-right tabular-nums">{cgpa > 0 ? cgpa.toFixed(2) : '—'}</Td>
                    <Td className="text-right tabular-nums">
                      {balance > 0 ? (
                        <span className="text-danger">{formatCurrency(balance)}</span>
                      ) : (
                        formatCurrency(0)
                      )}
                    </Td>
                    <Td className="whitespace-nowrap text-xs">{formatDate(student.admittedAt)}</Td>
                    <Td className="text-right">
                      <Badge
                        tone={
                          student.status === 'ACTIVE'
                            ? 'success'
                            : student.status === 'GRADUATED'
                              ? 'brand'
                              : 'warning'
                        }
                      >
                        {student.status.toLowerCase()}
                      </Badge>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </CardBody>
      </Card>
    </>
  );
}
