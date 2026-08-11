import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock, Globe2, Languages, Wallet } from 'lucide-react';

import { PageHero } from '@/components/site/page-hero';
import { Card, CardBody } from '@/components/ui';
import { LANGUAGES } from '@/lib/site';

export const metadata: Metadata = {
  title: 'International students',
  description: 'Studying with RuMax from outside Malawi — no visa, no relocation, timezone-aware teaching and local payment methods.',
  alternates: { canonical: '/international' },
};

export default function InternationalPage() {
  return (
    <>
      <PageHero
        eyebrow="International"
        title="Studying from anywhere"
        description="Students in 140 countries. Because teaching is entirely online, the barriers international students usually face — visas, relocation, accommodation — simply do not apply."
      />

      <section className="rx-container py-14">
        <div className="mb-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[
            { icon: Globe2, title: 'No visa required', body: 'You study from where you live. No student visa, no immigration application, no relocation cost.' },
            { icon: Clock, title: 'Timezone aware', body: 'Deadlines display in your own timezone. Live seminars are recorded, and each programme runs at least one seminar in an Asia-Pacific-friendly slot.' },
            { icon: Wallet, title: 'Pay locally', body: 'Mobile money, local cards and bank transfer. Fees are quoted in US dollars and charged in your currency.' },
            { icon: Languages, title: 'Language support', body: 'Teaching is in English, with free academic-English support for anyone who wants it and interface translation into eight languages.' },
          ].map((item) => (
            <Card key={item.title} className="p-6">
              <span className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-brand-gradient text-white">
                <item.icon size={18} aria-hidden />
              </span>
              <h2 className="font-display text-lg font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="prose-rx">
            <h2>Recognition of your qualification at home</h2>
            <p>
              Recognition is decided by your own country&rsquo;s authority, not by us. Before you
              apply, check how your national recognition body treats accredited foreign online
              awards — particularly if you need the qualification for a regulated profession such as
              teaching, medicine or law.
            </p>
            <p>
              We supply, free of charge and to any recognition authority: a certified transcript,
              full syllabus documentation, our accreditation certificate, and a credential
              evaluation pack. Contact the registrar and we send it directly to the body concerned.
            </p>

            <h2>Entry qualifications from other systems</h2>
            <p>
              We assess qualifications from every education system and do not require a
              pre-evaluation from an agency. Send what you have; if we cannot map it we will tell you
              what additional evidence would let us.
            </p>

            <h2>If you do want to visit</h2>
            <p>
              Graduation ceremonies are held in Blantyre and streamed. Attending in person is
              entirely optional — around one graduate in twelve does — and the registry issues a
              visa support letter on request. There is no accommodation requirement and no campus
              residency at any point in any programme.
            </p>
          </div>

          <Card className="h-fit">
            <CardBody>
              <h2 className="mb-3 font-display text-lg font-semibold">Interface languages</h2>
              <ul className="grid grid-cols-2 gap-2 text-sm">
                {LANGUAGES.map((language) => (
                  <li key={language.code} className="text-muted">
                    {language.native}{' '}
                    <span className="text-xs">({language.label})</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 border-t border-border pt-4 text-xs leading-relaxed text-muted">
                Teaching and assessment are in English. Interface translation covers navigation,
                deadlines and administrative screens — the part of the platform you use most often
                and understand least when it is in a second language.
              </p>
              <Link href="/contact" className="btn-secondary mt-4 w-full text-sm">
                Ask about your country
              </Link>
            </CardBody>
          </Card>
        </div>
      </section>
    </>
  );
}
