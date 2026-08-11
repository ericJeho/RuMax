import type { Metadata } from 'next';

import { PageHero } from '@/components/site/page-hero';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Terms of use',
  description: 'The terms governing use of the RuMax Global Digital University platform and enrolment as a student.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Terms of use" description="Last reviewed January 2025." />

      <section className="rx-container py-14">
        <div className="prose-rx mx-auto max-w-3xl">
          <h2>1. Who these terms are between</h2>
          <p>
            These terms are between you and {SITE.name} ({SITE.registrationNumber}). By creating an
            account, applying or enrolling you accept them.
          </p>

          <h2>2. Your account</h2>
          <p>
            You are responsible for keeping your credentials secure and for everything done under
            your account. Do not share it — sharing an account during an assessment is treated as
            academic misconduct. Tell us immediately if you think it has been compromised.
          </p>

          <h2>3. Academic regulations</h2>
          <p>
            Your studies are governed by the academic regulations approved by Senate, which cover
            assessment, progression, appeals and misconduct. They are published in full and form part
            of these terms. Where these terms and the regulations conflict on an academic matter, the
            regulations prevail.
          </p>

          <h2>4. Fees</h2>
          <p>
            Tuition is due by the date on your invoice. Instalment plans must be arranged before the
            first due date. We may withhold results or an award while an account is in arrears, but
            we will not remove access to teaching material for non-payment during a term.
          </p>
          <p>
            <strong>Refunds:</strong> full refund if you withdraw within 14 days of a term starting;
            50% up to the end of week four; none thereafter. Refunds return to the original payment
            method within 10 working days.
          </p>

          <h2>5. Academic integrity</h2>
          <p>
            Work you submit must be your own. Using an AI system to produce work you present as your
            own is misconduct; using one to understand material, plan, or get feedback on your own
            draft is not. If you are unsure where a particular use falls, ask before you submit — we
            answer that question without penalty.
          </p>

          <h2>6. Acceptable use</h2>
          <p>
            Do not attempt to gain unauthorised access to any part of the platform, disrupt it for
            others, harass anyone, or upload unlawful material. Discussion forums are moderated and
            posts that breach this may be removed.
          </p>

          <h2>7. Intellectual property</h2>
          <p>
            Course materials remain ours and are licensed to you for your own study for as long as
            you hold an account. You keep ownership of the work you submit; you grant us a licence to
            store, mark and retain it for the periods set out in the privacy policy, and to use it
            anonymously for quality assurance.
          </p>

          <h2>8. Availability</h2>
          <p>
            We target 99.99% availability and publish our uptime. We will give notice of planned
            maintenance and, where it falls near a deadline, move the deadline rather than expect you
            to work around it.
          </p>

          <h2>9. Changes</h2>
          <p>
            We may change these terms. Material changes are notified at least 30 days in advance,
            and changes never apply retrospectively to a decision already made about you.
          </p>

          <h2>10. Complaints</h2>
          <p>
            Raise a complaint through the help desk. If you are not satisfied with the outcome you
            can escalate to the Registrar and then to an independent adjudicator. The full complaints
            procedure is published with the academic regulations.
          </p>
        </div>
      </section>
    </>
  );
}
