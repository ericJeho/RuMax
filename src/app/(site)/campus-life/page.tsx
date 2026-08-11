import type { Metadata } from 'next';
import Link from 'next/link';
import { HeartPulse, MessagesSquare, Trophy, Users } from 'lucide-react';

import { PageHero } from '@/components/site/page-hero';
import { Card, CardBody, StatCard } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Campus life',
  description: 'Community, societies, wellbeing and student representation at an online university.',
  alternates: { canonical: '/campus-life' },
};

export default function CampusLifePage() {
  return (
    <>
      <PageHero
        eyebrow="Community"
        title="Campus life without a campus"
        description="The hardest thing about studying online is not the material. It is the isolation. Everything here exists to address that specific problem."
      />

      <section className="rx-container py-14">
        <div className="mb-10 grid gap-4 sm:grid-cols-4">
          <StatCard label="Student societies" value="72" />
          <StatCard label="Regional meet-up cities" value="38" />
          <StatCard label="Peer study groups" value="1,140" />
          <StatCard label="Counselling sessions last year" value="8,900" />
        </div>

        <div className="mb-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[
            { icon: Users, title: 'Societies', body: '72 student-run societies from competitive programming to a book club that has met weekly since 2019. Anyone can start one; the students union funds them.' },
            { icon: MessagesSquare, title: 'Study groups', body: 'Cohort study groups form automatically at the start of each module and meet in the course forum or on a call. Students in a group are measurably more likely to finish.' },
            { icon: HeartPulse, title: 'Wellbeing', body: 'Free confidential counselling in six languages, available in the evening and at weekends because that is when our students are free.' },
            { icon: Trophy, title: 'Representation', body: 'Two elected student members sit on Council, and every programme has a student representative who attends the board that reviews it.' },
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
            <h2>What we learned about isolation</h2>
            <p>
              For years we assumed the fix for isolation was more social features: forums, chat,
              virtual common rooms. We built them and they were quiet. What actually moved the
              numbers was much narrower — putting students into a small group of five to eight at the
              start of a module, with a specific shared task and a named person to contact.
            </p>
            <p>
              Students in an active study group are 23 percentage points more likely to complete
              their module than those studying alone, controlling for prior attainment. That is the
              largest single effect we have measured on completion, larger than any change we have
              made to the teaching material itself.
            </p>
            <p>
              So the &ldquo;campus life&rdquo; we invest in is not a virtual quad. It is small
              groups, regional meet-ups where enough students live near each other, and a wellbeing
              service that answers at nine in the evening.
            </p>
          </div>

          <Card className="h-fit">
            <CardBody>
              <h2 className="mb-3 font-display text-lg font-semibold">Getting help</h2>
              <ul className="space-y-3 text-sm leading-relaxed text-muted">
                <li>
                  <strong className="text-fg">Wellbeing:</strong> confidential counselling, no
                  referral needed, booked from your portal.
                </li>
                <li>
                  <strong className="text-fg">Academic advisor:</strong> for anything affecting your
                  studies — including things that have nothing to do with academia.
                </li>
                <li>
                  <strong className="text-fg">Students union:</strong> independent of the university
                  and will represent you against it if that is what is needed.
                </li>
                <li>
                  <strong className="text-fg">Help desk:</strong> everything else, one working day.
                </li>
              </ul>
              <Link href="/support" className="btn-secondary mt-4 w-full text-sm">
                Student support
              </Link>
            </CardBody>
          </Card>
        </div>
      </section>
    </>
  );
}
