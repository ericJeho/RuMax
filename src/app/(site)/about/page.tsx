import type { Metadata } from 'next';
import Link from 'next/link';

import { Card, CardBody, SectionHeading } from '@/components/ui';
import { PageHero } from '@/components/site/page-hero';
import { Reveal } from '@/components/motion';
import { SITE, STATS, VALUES } from '@/lib/site';

export const metadata: Metadata = {
  title: 'About',
  description: `${SITE.name} — who we are, what we stand for, and how an online university holds itself to the same standard as any campus.`,
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title="A university built for people the system was not built for"
        description={`Founded in ${SITE.founded} with 240 students and three diplomas, RuMax now teaches ${STATS[0].value.toLocaleString()} students in ${STATS[1].value} countries — without a single lecture theatre.`}
      />

      <section className="rx-container py-14">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr]">
          <div className="prose-rx">
            <h2>Why we exist</h2>
            <p>
              Most of the world&rsquo;s capable students never get near a university. Not because
              they cannot do the work, but because the university is in the wrong city, the timetable
              assumes they do not have a job, the fees assume a family that can absorb them, or the
              building assumes they can climb stairs.
            </p>
            <p>
              RuMax removes those assumptions one at a time. Every course is designed for a phone on
              a slow connection first and a laptop second. Every lecture is recorded, because a
              student on a night shift in a different timezone is a normal student here, not an
              exception. Every fee can be paid in instalments, by mobile money, in the currency
              people actually hold.
            </p>

            <h2>What we are not</h2>
            <p>
              We are not a video library with a certificate attached. Our programmes carry the same
              credit weight, the same external examination and the same academic regulations as any
              accredited university. Students are taught by academics who are contactable, marked by
              humans, and examined under proctored conditions. An easier degree would be worth less
              to the people who need it most.
            </p>

            <h2>How we hold ourselves accountable</h2>
            <p>
              We publish our completion rates, graduate outcomes and student satisfaction in full,
              including the figures that fall short of target. Our academic regulations are public.
              Every award we confer can be verified instantly by anyone, without contacting us —
              which means our credentials are checkable by people who have never heard of us.
            </p>
            <p>
              Read the <Link href="/about/accreditation">accreditation record</Link>, the{' '}
              <Link href="/about/mission">mission and vision</Link>, or our{' '}
              <Link href="/about/history">history</Link>.
            </p>
          </div>

          <aside>
            <Card className="sticky top-24">
              <CardBody>
                <h2 className="mb-4 font-display text-lg font-semibold">The university in figures</h2>
                <dl className="space-y-4">
                  {STATS.map((stat) => (
                    <div key={stat.label}>
                      <dt className="text-xs uppercase tracking-wider text-muted">{stat.label}</dt>
                      <dd className="font-display text-2xl font-semibold">
                        {stat.value.toLocaleString()}
                        {stat.suffix}
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-5 border-t border-border pt-4 text-xs leading-relaxed text-muted">
                  Registered {SITE.registrationNumber}. Motto: <em>{SITE.motto}</em> — {SITE.mottoTranslation}.
                </p>
              </CardBody>
            </Card>
          </aside>
        </div>
      </section>

      <section className="border-t border-border bg-surface-2/40 py-16">
        <div className="rx-container">
          <SectionHeading align="center" eyebrow="Our commitments" title="Four things we will not trade away" />
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {VALUES.map((value, index) => (
              <Reveal key={value.title} delay={index * 0.05}>
                <Card className="h-full p-6">
                  <h3 className="font-display text-lg font-semibold">{value.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{value.body}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
