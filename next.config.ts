import type { NextConfig } from 'next';

/**
 * Security headers applied to every response. These cover the OWASP secure-header
 * baseline that the platform is audited against (see docs/SECURITY.md).
 */
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Next.js injects inline bootstrap scripts; styles are emitted inline by Tailwind's runtime layer.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Standalone tracing exists for the container image, which copies `.next/standalone`
  // and runs its generated server.js. It is the wrong output everywhere else: Vercel and
  // similar platforms detect the framework and do their own bundling, and Next's own docs
  // say standalone is not needed there. Producing it anyway means every other build emits
  // an artefact nothing consumes. The Dockerfile sets BUILD_STANDALONE=1; nothing else does.
  output: process.env.BUILD_STANDALONE === '1' ? 'standalone' : undefined,
  images: {
    formats: ['image/avif', 'image/webp'],
    // No remote hosts are allow-listed, deliberately. Next serves the /_next/image
    // optimiser whether or not the application imports next/image, so a wildcard pattern
    // here turns that endpoint into an open image proxy: anyone can make the server fetch
    // an arbitrary URL and decode it through sharp/libvips. Nothing here loads a remote
    // image through next/image — avatars use a plain <img> — so the correct list is
    // empty. Add specific hosts if a component ever genuinely needs one.
    remotePatterns: [],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion'],
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        source: '/sw.js',
        headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }],
      },
    ];
  },
};

export default nextConfig;
