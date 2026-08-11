import type { Metadata } from 'next';
import Link from 'next/link';
import { Briefcase, FileText, MessagesSquare, Target } from 'lucide-react';

import { PageHero } from '@/components/site/page-hero';
import { Badge, Card, EmptyState, StatCard } from '@/components/ui';
import { getJobs } from '@/lib/queries';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Career centre',
  description: 'Internships, graduate roles, CV support and interview preparation for RuMax students and graduates.',
  alternates: { canonical: '/careers' },
};

export const revalidate = 600;

export default async function CareersPage() {
  const jobs = await getJobs(12);

  return (
    <>
      <PageHero
        eyebrow="Careers"
        title="Career centre"
        description="94% of our graduates are in work or further study within six months. This is the part of the university that makes that number true."
      />

      <section className="rx-container py-14">
        <div className="mb-10 grid gap-4 sm:grid-cols-4">
          <StatCard label="Graduate employment" value="94%" hint="within six months" />
          <StatCard label="Live vacancies" value={jobs.length} />
          <StatCard label="Employer partners" value="480+" />
          <StatCard label="Mock interviews last year" value="6,200" />
        </div>

        <div className="mb-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[
            { icon: FileText, title: 'CV review', body: 'A human reads your CV and returns line-level comments within three working days. Unlimited revisions.' },
            { icon: MessagesSquare, title: 'Mock interviews', body: 'Recorded practice interviews with a careers adviser, plus an AI interview coach for unlimited repetition.' },
            { icon: Target, title: 'Career counselling', body: 'One-to-one sessions on direction, sector choice and negotiating an offer. Open to graduates for life.' },
            { icon: Briefcase, title: 'Employer network', body: '480 employers who recruit specifically from RuMax, including every one on the job board.' },
          ].map((service) => (
            <Card key={service.title} className="p-6">
              <span className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-brand-gradient text-white">
                <service.icon size={18} aria-hidden />
              </span>
              <h2 className="font-display text-lg font-semibold">{service.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{service.body}</p>
            </Card>
          ))}
        </div>

        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-2xl font-semibold">Current vacancies</h2>
          <Link href="/jobs" className="text-sm font-semibold text-brand hover:underline">
            All vacancies →
          </Link>
        </div>

        {jobs.length === 0 ? (
          <EmptyState title="No vacancies listed" description="New roles are posted weekly." />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {jobs.map((job) => (
              <Card key={job.id} hover className="flex h-full flex-col p-6">
                <div className="mb-2 flex flex-wrap gap-2">
                  <Badge tone="brand">{job.type.replace(/_/g, ' ').toLowerCase()}</Badge>
                  {job.remote ? <Badge tone="success">Remote</Badge> : null}
                </div>
                <h3 className="font-display text-base font-semibold leading-snug">{job.title}</h3>
                <p className="mt-1 text-sm text-muted">
                  {job.employer} · {job.location}
                </p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{job.description}</p>
                <p className="mt-4 border-t border-border pt-3 text-xs text-muted">
                  Closes {formatDate(job.closesAt)}
                  {job.salaryRange ? ` · ${job.salaryRange}` : ''}
                </p>
              </Card>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
