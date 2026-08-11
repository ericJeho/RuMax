import type { Metadata } from 'next';
import { CheckCircle2 } from 'lucide-react';

import { PageHero } from '@/components/site/page-hero';
import { Card, CardBody } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Accessibility',
  description: 'RuMax accessibility statement — conformance, known issues, and how to report a barrier.',
  alternates: { canonical: '/accessibility' },
};

const CONFORMANCE = [
  'Keyboard operable throughout, with a visible focus indicator that is never removed',
  'Semantic headings, landmarks and skip links on every page',
  'Colour contrast of at least 4.5:1 for text, with a high-contrast mode beyond that',
  'Text scaling to 125% without loss of content or function',
  'Motion reduced automatically when the operating system requests it',
  'All video captioned; all live sessions captioned and recorded',
  'Form fields labelled, errors announced, and never signalled by colour alone',
  'Tested with NVDA, VoiceOver and TalkBack each release',
];

export default function AccessibilityPage() {
  return (
    <>
      <PageHero
        eyebrow="Commitment"
        title="Accessibility"
        description="A university whose purpose is access has no excuse for an inaccessible platform. This statement says where we conform, and where we do not yet."
      />

      <section className="rx-container py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div className="prose-rx">
            <h2>Conformance</h2>
            <p>
              This platform is designed to meet <strong>WCAG 2.2 Level AA</strong>. We assess it
              against the standard at every release and commission an independent audit annually.
            </p>

            <h2>Known issues</h2>
            <p>
              We publish these rather than waiting until they are fixed, because a student needs to
              know today whether something will work for them.
            </p>
            <ul>
              <li>
                Complex data tables in the gradebook scroll horizontally on narrow screens. A
                per-student card view is planned for the next release.
              </li>
              <li>
                Some older uploaded PDFs are not tagged for screen readers. Ask the course lecturer
                or <a href="mailto:access@rumax.edu">access@rumax.edu</a> and we will supply an
                accessible version within two working days.
              </li>
              <li>
                Charts convey trend through shape and colour. Every chart is paired with the same
                figures in a table, but the chart itself is not independently navigable.
              </li>
            </ul>

            <h2>Adjustments</h2>
            <p>
              Beyond the platform, individual adjustments are arranged through student support: extra
              time in examinations, alternative assessment formats, note-taking support, and
              deadline flexibility. You do not need a formal diagnosis to start that conversation.
            </p>

            <h2>Reporting a barrier</h2>
            <p>
              Email <a href="mailto:access@rumax.edu">access@rumax.edu</a>. We acknowledge within one
              working day and tell you either how to work around it now or when it will be fixed. If
              you are not satisfied with our response you can escalate to the Registrar and then to
              the national equality body.
            </p>
          </div>

          <Card className="h-fit">
            <CardBody>
              <h2 className="mb-4 font-display text-lg font-semibold">What we do</h2>
              <ul className="space-y-2.5">
                {CONFORMANCE.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-success" aria-hidden />
                    <span className="text-muted">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 border-t border-border pt-4 text-xs leading-relaxed text-muted">
                Use the accessibility button at the bottom-left of any page to switch theme, scale
                text or turn on high contrast. Your choice is remembered on this device.
              </p>
            </CardBody>
          </Card>
        </div>
      </section>
    </>
  );
}
