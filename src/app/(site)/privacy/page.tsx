import type { Metadata } from 'next';

import { PageHero } from '@/components/site/page-hero';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: 'How RuMax Global Digital University collects, uses and protects personal data.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Privacy policy" description="Last reviewed January 2025. Written to be read, not to be survived." />

      <section className="rx-container py-14">
        <div className="prose-rx mx-auto max-w-3xl">
          <h2>Who we are</h2>
          <p>
            {SITE.name}, {SITE.address}, registered {SITE.registrationNumber}, is the data controller
            for the personal data described here. Our data protection officer can be reached at{' '}
            <a href="mailto:dpo@rumax.edu">dpo@rumax.edu</a>.
          </p>

          <h2>What we collect, and why</h2>
          <ul>
            <li><strong>Identity and contact details</strong> — to admit you, teach you and award you a qualification.</li>
            <li><strong>Academic records</strong> — registrations, submissions, marks, attendance. This is the substance of your relationship with a university.</li>
            <li><strong>Financial records</strong> — invoices and payments. We never store card or mobile money credentials; those stay with the payment provider.</li>
            <li><strong>Platform activity</strong> — which lessons you have completed, when you signed in. Used to show you your own progress and to let your lecturer spot when someone has stalled.</li>
            <li><strong>Proctoring data</strong> — for proctored examinations only: camera stills and tab-switch events. Reviewed only when the system flags something, and deleted after 90 days.</li>
            <li><strong>AI conversations</strong> — kept so you have your history and so academic integrity reviews can see what help was given.</li>
          </ul>

          <h2>Lawful basis</h2>
          <p>
            Most processing is necessary to perform our contract with you as a student. Admissions
            processing is on the basis of taking steps at your request before entering a contract.
            Statutory returns to the higher education authority are a legal obligation. Equality
            monitoring data is processed with your explicit consent and can be withdrawn at any time
            without any effect on your studies.
          </p>

          <h2>Who we share it with</h2>
          <p>
            Payment providers (to take payment), our cloud infrastructure provider (to run the
            platform), the plagiarism service (submitted work only), and the higher education
            authority (statutory aggregate returns). We do not sell personal data, and we do not
            share it with advertisers. Where a processor is outside the country, transfers are made
            under standard contractual clauses.
          </p>

          <h2>How long we keep it</h2>
          <ul>
            <li>Academic records and awards: 40 years, as the awarding regulations require.</li>
            <li>Financial records: 7 years.</li>
            <li>Unsuccessful applications: 2 years.</li>
            <li>Proctoring recordings: 90 days.</li>
            <li>Server access logs: 90 days.</li>
          </ul>

          <h2>Your rights</h2>
          <p>
            You can obtain a copy of everything we hold about you at any time — the export is in your
            profile under &ldquo;Your data&rdquo; and downloads immediately, without you having to
            ask anyone. You can correct anything inaccurate, object to processing, and ask us to
            erase what we are not legally required to keep. We respond to requests within one month.
          </p>
          <p>
            If you are not satisfied with how we have handled your data you can complain to the
            national data protection authority. We would rather you told us first, but you do not
            have to.
          </p>

          <h2>Security</h2>
          <p>
            Data is encrypted in transit and at rest. Access to student records is role-based and
            every access to a record is logged. Staff accounts require two-factor authentication.
            We test the platform independently each year and publish a summary of the findings.
          </p>

          <h2>Cookies</h2>
          <p>
            We set a session cookie when you sign in and store your accessibility preferences
            locally. We use no advertising or cross-site tracking cookies at all — see the cookie
            policy for the full list.
          </p>
        </div>
      </section>
    </>
  );
}
