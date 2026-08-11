import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHero } from '@/components/site/page-hero';
import { Badge, Card, CardBody, EmptyState } from '@/components/ui';
import { SearchBox } from './search-box';
import { prisma } from '@/lib/db';
import { safeQuery } from '@/lib/queries';
import { truncate } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search programmes, courses, faculties, news, library items and research across RuMax.',
  alternates: { canonical: '/search' },
};

export const dynamic = 'force-dynamic';

/**
 * Global search.
 *
 * A federated query across the six content types visitors actually look for, rather than
 * a single blended relevance list — someone searching "machine learning" wants to know
 * whether we teach a programme in it, and burying that under a news article is unhelpful.
 * A dedicated search index (docs/SEARCH.md) replaces these ILIKE queries at scale.
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? '';
  const like = { contains: query, mode: 'insensitive' as const };

  const [programs, courses, faculties, posts, library, research] = query
    ? await Promise.all([
        safeQuery(
          'search-programs',
          () =>
            prisma.program.findMany({
              where: { published: true, OR: [{ title: like }, { summary: like }, { code: like }] },
              select: { slug: true, title: true, summary: true, level: true },
              take: 8,
            }),
          [],
        ),
        safeQuery(
          'search-courses',
          () =>
            prisma.course.findMany({
              where: { published: true, OR: [{ title: like }, { description: like }, { code: like }] },
              select: { slug: true, code: true, title: true, description: true },
              take: 8,
            }),
          [],
        ),
        safeQuery(
          'search-faculties',
          () =>
            prisma.faculty.findMany({
              where: { OR: [{ name: like }, { description: like }] },
              select: { slug: true, name: true, description: true },
              take: 5,
            }),
          [],
        ),
        safeQuery(
          'search-posts',
          () =>
            prisma.post.findMany({
              where: { published: true, OR: [{ title: like }, { excerpt: like }, { body: like }] },
              select: { slug: true, title: true, excerpt: true, category: true },
              take: 8,
            }),
          [],
        ),
        safeQuery(
          'search-library',
          () =>
            prisma.libraryItem.findMany({
              where: { OR: [{ title: like }, { abstract: like }] },
              select: { slug: true, title: true, abstract: true, type: true },
              take: 6,
            }),
          [],
        ),
        safeQuery(
          'search-research',
          () =>
            prisma.researchProject.findMany({
              where: { OR: [{ title: like }, { abstract: like }] },
              select: { slug: true, title: true, abstract: true },
              take: 5,
            }),
          [],
        ),
      ])
    : [[], [], [], [], [], []];

  const total = programs.length + courses.length + faculties.length + posts.length + library.length + research.length;

  return (
    <>
      <PageHero eyebrow="Search" title="Search RuMax" description="Programmes, courses, faculties, news, library and research.">
        <SearchBox initialQuery={query} />
      </PageHero>

      <section className="rx-container py-14">
        {!query ? (
          <EmptyState
            title="What are you looking for?"
            description="Try a subject, a course code, a programme name or a research topic."
          />
        ) : total === 0 ? (
          <EmptyState
            title={`Nothing matched “${query}”`}
            description="Try a broader term, or browse the programme catalogue directly."
          />
        ) : (
          <div className="mx-auto max-w-3xl space-y-10">
            <p className="text-sm text-muted" aria-live="polite">
              {total} result{total === 1 ? '' : 's'} for “{query}”
            </p>

            <Group title="Programmes" items={programs.map((p) => ({
              href: `/programs/${p.slug}`,
              title: p.title,
              body: p.summary,
              tag: p.level.replace(/_/g, ' ').toLowerCase(),
            }))} />

            <Group title="Courses" items={courses.map((c) => ({
              href: `/programs`,
              title: `${c.code} ${c.title}`,
              body: c.description,
              tag: 'course',
            }))} />

            <Group title="Faculties" items={faculties.map((f) => ({
              href: `/faculties/${f.slug}`,
              title: f.name,
              body: f.description,
              tag: 'faculty',
            }))} />

            <Group title="News & blog" items={posts.map((p) => ({
              href: `/${p.category === 'BLOG' ? 'blog' : p.category === 'EVENT' ? 'events' : 'news'}/${p.slug}`,
              title: p.title,
              body: p.excerpt,
              tag: p.category.toLowerCase(),
            }))} />

            <Group title="Library" items={library.map((l) => ({
              href: '/library',
              title: l.title,
              body: l.abstract ?? '',
              tag: l.type.replace(/_/g, ' ').toLowerCase(),
            }))} />

            <Group title="Research" items={research.map((r) => ({
              href: '/research/projects',
              title: r.title,
              body: r.abstract,
              tag: 'research',
            }))} />
          </div>
        )}
      </section>
    </>
  );
}

function Group({
  title,
  items,
}: {
  title: string;
  items: { href: string; title: string; body: string; tag: string }[];
}) {
  if (items.length === 0) return null;

  return (
    <div>
      <h2 className="mb-3 font-display text-lg font-semibold">
        {title} <span className="text-sm font-normal text-muted">({items.length})</span>
      </h2>
      <div className="space-y-3">
        {items.map((item) => (
          <Card key={`${item.href}-${item.title}`} hover>
            <CardBody>
              <p className="mb-1">
                <Badge>{item.tag}</Badge>
              </p>
              <h3 className="font-medium">
                <Link href={item.href} className="hover:text-brand">
                  {item.title}
                </Link>
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{truncate(item.body, 170)}</p>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
