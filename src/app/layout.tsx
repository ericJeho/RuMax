import type { Metadata, Viewport } from 'next';

import './globals.css';
import { ThemeProvider, themeBootstrapScript } from '@/components/theme-provider';
import { AccessibilityToolbar } from '@/components/accessibility-toolbar';
import { ServiceWorkerRegistration } from '@/components/service-worker';
import { ToastProvider } from '@/components/ui/interactive';
import { SITE } from '@/lib/site';
import { env } from '@/lib/env';

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s | ${SITE.shortName}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    'online university',
    'distance learning',
    'accredited online degree',
    'masters online',
    'PhD online',
    'MOOC',
    'professional certificate',
    'RuMax',
  ],
  authors: [{ name: SITE.name }],
  creator: SITE.name,
  publisher: SITE.name,
  manifest: '/manifest.webmanifest',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: env.NEXT_PUBLIC_SITE_URL,
    locale: 'en',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    site: '@rumaxuniversity',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icon.svg' }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2c3ea8' },
    { media: '(prefers-color-scheme: dark)', color: '#090b14' },
  ],
};

/** schema.org description of the institution, emitted once on every page. */
const organisationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollegeOrUniversity',
  name: SITE.name,
  alternateName: SITE.shortName,
  url: env.NEXT_PUBLIC_SITE_URL,
  slogan: SITE.tagline,
  description: SITE.description,
  foundingDate: String(SITE.founded),
  email: SITE.email,
  telephone: SITE.phone,
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Digital Campus House, Chilomoni Ring Road',
    addressLocality: 'Blantyre',
    addressCountry: 'MW',
  },
  sameAs: Object.values(SITE.social),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Applies stored theme before first paint — see themeBootstrapScript. */}
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organisationJsonLd) }}
        />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <ThemeProvider>
          <ToastProvider>
            {children}
            <AccessibilityToolbar />
            <ServiceWorkerRegistration />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
