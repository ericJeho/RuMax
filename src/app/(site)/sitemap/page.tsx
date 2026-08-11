import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHero } from '@/components/site/page-hero';
import { Card, CardBody } from '@/components/ui';
import { FOOTER_NAV, LEGAL_NAV, PRIMARY_NAV } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Sitemap',
  description: 'Every page on the RuMax Global Digital University website.',
  alternates: { canonical: '/sitemap' },
};

const PORTALS = [
  { label: 'Student portal', href: '/portal' },
  { label: 'Lecturer portal', href: '/lecturer' },
  { label: 'Administration', href: '/admin' },
  { label: 'Sign in', href: '/login' },
  { label: 'Create an account', href: '/register' },
  { label: 'Verify a certificate', href: '/verify' },
  { label: 'Search', href: '/search' },
];

export default function SitemapPage() {
  return (
    <>
      <PageHero
        eyebrow="Navigation"
        title="Sitemap"
        description="Every page, in one list. The machine-readable version is at /sitemap.xml."
      />

      <section className="rx-container py-14">
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {PRIMARY_NAV.map((section) => (
            <Card key={section.label}>
              <CardBody>
                <h2 className="mb-3 font-display text-lg font-semibold">{section.label}</h2>
                <ul className="space-y-2 text-sm">
                  {section.children.map((child) => (
                    <li key={child.href}>
                      <Link href={child.href} className="text-muted hover:text-brand">
                        {child.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ))}

          {FOOTER_NAV.map((section) => (
            <Card key={section.heading}>
              <CardBody>
                <h2 className="mb-3 font-display text-lg font-semibold">{section.heading}</h2>
                <ul className="space-y-2 text-sm">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-muted hover:text-brand">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ))}

          <Card>
            <CardBody>
              <h2 className="mb-3 font-display text-lg font-semibold">Portals & tools</h2>
              <ul className="space-y-2 text-sm">
                {PORTALS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-muted hover:text-brand">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h2 className="mb-3 font-display text-lg font-semibold">Legal</h2>
              <ul className="space-y-2 text-sm">
                {LEGAL_NAV.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-muted hover:text-brand">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>
      </section>
    </>
  );
}
