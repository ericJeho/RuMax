import type { MetadataRoute } from 'next';

import { env } from '@/lib/env';

/**
 * robots.txt.
 *
 * The portals are disallowed because they contain student records and would be useless in
 * a search index anyway. `/verify` is explicitly allowed: employers finding the
 * verification portal through a search engine is exactly what we want.
 */
export default function robots(): MetadataRoute.Robots {
  const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/verify'],
        disallow: ['/portal/', '/lecturer/', '/admin/', '/api/', '/login', '/register', '/apply/status'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
