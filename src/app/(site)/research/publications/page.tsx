import type { Metadata } from 'next';

import { PageHero } from '@/components/site/page-hero';
import { Card, CardBody, EmptyState, StatCard, Table, Td, Th } from '@/components/ui';
import { prisma } from '@/lib/db';
import { safeQuery } from '@/lib/queries';

export const metadata: Metadata = {
  title: 'Publications',
  description: 'The open-access publication record of RuMax Global Digital University.',
  alternates: { canonical: '/research/publications' },
};

export const revalidate = 600;

export default async function PublicationsPage() {
  const publications = await safeQuery(
    'publications',
    () =>
      prisma.publication.findMany({
        include: { author: { select: { firstName: true, lastName: true } } },
        orderBy: [{ year: 'desc' }, { citations: 'desc' }],
        take: 100,
      }),
    [],
  );

  const citations = publications.reduce((sum, publication) => sum + publication.citations, 0);

  return (
    <>
      <PageHero
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Research', href: '/research' }, { label: 'Publications' }]}
        eyebrow="Research"
        title="Publications"
        description="Everything we publish is open access and deposited in the repository on the day of acceptance. ORCID and CrossRef keep this list in step with the public record."
      />

      <section className="rx-container py-14">
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <StatCard label="Publications" value={publications.length} />
          <StatCard label="Citations" value={citations} />
          <StatCard label="Open access" value="100%" />
        </div>

        {publications.length === 0 ? (
          <EmptyState title="No publications" description="Deposited papers will appear here." />
        ) : (
          <Card>
            <CardBody className="p-0">
              <Table>
                <caption className="sr-only">Publication record</caption>
                <thead>
                  <tr>
                    <Th>Title</Th>
                    <Th>Author</Th>
                    <Th>Venue</Th>
                    <Th className="text-right">Year</Th>
                    <Th className="text-right">Citations</Th>
                    <Th>DOI</Th>
                  </tr>
                </thead>
                <tbody>
                  {publications.map((publication) => (
                    <tr key={publication.id}>
                      <Td className="font-medium">{publication.title}</Td>
                      <Td className="text-xs">
                        {publication.author
                          ? `${publication.author.firstName} ${publication.author.lastName}`
                          : '—'}
                      </Td>
                      <Td className="text-xs text-muted">{publication.journal ?? 'Preprint'}</Td>
                      <Td className="text-right tabular-nums">{publication.year}</Td>
                      <Td className="text-right tabular-nums">{publication.citations}</Td>
                      <Td className="font-mono text-xs text-muted">{publication.doi ?? '—'}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </CardBody>
          </Card>
        )}
      </section>
    </>
  );
}
