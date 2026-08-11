import type { Metadata } from 'next';
import Link from 'next/link';
import { Briefcase, HeartHandshake, Network, Trophy } from 'lucide-react';

import { PageHero } from '@/components/site/page-hero';
import { ButtonLink, Card, CardBody, StatCard } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Alumni',
  description: 'The RuMax alumni network — mentoring, jobs, events and giving back.',
  alternates: { canonical: '/alumni' },
};

const STORIES = [
  { name: 'Amina Kamau', award: 'MSc Public Health, 2024', country: 'Kenya', story: 'Studied between night shifts as a clinical officer. Now runs immunisation programme evaluation for a county health department covering 1.2 million people.' },
  { name: 'Farai Moyo', award: 'BSc Computer Science, 2023', country: 'Zimbabwe', story: 'First in his family to attend university. Joined a payments company as a graduate engineer and has since shipped the fraud-detection service handling their entire card volume.' },
  { name: 'Nadia Traoré', award: 'Executive MBA, 2022', country: 'Senegal', story: 'Took the EMBA while running a 40-person logistics business. Used the consultancy project on her own company; it now operates in four countries.' },
];

export default function AlumniPage() {
  return (
    <>
      <PageHero
        eyebrow="Community"
        title="84,000 graduates, 140 countries"
        description="Our alumni network exists to do three things: help graduates find work, help current students avoid mistakes, and fund the scholarships that let the next cohort study at all."
      >
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/login" size="lg">
            Alumni sign in
          </ButtonLink>
          <ButtonLink href="/verify" size="lg" variant="secondary">
            Verify a credential
          </ButtonLink>
        </div>
      </PageHero>

      <section className="rx-container py-14">
        <div className="mb-10 grid gap-4 sm:grid-cols-4">
          <StatCard label="Graduates" value="84,120" />
          <StatCard label="Countries" value="140" />
          <StatCard label="Active mentors" value="2,340" />
          <StatCard label="Scholarships funded by alumni" value="612" hint="since 2020" />
        </div>

        <div className="mb-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[
            { icon: Network, title: 'Directory', body: 'Search graduates by programme, country and industry. Opt in to be findable; opt out at any time.' },
            { icon: HeartHandshake, title: 'Mentoring', body: 'Take one current student for an academic year. Six conversations, roughly an hour each. It is the single most requested thing students ask for.' },
            { icon: Briefcase, title: 'Job board', body: 'Roles posted by alumni and partner employers, open to graduates and final-year students.' },
            { icon: Trophy, title: 'Giving', body: 'Alumni donations fund the Legacy Award. 612 students have studied on it so far; the median gift is US$25.' },
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

        <h2 className="mb-5 font-display text-2xl font-semibold">Where our graduates went</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {STORIES.map((story) => (
            <Card key={story.name} className="p-6">
              <p className="font-display text-lg font-semibold">{story.name}</p>
              <p className="mt-0.5 text-sm text-brand">{story.award}</p>
              <p className="text-xs text-muted">{story.country}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted">{story.story}</p>
            </Card>
          ))}
        </div>

        <Card className="mt-10">
          <CardBody className="prose-rx">
            <h2>Employers: verifying a RuMax graduate</h2>
            <p>
              You do not need to contact us. Every certificate carries a serial that resolves at{' '}
              <Link href="/verify">the verification portal</Link> and confirms the holder, the award,
              the classification and the date — free, instant and unlimited. There is also a JSON API
              if you want to wire it into an applicant tracking system.
            </p>
          </CardBody>
        </Card>
      </section>
    </>
  );
}
