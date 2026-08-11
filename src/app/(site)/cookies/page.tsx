import type { Metadata } from 'next';

import { PageHero } from '@/components/site/page-hero';
import { Card, CardBody, Table, Td, Th } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Cookie policy',
  description: 'Every cookie and local storage key RuMax sets, what it does, and how long it lasts.',
  alternates: { canonical: '/cookies' },
};

const COOKIES = [
  ['rumax_session', 'Cookie', 'Keeps you signed in. httpOnly, so scripts cannot read it.', 'Strictly necessary', '12 hours'],
  ['rumax_lang', 'Cookie', 'Remembers your chosen language so server-rendered pages match it.', 'Functional', '1 year'],
  ['rumax:prefs', 'Local storage', 'Theme, text size and high-contrast preference.', 'Functional', 'Until cleared'],
  ['rumax:draft:*', 'Local storage', 'Unsaved assignment drafts, so a dropped connection does not lose your work.', 'Functional', 'Until submitted'],
  ['rumax:application-draft', 'Local storage', 'Your in-progress application form.', 'Functional', 'Until submitted'],
];

export default function CookiesPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Cookie policy"
        description="We set five things, all of them functional. There is no advertising or cross-site tracking on this platform, which is why you have not seen a consent banner."
      />

      <section className="rx-container py-14">
        <Card className="mx-auto max-w-4xl">
          <CardBody className="p-0">
            <Table>
              <caption className="sr-only">Cookies and local storage used by this site</caption>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Type</Th>
                  <Th>Purpose</Th>
                  <Th>Category</Th>
                  <Th>Lifetime</Th>
                </tr>
              </thead>
              <tbody>
                {COOKIES.map(([name, type, purpose, category, lifetime]) => (
                  <tr key={name}>
                    <Td className="font-mono text-xs">{name}</Td>
                    <Td className="text-xs">{type}</Td>
                    <Td className="text-sm">{purpose}</Td>
                    <Td className="text-xs">{category}</Td>
                    <Td className="text-xs">{lifetime}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardBody>
        </Card>

        <div className="prose-rx mx-auto mt-10 max-w-3xl">
          <h2>Why there is no consent banner</h2>
          <p>
            Consent is required for cookies that are not strictly necessary or purely functional. We
            set none of those. Blocking the functional ones will not break the site — you will simply
            be signed out sooner and lose your accessibility preferences between visits.
          </p>
          <h2>Third parties</h2>
          <p>
            Payment providers set their own cookies on their own checkout pages, and video
            conferencing providers set cookies when you join a live session on their platform. Those
            are governed by their policies, which we link to at the point you are handed over.
          </p>
        </div>
      </section>
    </>
  );
}
