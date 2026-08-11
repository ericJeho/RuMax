import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHero } from '@/components/site/page-hero';
import { Badge, Card, EmptyState } from '@/components/ui';
import { getLatestPosts } from '@/lib/queries';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = {
  title: 'News',
  description: 'News from RuMax Global Digital University.',
  alternates: { canonical: '/news' },
};

export const revalidate = 300;

export default async function NewsPage() {
  const posts = await getLatestPosts('NEWS', 30);

  return (
    <>
      <PageHero eyebrow="Newsroom" title="News" description="Announcements, results and reporting from across the university." />

      <section className="rx-container py-14">
        {posts.length === 0 ? (
          <EmptyState title="No news yet" description="Published stories will appear here." />
        ) : (
          <div className="mx-auto max-w-3xl space-y-5">
            {posts.map((post) => (
              <Card key={post.id} hover className="p-6">
                <p className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                  <time dateTime={post.publishedAt.toISOString()}>{formatDate(post.publishedAt)}</time>
                  {post.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </p>
                <h2 className="font-display text-xl font-semibold leading-snug">
                  <Link href={`/news/${post.slug}`} className="hover:text-brand">
                    {post.title}
                  </Link>
                </h2>
                <p className="mt-2 leading-relaxed text-muted">{post.excerpt}</p>
              </Card>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
