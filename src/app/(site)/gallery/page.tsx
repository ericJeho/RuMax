import type { Metadata } from 'next';

import { PageHero } from '@/components/site/page-hero';
import { Card } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'Moments from the RuMax community — graduations, meet-ups and the places our students study from.',
  alternates: { canonical: '/gallery' },
};

const MOMENTS = [
  ['Graduation 2025', 'Blantyre', 'Streamed to watch parties in eight cities; 340 graduates attended in person.'],
  ['Nairobi meet-up', 'Kenya', 'One of 38 regional meet-ups organised by students rather than by the university.'],
  ['Mini-grid fieldwork', 'Shire Valley', 'MSc Renewable Energy students commissioning a village system as part of their capstone.'],
  ['Study group, night shift', 'Lilongwe', 'Four clinical officers who took the MPH together, meeting at 22:00 between shifts.'],
  ['Open day', 'Online', 'Prospective students questioning the Faculty of Computing — 1,200 attended live.'],
  ['Coding society', 'Global', 'The competitive programming society, which has met weekly since 2019 across eleven timezones.'],
  ['Research seminar', 'Institute of Data Science', 'Presenting the low-resource speech recognition results to the funder and community partners.'],
  ['First cohort reunion', 'Blantyre', 'The 1998 intake, twenty-five years on.'],
];

/**
 * Photography is represented by generated gradient plates rather than stock imagery:
 * using stock photographs of unrelated people to illustrate a real institution's community
 * is the kind of small dishonesty this university's whole pitch rests on avoiding.
 */
export default function GalleryPage() {
  return (
    <>
      <PageHero
        eyebrow="Community"
        title="Gallery"
        description="Our students study from clinics, farms, offices and night shifts. These are some of the moments they have sent us."
      />

      <section className="rx-container py-14">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {MOMENTS.map((moment, index) => (
            <Card key={moment[0]} className="overflow-hidden">
              <div
                aria-hidden
                className="aspect-[4/3] w-full"
                style={{
                  background: `linear-gradient(${135 + index * 24}deg, rgb(var(--rx-brand) / 0.85), rgb(var(--rx-accent) / 0.75))`,
                }}
              />
              <div className="p-4">
                <p className="font-medium">{moment[0]}</p>
                <p className="text-xs text-brand">{moment[1]}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{moment[2]}</p>
              </div>
            </Card>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted">
          Photographs are published with the consent of everyone identifiable in them, and consent
          can be withdrawn at any time by emailing the communications office.
        </p>
      </section>
    </>
  );
}
