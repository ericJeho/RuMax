import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHero } from '@/components/site/page-hero';
import { Badge, Card, EmptyState } from '@/components/ui';
import { getLatestPosts } from '@/lib/queries';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Voices from RuMax — students, lecturers and the people who build the platform.',
  alternates: { canonical: '/blog' },
};

export const revalidate = 300;

export default async function BlogPage() {
  const posts = await getLatestPosts('BLOG', 30);

  return (
    <>
      <PageHero eyebrow="Blog" title="Voices from RuMax" description="Students, lecturers and the people who build the platform, writing about the work." />

      <section className="rx-container py-14">
        {posts.length === 0 ? (
          <EmptyState title="No posts yet" description="Published posts will appear here." />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => (
              <Card key={post.id} hover className="flex h-full flex-col p-6">
                <p className="mb-2 text-xs text-muted">{formatDate(post.publishedAt)}</p>
                <h2 className="font-display text-lg font-semibold leading-snug">
                  <Link href={`/blog/${post.slug}`} className="hover:text-brand">
                    {post.title}
                  </Link>
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{post.excerpt}</p>
                <p className="mt-4 flex flex-wrap gap-1.5 border-t border-border pt-3">
                  {post.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </p>
              </Card>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
