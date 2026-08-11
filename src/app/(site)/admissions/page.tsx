import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarDays, FileCheck2, GraduationCap, Send } from 'lucide-react';

import { PageHero } from '@/components/site/page-hero';
import { ButtonLink, Card, CardBody, SectionHeading } from '@/components/ui';
import { getCurrentTerm } from '@/lib/queries';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Admissions',
  description: 'How to apply to RuMax Global Digital University: entry routes, deadlines, documents and decisions.',
  alternates: { canonical: '/admissions' },
};

export const revalidate = 600;

const STEPS = [
  { icon: GraduationCap, title: 'Choose a programme', body: 'Check the entry requirements on the programme page. If you are not sure you qualify, apply anyway and tell us — recognition of prior learning covers more people than expect it.' },
  { icon: FileCheck2, title: 'Gather your documents', body: 'A photograph, an identity document, your highest academic certificate and its transcript. A CV and a reference help but are not required for most programmes.' },
  { icon: Send, title: 'Apply online', body: 'Five steps, about fifteen minutes. Your progress saves as you go. There is no application fee for open-entry courses.' },
  { icon: CalendarDays, title: 'Get a decision', body: 'A first decision within five working days. Some programmes interview; that adds about a week. Offers are open for 28 days.' },
];

export default async function AdmissionsPage() {
  const term = await getCurrentTerm();

  return (
    <>
      <PageHero
        eyebrow="Admissions"
        title="How to apply"
        description="Applying should take an afternoon, not a season. Here is exactly what happens and when."
      >
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/apply" size="lg">
            Start your application
          </ButtonLink>
          <ButtonLink href="/apply/status" size="lg" variant="secondary">
            Track an application
          </ButtonLink>
        </div>
      </PageHero>

      <section className="rx-container py-14">
        <SectionHeading eyebrow="The process" title="Four steps" />
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {STEPS.map((step, index) => (
            <Card key={step.title} className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-gradient text-white">
                  <step.icon size={18} aria-hidden />
                </span>
                <span className="font-mono text-xs text-muted">0{index + 1}</span>
              </div>
              <h3 className="font-display text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface-2/40 py-14">
        <div className="rx-container grid gap-10 lg:grid-cols-2">
          <div className="prose-rx">
            <h2>Entry routes</h2>
            <p>
              <strong>Standard entry.</strong> You hold the qualification listed on the programme
              page. Most applicants come this way.
            </p>
            <p>
              <strong>Recognition of prior learning.</strong> You do not hold the formal
              qualification but have relevant professional experience. Tell us what you have done in
              your personal statement; we assess it against the learning outcomes of the missing
              qualification. Roughly one applicant in six enters this way.
            </p>
            <p>
              <strong>Credit transfer.</strong> You have studied elsewhere and want those credits to
              count. Send the transcript and syllabus; we can usually transfer up to a third of a
              programme.
            </p>
            <p>
              <strong>Open entry.</strong> Certificates, short courses and open courses have no
              formal entry requirement at all.
            </p>

            <h2>English language</h2>
            <p>
              Teaching is in English. We do not require a test score if your previous study was in
              English or you work in an English-speaking environment. Otherwise IELTS 6.0, TOEFL 78
              or equivalent — and we accept a recorded interview in place of a test if sitting one is
              impractical where you live.
            </p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardBody>
                <h2 className="font-display text-lg font-semibold">Key dates</h2>
                {term ? (
                  <dl className="mt-4 space-y-3 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">Current term</dt>
                      <dd className="font-medium">{term.name}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">Registration closes</dt>
                      <dd className="font-medium">{formatDate(term.registrationCloses)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">Term ends</dt>
                      <dd className="font-medium">{formatDate(term.endDate)}</dd>
                    </div>
                  </dl>
                ) : (
                  <p className="mt-3 text-sm text-muted">No term is currently open.</p>
                )}
                <p className="mt-4 text-xs leading-relaxed text-muted">
                  Two main intakes each year, in January and September, plus rolling enrolment for
                  self-paced short courses. See the{' '}
                  <Link href="/academic-calendar" className="text-brand underline">
                    academic calendar
                  </Link>
                  .
                </p>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <h2 className="font-display text-lg font-semibold">Fees and funding</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Tuition ranges from no fee for open courses to US$7,900 a year for the Executive
                  MBA. Payment can be split across three instalments per term at no extra cost.
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  <ButtonLink href="/admissions/fees" variant="secondary" size="sm">
                    Full fee schedule
                  </ButtonLink>
                  <ButtonLink href="/scholarships" variant="secondary" size="sm">
                    Scholarships
                  </ButtonLink>
                  <ButtonLink href="/international" variant="secondary" size="sm">
                    International students
                  </ButtonLink>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}
