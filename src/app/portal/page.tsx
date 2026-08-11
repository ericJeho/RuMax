import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowUpRight,
  BookOpen,
  CalendarClock,
  CreditCard,
  GraduationCap,
  Megaphone,
  TrendingUp,
} from 'lucide-react';

import {
  Alert,
  Badge,
  ButtonLink,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  PageHeader,
  ProgressBar,
  StatCard,
  StatusBadge,
} from '@/components/ui';
import { TrendChart } from '@/components/charts';
import { requireUser } from '@/lib/auth';
import { getStudentOverview } from '@/lib/student';
import { formatCurrency, formatDate, formatRelative } from '@/lib/format';
import { classify } from '@/lib/grading';

export const metadata: Metadata = { title: 'Dashboard' };
export const dynamic = 'force-dynamic';

export default async function StudentDashboard() {
  const user = await requireUser();
  const overview = await getStudentOverview(user.id);
  const {
    term,
    registrations,
    grades,
    invoices,
    upcomingAssignments,
    announcements,
    cgpa,
    outstanding,
    creditsEarned,
  } = overview;

  const approved = registrations.filter((r) => r.status === 'APPROVED');
  const requiredCredits = overview.user.program?.totalCredits ?? 0;

  // Grade trend by term, oldest first — gives the student a sense of direction.
  const trend = [...grades]
    .reverse()
    .reduce<{ term: string; average: number; count: number }[]>((acc, grade) => {
      const existing = acc.find((point) => point.term === grade.term.name);
      if (existing) {
        existing.average = (existing.average * existing.count + grade.score) / (existing.count + 1);
        existing.count += 1;
      } else {
        acc.push({ term: grade.term.name, average: grade.score, count: 1 });
      }
      return acc;
    }, [])
    .map((point) => ({ term: point.term.replace(/^\d{4}\/\d{2}\s/, ''), average: Math.round(point.average) }));

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user.firstName}`}
        description={
          term
            ? `${term.name} · week ${Math.max(1, Math.ceil((Date.now() - term.startDate.getTime()) / 604_800_000))} of ${Math.ceil((term.endDate.getTime() - term.startDate.getTime()) / 604_800_000)}`
            : 'No active term. Check the academic calendar for the next intake.'
        }
        actions={
          <ButtonLink href="/portal/courses" variant="secondary">
            Continue learning
          </ButtonLink>
        }
      />

      {outstanding > 0 ? (
        <Alert tone="warning" title="Outstanding balance" className="mb-6">
          You owe {formatCurrency(outstanding)}. Settle it before the examination period to avoid a
          hold on your results.{' '}
          <Link href="/portal/finance" className="font-medium underline">
            Go to finance
          </Link>
        </Alert>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Cumulative GPA"
          value={cgpa.toFixed(2)}
          hint={classify(cgpa)}
          icon={<TrendingUp size={18} aria-hidden />}
        />
        <StatCard
          label="Courses this term"
          value={approved.length}
          hint={`${registrations.length - approved.length} awaiting approval`}
          icon={<BookOpen size={18} aria-hidden />}
        />
        <StatCard
          label="Credits earned"
          value={creditsEarned}
          hint={requiredCredits ? `of ${requiredCredits} required` : undefined}
          icon={<GraduationCap size={18} aria-hidden />}
        />
        <StatCard
          label="Balance"
          value={formatCurrency(outstanding)}
          hint={outstanding > 0 ? 'Payment due' : 'Account settled'}
          icon={<CreditCard size={18} aria-hidden />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          {/* ---------------------------------------------------------- Courses */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle as="h2">Current courses</CardTitle>
              <Link href="/portal/courses" className="text-sm text-brand hover:underline">
                View all
              </Link>
            </CardHeader>
            <CardBody className="space-y-3">
              {approved.length === 0 ? (
                <EmptyState
                  title="No approved registrations"
                  description="Register for courses to start studying this term."
                  action={<ButtonLink href="/portal/registration">Register for courses</ButtonLink>}
                />
              ) : (
                approved.map((registration) => (
                  <Link
                    key={registration.id}
                    href={`/portal/courses/${registration.course.slug}`}
                    className="block rounded-xl border border-border p-4 transition hover:border-brand/50 hover:bg-surface-2/50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-xs text-muted">
                          <span className="font-mono">{registration.course.code}</span>
                          <span>·</span>
                          <span>{registration.course.credits} credits</span>
                        </p>
                        <p className="mt-0.5 truncate font-medium">{registration.course.title}</p>
                        <p className="mt-1 text-xs text-muted">
                          {registration.course.lecturer
                            ? `${registration.course.lecturer.firstName} ${registration.course.lecturer.lastName}`
                            : 'Lecturer to be confirmed'}{' '}
                          · {registration.course._count.modules} units ·{' '}
                          {registration.course._count.assignments} assignments
                        </p>
                      </div>
                      <ArrowUpRight size={16} className="shrink-0 text-muted" aria-hidden />
                    </div>
                  </Link>
                ))
              )}
            </CardBody>
          </Card>

          {/* ------------------------------------------------------ Grade trend */}
          {trend.length > 1 ? (
            <Card>
              <CardHeader>
                <CardTitle as="h2">Average mark by term</CardTitle>
              </CardHeader>
              <CardBody>
                <TrendChart data={trend} xKey="term" series={[{ key: 'average', label: 'Average %' }]} />
                <table className="mt-4 w-full text-left text-sm">
                  <caption className="sr-only">Average mark by term, in figures</caption>
                  <thead>
                    <tr className="text-xs uppercase tracking-wider text-muted">
                      <th scope="col" className="pb-2">Term</th>
                      <th scope="col" className="pb-2 text-right">Average</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trend.map((point) => (
                      <tr key={point.term} className="border-t border-border/60">
                        <td className="py-1.5">{point.term}</td>
                        <td className="py-1.5 text-right tabular-nums">{point.average}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardBody>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          {/* ------------------------------------------------------- Deadlines */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle as="h2">Upcoming deadlines</CardTitle>
              <CalendarClock size={16} className="text-muted" aria-hidden />
            </CardHeader>
            <CardBody className="space-y-3">
              {upcomingAssignments.length === 0 ? (
                <p className="text-sm text-muted">Nothing due. Enjoy it while it lasts.</p>
              ) : (
                upcomingAssignments.map((assignment) => {
                  const submission = assignment.submissions[0];
                  const urgent = assignment.dueAt.getTime() - Date.now() < 3 * 86_400_000;
                  return (
                    <div key={assignment.id} className="rounded-xl border border-border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug">
                          <Link href="/portal/assignments" className="hover:text-brand">
                            {assignment.title}
                          </Link>
                        </p>
                        {submission?.status === 'SUBMITTED' || submission?.status === 'GRADED' ? (
                          <StatusBadge status={submission.status} />
                        ) : (
                          <Badge tone={urgent ? 'danger' : 'warning'}>
                            {formatRelative(assignment.dueAt)}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        {assignment.course.code} · due {formatDate(assignment.dueAt, 'en', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                  );
                })
              )}
            </CardBody>
          </Card>

          {/* -------------------------------------------------------- Progress */}
          {requiredCredits > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle as="h2">Degree progress</CardTitle>
              </CardHeader>
              <CardBody>
                <ProgressBar
                  value={creditsEarned}
                  max={requiredCredits}
                  label={`${creditsEarned} of ${requiredCredits} credits`}
                />
                <p className="mt-3 text-sm text-muted">
                  {overview.user.program?.title} · Year {overview.user.yearOfStudy ?? 1}
                </p>
                <ButtonLink href="/portal/graduation" variant="secondary" size="sm" className="mt-4 w-full">
                  Open graduation tracker
                </ButtonLink>
              </CardBody>
            </Card>
          ) : null}

          {/* --------------------------------------------------- Announcements */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle as="h2">Announcements</CardTitle>
              <Megaphone size={16} className="text-muted" aria-hidden />
            </CardHeader>
            <CardBody className="space-y-3">
              {announcements.length === 0 ? (
                <p className="text-sm text-muted">No announcements.</p>
              ) : (
                announcements.map((announcement) => (
                  <div key={announcement.id} className="border-b border-border/60 pb-3 last:border-0 last:pb-0">
                    <p className="text-sm font-medium leading-snug">
                      {announcement.pinned ? <Badge tone="brand" className="mr-1.5">Pinned</Badge> : null}
                      {announcement.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted">{announcement.body}</p>
                    <p className="mt-1 text-[11px] text-muted">{formatDate(announcement.publishedAt)}</p>
                  </div>
                ))
              )}
            </CardBody>
          </Card>

          {/* ----------------------------------------------------- Recent fees */}
          {invoices.length > 0 ? (
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle as="h2">Recent invoices</CardTitle>
                <Link href="/portal/finance" className="text-sm text-brand hover:underline">
                  Finance
                </Link>
              </CardHeader>
              <CardBody className="space-y-2">
                {invoices.slice(0, 3).map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0">
                      <span className="block truncate">{invoice.description}</span>
                      <span className="block text-xs text-muted">{invoice.invoiceNumber}</span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block tabular-nums">
                        {formatCurrency(Number(invoice.amount), invoice.currency)}
                      </span>
                      <StatusBadge status={invoice.status} />
                    </span>
                  </div>
                ))}
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
