import type { Metadata } from 'next';

import { PageHero } from '@/components/site/page-hero';
import { LibraryBrowser } from '@/components/library-browser';
import { StatCard } from '@/components/ui';
import { prisma } from '@/lib/db';
import { safeQuery } from '@/lib/queries';
import { getSessionClaims } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Digital library',
  description: 'Books, ebooks, journals, research papers, past papers and audiobooks — searchable, downloadable, with a built-in citation generator.',
  alternates: { canonical: '/library' },
};

export const dynamic = 'force-dynamic';

export default async function LibraryPage() {
  const [items, claims] = await Promise.all([
    safeQuery('library', () => prisma.libraryItem.findMany({ orderBy: { title: 'asc' }, take: 200 }), []),
    getSessionClaims(),
  ]);

  return (
    <>
      <PageHero
        eyebrow="Resources"
        title="Digital library"
        description="2.4 million items, open to every registered student and to the public for anything we can license openly. Everything downloadable for offline study."
      />

      <section className="rx-container py-14">
        <div className="mb-8 grid gap-4 sm:grid-cols-4">
          <StatCard label="Items in catalogue" value="2.4m" />
          <StatCard label="Open access" value="880k" hint="free to anyone" />
          <StatCard label="Past papers" value="12k" hint="by course code" />
          <StatCard label="Offline capable" value="Yes" hint="download and read without a connection" />
        </div>

        <LibraryBrowser
          canBorrow={Boolean(claims)}
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
      </section>
    </>
  );
}
