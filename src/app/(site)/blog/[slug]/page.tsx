import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PageHero } from '@/components/site/page-hero';
import { Badge } from '@/components/ui';
import { prisma } from '@/lib/db';
import { safeQuery } from '@/lib/queries';
import { formatDate } from '@/lib/format';
import { env } from '@/lib/env';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await safeQuery(
    'post-meta',
    () => prisma.post.findUnique({ where: { slug }, select: { title: true, excerpt: true, publishedAt: true } }),
    null,
  );
  if (!post) return { title: 'Not found' };
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/news/${slug}` },
    openGraph: { title: post.title, description: post.excerpt, type: 'article', publishedTime: post.publishedAt.toISOString() },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const post = await safeQuery('post-detail', () => prisma.post.findUnique({ where: { slug } }), null);
  if (!post || !post.published) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt.toISOString(),
    author: { '@type': 'Organization', name: post.authorName },
    publisher: { '@type': 'Organization', name: 'RuMax Global Digital University', url: env.NEXT_PUBLIC_SITE_URL },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <PageHero
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: post.category === 'BLOG' ? 'Blog' : 'News', href: post.category === 'BLOG' ? '/blog' : '/news' },
          { label: post.title },
        ]}
        eyebrow={formatDate(post.publishedAt)}
        title={post.title}
        description={post.excerpt}
      />

      <article className="rx-container py-14">
        <div className="prose-rx mx-auto max-w-3xl">
          {post.body.split('\n\n').map((block, index) =>
            block.startsWith('## ') ? (
              <h2 key={index}>{block.replace('## ', '')}</h2>
            ) : (
              <p key={index}>{block}</p>
            ),
          )}
        </div>

        <div className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center gap-2 border-t border-border pt-6">
          <span className="text-xs text-muted">Filed under</span>
          {post.tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
          <Link href="/news" className="ml-auto text-sm text-brand hover:underline">
            ← All news
          </Link>
        </div>
      </article>
    </>
  );
}
