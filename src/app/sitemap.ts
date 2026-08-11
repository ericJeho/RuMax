import type { MetadataRoute } from 'next';

import { prisma } from '@/lib/db';
import { safeQuery } from '@/lib/queries';
import { env } from '@/lib/env';

/**
 * XML sitemap.
 *
 * Static pages carry hand-set priorities; database-driven pages are enumerated so a newly
 * published programme or news story is discoverable without waiting for a crawl to find
 * it by link. Portal and API routes are deliberately absent — they are behind
 * authentication and marked noindex besides.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  const now = new Date();

  const staticRoutes: [string, number, MetadataRoute.Sitemap[number]['changeFrequency']][] = [
    ['', 1, 'daily'],
    ['/programs', 0.95, 'weekly'],
    ['/admissions', 0.95, 'weekly'],
    ['/apply', 0.9, 'monthly'],
    ['/faculties', 0.85, 'monthly'],
    ['/schools', 0.7, 'monthly'],
    ['/online-learning', 0.8, 'monthly'],
    ['/admissions/fees', 0.8, 'monthly'],
    ['/scholarships', 0.8, 'weekly'],
    ['/international', 0.75, 'monthly'],
    ['/verify', 0.8, 'monthly'],
    ['/library', 0.7, 'weekly'],
    ['/research', 0.7, 'weekly'],
    ['/research/projects', 0.6, 'weekly'],
    ['/research/publications', 0.6, 'weekly'],
    ['/research/funding', 0.5, 'monthly'],
    ['/about', 0.7, 'monthly'],
    ['/about/history', 0.5, 'yearly'],
    ['/about/mission', 0.5, 'yearly'],
    ['/about/vice-chancellor', 0.5, 'yearly'],
    ['/about/leadership', 0.5, 'yearly'],
    ['/about/accreditation', 0.7, 'yearly'],
    ['/campus-life', 0.6, 'monthly'],
    ['/alumni', 0.6, 'monthly'],
    ['/careers', 0.7, 'weekly'],
    ['/jobs', 0.7, 'daily'],
    ['/news', 0.8, 'daily'],
    ['/blog', 0.7, 'weekly'],
    ['/events', 0.7, 'daily'],
    ['/gallery', 0.4, 'monthly'],
    ['/partners', 0.5, 'monthly'],
    ['/academic-calendar', 0.6, 'monthly'],
    ['/contact', 0.6, 'yearly'],
    ['/faqs', 0.7, 'monthly'],
    ['/support', 0.6, 'monthly'],
    ['/privacy', 0.4, 'yearly'],
    ['/terms', 0.4, 'yearly'],
    ['/cookies', 0.3, 'yearly'],
    ['/accessibility', 0.5, 'yearly'],
    ['/sitemap', 0.3, 'yearly'],
  ];

  const [programs, faculties, posts] = await Promise.all([
    safeQuery(
      'sitemap-programs',
      () => prisma.program.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
      [],
    ),
    safeQuery('sitemap-faculties', () => prisma.faculty.findMany({ select: { slug: true, updatedAt: true } }), []),
    safeQuery(
      'sitemap-posts',
      () =>
        prisma.post.findMany({
          where: { published: true },
          select: { slug: true, category: true, updatedAt: true },
        }),
      [],
    ),
  ]);

  return [
    ...staticRoutes.map(([path, priority, changeFrequency]) => ({
      url: `${base}${path}`,
      lastModified: now,
      changeFrequency,
      priority,
    })),
    ...programs.map((program) => ({
      url: `${base}/programs/${program.slug}`,
      lastModified: program.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    })),
    ...faculties.map((faculty) => ({
      url: `${base}/faculties/${faculty.slug}`,
      lastModified: faculty.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...posts.map((post) => ({
      url: `${base}/${post.category === 'BLOG' ? 'blog' : post.category === 'EVENT' ? 'events' : 'news'}/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];
}
