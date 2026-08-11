import type { Metadata } from 'next';
import { Mail, MapPin, Phone } from 'lucide-react';

import { PageHero } from '@/components/site/page-hero';
import { Card, CardBody } from '@/components/ui';
import { ContactForm } from './contact-form';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contact RuMax Global Digital University — admissions, student support, finance and media.',
  alternates: { canonical: '/contact' },
};

const DESKS = [
  ['Admissions', 'admissions@rumax.edu', 'Applications, entry requirements, offers', 'within 1 working day'],
  ['Student support', 'support@rumax.edu', 'Anything about studying with us', 'within 1 working day'],
  ['Finance', 'finance@rumax.edu', 'Fees, instalments, refunds', 'within 2 working days'],
  ['Registry', 'registry@rumax.edu', 'Records, transcripts, verification', 'within 3 working days'],
  ['Media', 'press@rumax.edu', 'Press and interview requests', 'same day'],
  ['Accessibility', 'access@rumax.edu', 'Adjustments and barriers on the platform', 'within 1 working day'],
];

export default function ContactPage() {
  return (
    <>
      <PageHero eyebrow="Contact" title="Talk to us" description="Real people, published response times, and no phone tree." />

      <section className="rx-container py-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-6">
            <Card>
              <CardBody>
                <h2 className="mb-4 font-display text-lg font-semibold">Who to contact</h2>
                <ul className="space-y-4">
                  {DESKS.map(([name, email, scope, sla]) => (
                    <li key={email} className="border-b border-border/60 pb-4 last:border-0 last:pb-0">
                      <p className="font-medium">{name}</p>
                      <a href={`mailto:${email}`} className="text-sm text-brand hover:underline">
                        {email}
                      </a>
                      <p className="mt-1 text-xs text-muted">{scope}</p>
                      <p className="text-xs text-muted">Typical reply: {sla}</p>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <h2 className="mb-3 font-display text-lg font-semibold">Registered office</h2>
                <ul className="space-y-2.5 text-sm text-muted">
                  <li className="flex items-start gap-2">
                    <MapPin size={15} className="mt-0.5 shrink-0" aria-hidden />
                    {SITE.address}
                  </li>
                  <li className="flex items-center gap-2">
                    <Phone size={15} className="shrink-0" aria-hidden />
                    <a href={`tel:${SITE.phone.replace(/\s/g, '')}`} className="hover:text-brand">
                      {SITE.phone}
                    </a>
                  </li>
                  <li className="flex items-center gap-2">
                    <Mail size={15} className="shrink-0" aria-hidden />
                    <a href={`mailto:${SITE.email}`} className="hover:text-brand">
                      {SITE.email}
                    </a>
                  </li>
                </ul>
                <p className="mt-4 text-xs leading-relaxed text-muted">
                  Office hours 08:00–17:00 UTC+2, Monday to Friday. The help desk is monitored
                  outside those hours for urgent examination and access issues.
                </p>
              </CardBody>
            </Card>
          </div>

          <ContactForm />
        </div>
      </section>
    </>
  );
}
