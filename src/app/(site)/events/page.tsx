import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarDays, MapPin } from 'lucide-react';

import { PageHero } from '@/components/site/page-hero';
import { Card, EmptyState } from '@/components/ui';
import { getLatestPosts } from '@/lib/queries';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Events',
  description: 'Open days, seminars, graduation ceremonies and workshops at RuMax Global Digital University.',
  alternates: { canonical: '/events' },
};

export const revalidate = 300;

export default async function EventsPage() {
  const events = await getLatestPosts('EVENT', 40);
  const now = Date.now();
  const upcoming = events.filter((event) => !event.eventStart || event.eventStart.getTime() >= now);
  const past = events.filter((event) => event.eventStart && event.eventStart.getTime() < now);

  return (
    <>
      <PageHero eyebrow="Diary" title="Events" description="Everything is online, recorded and captioned. Register and we send the joining link a day beforehand." />

      <section className="rx-container py-14">
        {events.length === 0 ? (
          <EmptyState title="Nothing scheduled" description="Events will appear here." />
        ) : null}

        {upcoming.length > 0 ? (
          <>
            <h2 className="mb-5 font-display text-2xl font-semibold">Upcoming</h2>
            <div className="mb-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {upcoming.map((event) => (
                <Card key={event.id} hover className="flex h-full flex-col p-6">
                  <p className="mb-3 flex items-center gap-2 text-xs text-brand">
                    <CalendarDays size={13} aria-hidden />
                    {event.eventStart ? formatDate(event.eventStart, 'en', { dateStyle: 'full' }) : 'Date to be confirmed'}
                  </p>
                  <h3 className="font-display text-lg font-semibold leading-snug">
                    <Link href={`/events/${event.slug}`} className="hover:text-brand">
                      {event.title}
                    </Link>
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{event.excerpt}</p>
                  <p className="mt-4 flex items-center gap-1.5 border-t border-border pt-3 text-xs text-muted">
                    <MapPin size={12} aria-hidden />
                    {event.location ?? 'Online'}
                  </p>
                </Card>
              ))}
            </div>
          </>
        ) : null}

        {past.length > 0 ? (
          <>
            <h2 className="mb-5 font-display text-2xl font-semibold">Past events</h2>
            <ul className="space-y-2">
              {past.map((event) => (
                <li key={event.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-3">
                  <Link href={`/events/${event.slug}`} className="font-medium hover:text-brand">
                    {event.title}
                  </Link>
                  <span className="text-xs text-muted">{formatDate(event.eventStart)}</span>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </section>
    </>
  );
}
