import type { Metadata } from 'next';

import { PageHero } from '@/components/site/page-hero';
import { Avatar, Card } from '@/components/ui';
import { LEADERSHIP } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Vice-Chancellor',
  description: 'A message from Prof. Thandiwe Ruzivo, Vice-Chancellor of RuMax Global Digital University.',
  alternates: { canonical: '/about/vice-chancellor' },
};

const VC = LEADERSHIP[0];

export default function ViceChancellorPage() {
  return (
    <>
      <PageHero
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'About', href: '/about' }, { label: 'Vice-Chancellor' }]}
        eyebrow="Leadership"
        title="A word from the Vice-Chancellor"
      />

      <section className="rx-container py-14">
        <div className="mx-auto grid max-w-4xl gap-10 lg:grid-cols-[1fr_2fr]">
          <div>
            <Card className="p-6 text-center">
              <Avatar name={VC.name} size={110} className="mx-auto" />
              <p className="mt-4 font-display text-lg font-semibold">{VC.name}</p>
              <p className="mt-1 text-sm text-muted">{VC.role}</p>
              <p className="mt-4 text-left text-sm leading-relaxed text-muted">{VC.bio}</p>
            </Card>
          </div>

          <div className="prose-rx">
            <p>
              When I arrived at RuMax in 2019, a colleague warned me that online universities are
              judged by what they lack: no campus, no common room, no shared silence in a library at
              two in the morning. He was right that we lack those things. He was wrong that they are
              what a university is.
            </p>
            <p>
              A university is a place where someone who knows a subject takes responsibility for
              someone who wants to learn it, and where the resulting claim to have learned it can be
              trusted by strangers. Everything else — the buildings, the ceremony, the ivy — is
              scaffolding around that relationship. Useful scaffolding, often beautiful, but not the
              thing itself.
            </p>
            <p>
              What we have built instead is a university that meets students where they already are.
              Our median student is 29, works, and studies between other obligations. A third have
              caring responsibilities. Nearly a fifth are the first in their family to attend any
              university at all. For them the campus was never neutral infrastructure — it was the
              barrier.
            </p>
            <p>
              None of that is a reason to be easier. It is a reason to be better organised: to record
              every lecture, to return feedback within a day, to publish the regulations in plain
              language, to make every deadline visible from a phone, to let someone pay tuition in
              three parts by mobile money. Those are unglamorous commitments. They are also the ones
              that decide whether a capable student finishes.
            </p>
            <p>
              If you are considering studying with us, read our completion rates before you read our
              prospectus. We publish both. The first tells you whether we keep our promises; the
              second only tells you what we promise.
            </p>
            <p className="!mb-1 font-medium text-fg">Prof. Thandiwe Ruzivo</p>
            <p className="!mt-0 text-sm">Vice-Chancellor &amp; President</p>
          </div>
        </div>
      </section>
    </>
  );
}
