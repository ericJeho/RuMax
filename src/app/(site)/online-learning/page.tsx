import type { Metadata } from 'next';
import { Bot, Download, MonitorPlay, Signal, Users, Video } from 'lucide-react';

import { PageHero } from '@/components/site/page-hero';
import { ButtonLink, Card, SectionHeading } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Online learning',
  description: 'How studying at RuMax actually works — the weekly rhythm, the technology, and what it asks of you.',
  alternates: { canonical: '/online-learning' },
};

const FEATURES = [
  { icon: Video, title: 'Recorded lectures', body: 'Every lecture recorded, captioned and downloadable. Watch at 1.5× on a commute or at midnight — the material does not expire.' },
  { icon: Users, title: 'Live seminars', body: 'Twice a week with your lecturer and cohort. Attendance is expected but recorded for the third of students whose timezone makes it impossible.' },
  { icon: MonitorPlay, title: 'Virtual labs', body: 'Browser-based labs and simulations for computing, engineering and health programmes. Nothing to install.' },
  { icon: Bot, title: 'AI tutor', body: 'Available at 3am when a concept finally clicks — or refuses to. It explains and questions you; it will not write your assignment.' },
  { icon: Download, title: 'Offline study', body: 'Download a whole unit before you lose connectivity. Progress syncs when you are back online.' },
  { icon: Signal, title: 'Built for 3G', body: 'Tested on phones from 2018 and connections at 1 Mbps. Video has an audio-plus-slides mode that uses a twentieth of the data.' },
];

export default function OnlineLearningPage() {
  return (
    <>
      <PageHero
        eyebrow="Study"
        title="How online learning works here"
        description="Not a video library with a certificate attached. A structured programme with a weekly rhythm, real teaching, and assessment that means something."
      >
        <ButtonLink href="/programs" size="lg">
          Browse programmes
        </ButtonLink>
      </PageHero>

      <section className="rx-container py-14">
        <SectionHeading eyebrow="Your week" title="What a typical week asks of you" />
        <div className="prose-rx mt-6 max-w-3xl">
          <p>
            A 15-credit module is designed for about ten hours a week over a twelve-week term. Most
            part-time students take two modules. Those ten hours break down roughly as:
          </p>
          <ul>
            <li><strong>3 hours</strong> — recorded lectures and guided reading, at whatever time suits you.</li>
            <li><strong>1.5 hours</strong> — a live seminar with your lecturer and cohort.</li>
            <li><strong>3 hours</strong> — a practical activity: a lab, a problem set, a case study.</li>
            <li><strong>2.5 hours</strong> — working on assessed coursework, spread across the term rather than the week before it is due.</li>
          </ul>
          <p>
            The portal shows you exactly what this week asks for, and what is overdue. That is the
            single feature students tell us matters most — not the video quality, but knowing where
            they stand.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card key={feature.title} className="p-6">
              <span className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-brand-gradient text-white">
                <feature.icon size={18} aria-hidden />
              </span>
              <h3 className="font-display text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{feature.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-surface-2/40 py-14">
        <div className="rx-container prose-rx max-w-3xl">
          <h2>What we ask of you</h2>
          <p>
            Online study fails for one reason far more than any other: the absence of a fixed time.
            Nobody sets an alarm for a recorded lecture. Students who finish almost always block the
            same hours each week and treat them as immovable.
          </p>
          <p>
            The second reason is silence. If you fall two weeks behind, tell someone. Deadline
            extensions of up to two weeks are granted by your lecturer without needing a reason,
            once per course. Almost nobody uses them, and a great many people who could have finished
            do not.
          </p>
        </div>
      </section>
    </>
  );
}
