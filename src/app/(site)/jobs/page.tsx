import type { Metadata } from 'next';

import { PageHero } from '@/components/site/page-hero';
import { Badge, Card, EmptyState } from '@/components/ui';
import { getJobs } from '@/lib/queries';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Vacancies',
  description: 'Graduate roles, internships and jobs posted through the RuMax Career Centre.',
  alternates: { canonical: '/jobs' },
};

export const revalidate = 600;

export default async function JobsPage() {
  const jobs = await getJobs();

  return (
    <>
      <PageHero
        eyebrow="Careers"
        title="Vacancies"
        description="Roles posted by employer partners and by alumni. Open to current students and to graduates at any point after graduating."
      />

      <section className="rx-container py-14">
        {jobs.length === 0 ? (
          <EmptyState title="No vacancies" description="New roles are posted weekly." />
        ) : (
          <div className="mx-auto max-w-3xl space-y-4">
            {jobs.map((job) => (
              <Card key={job.id} className="p-6">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge tone="brand">{job.type.replace(/_/g, ' ').toLowerCase()}</Badge>
                  {job.remote ? <Badge tone="success">Remote</Badge> : null}
                  <Badge>Closes {formatDate(job.closesAt)}</Badge>
                </div>
                <h2 className="font-display text-xl font-semibold leading-snug">{job.title}</h2>
                <p className="mt-1 text-sm text-muted">
                  {job.employer} · {job.location}
                  {job.salaryRange ? ` · ${job.salaryRange}` : ''}
                </p>
                <p className="mt-3 leading-relaxed text-muted">{job.description}</p>

                <div className="mt-4 border-t border-border pt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Requirements</p>
                  <ul className="space-y-1 text-sm text-muted">
                    {job.requirements.map((requirement) => (
                      <li key={requirement}>· {requirement}</li>
                    ))}
                  </ul>
                </div>

                {job.applyUrl ? (
                  <a href={job.applyUrl} className="btn-primary mt-5 text-sm">
                    Apply
                  </a>
                ) : (
                  <p className="mt-5 text-xs text-muted">
                    Apply through the Career Centre in your student portal.
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
