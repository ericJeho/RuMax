import type { Metadata } from 'next';

import { Card, CardBody, PageHeader, StatCard } from '@/components/ui';
import { LibraryBrowser } from '@/components/library-browser';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Digital library' };
export const dynamic = 'force-dynamic';

export default async function PortalLibraryPage() {
  const user = await requireUser();

  const [items, loans] = await Promise.all([
    prisma.libraryItem.findMany({ orderBy: { title: 'asc' }, take: 200 }),
    prisma.libraryLoan.findMany({
      where: { userId: user.id, returnedAt: null },
      include: { item: { select: { title: true } } },
      orderBy: { dueAt: 'asc' },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Digital library"
        description="Books, journals, past papers and research. Everything downloadable for offline study."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Items in this view" value={items.length} hint="of 2.4m in the full catalogue" />
        <StatCard label="On loan to you" value={loans.length} />
        <StatCard
          label="Next due"
          value={loans[0] ? formatDate(loans[0].dueAt) : '—'}
          hint={loans[0]?.item.title}
        />
      </div>

      {loans.length > 0 ? (
        <Card className="mb-6">
          <CardBody>
            <h2 className="mb-3 font-display text-base font-semibold">Your loans</h2>
            <ul className="space-y-2 text-sm">
              {loans.map((loan) => (
                <li key={loan.id} className="flex items-center justify-between gap-3">
                  <span>{loan.item.title}</span>
                  <span className="text-xs text-muted">Due {formatDate(loan.dueAt)}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      ) : null}

      <LibraryBrowser
        canBorrow
        items={items.map((item) => ({
          id: item.id,
          slug: item.slug,
          title: item.title,
          authors: item.authors,
          type: item.type,
          year: item.year,
          publisher: item.publisher,
          subjects: item.subjects,
          abstract: item.abstract,
          available: item.available,
          copies: item.copies,
          downloadable: item.downloadable,
          doi: item.doi,
        }))}
      />
    </>
  );
}
