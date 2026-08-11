import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, ClipboardCheck, Clock, Users } from 'lucide-react';

import {
  Badge,
  ButtonLink,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  PageHeader,
  StatCard,
} from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { getLecturerOverview } from '@/lib/lecturer';
import { formatDate, formatRelative } from '@/lib/format';

export const metadata: Metadata = { title: 'Lecturer dashboard' };
export const dynamic = 'force-dynamic';

export default async function LecturerDashboard() {
  const user = await requireUser();
  const { courses, toMark, upcoming, recentSubmissions, studentCount } = await getLecturerOverview(user.id);

  return (
    <>
      <PageHeader
        title={`Good to see you, ${user.firstName}`}
        description="Your teaching load, what needs marking, and who needs a nudge."
        actions={
          <ButtonLink href="/lecturer/marking">
            Marking queue{toMark > 0 ? ` (${toMark})` : ''}
          </ButtonLink>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Courses" value={courses.length} icon={<BookOpen size={18} aria-hidden />} />
        <StatCard label="Students" value={studentCount} icon={<Users size={18} aria-hidden />} />
        <StatCard
          label="Awaiting marking"
          value={toMark}
          hint={toMark > 0 ? 'Target: 24 hours' : 'Queue clear'}
          icon={<ClipboardCheck size={18} aria-hidden />}
        />
        <StatCard
          label="Next deadline"
          value={upcoming[0] ? formatRelative(upcoming[0].dueAt) : '—'}
          hint={upcoming[0]?.title}
          icon={<Clock size={18} aria-hidden />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle as="h2">Your courses</CardTitle>
              <Link href="/lecturer/courses" className="text-sm text-brand hover:underline">
                Manage
              </Link>
            </CardHeader>
            <CardBody className="space-y-3">
              {courses.length === 0 ? (
                <EmptyState
                  title="No courses assigned"
                  description="Your head of department assigns teaching. Contact them if this looks wrong."
                />
              ) : (
                courses.map((course) => (
                  <Link
                    key={course.id}
                    href={`/lecturer/courses/${course.slug}`}
                    className="block rounded-xl border border-border p-4 transition hover:border-brand/50 hover:bg-surface-2/50"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono text-xs text-muted">{course.code}</p>
                        <p className="mt-0.5 font-medium">{course.title}</p>
                        <p className="mt-1 text-xs text-muted">
                          {course.registrations.length} enrolled · {course._count.modules} units ·{' '}
                          {course._count.assignments} assignments · {course._count.quizzes} quizzes
                        </p>
                      </div>
                      <Badge tone={course.published ? 'success' : 'warning'}>
                        {course.published ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                  </Link>
                ))
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle as="h2">Recently submitted</CardTitle>
              <Link href="/lecturer/marking" className="text-sm text-brand hover:underline">
                Mark now
              </Link>
            </CardHeader>
            <CardBody className="space-y-2">
              {recentSubmissions.length === 0 ? (
                <p className="text-sm text-muted">Nothing waiting. The queue is clear.</p>
              ) : (
                recentSubmissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 py-2.5 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {submission.user.firstName} {submission.user.lastName}
                        <span className="ml-2 font-mono text-xs text-muted">
                          {submission.user.studentNumber}
                        </span>
                      </p>
                      <p className="text-xs text-muted">
                        {submission.assignment.course.code} · {submission.assignment.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {submission.status === 'LATE' ? <Badge tone="danger">Late</Badge> : null}
                      <span className="text-xs text-muted">
                        {submission.submittedAt ? formatRelative(submission.submittedAt) : ''}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle as="h2">Upcoming deadlines</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              {upcoming.length === 0 ? (
                <p className="text-sm text-muted">No open assignments.</p>
              ) : (
                upcoming.map((assignment) => (
                  <div key={assignment.id} className="rounded-xl border border-border p-3">
                    <p className="text-sm font-medium leading-snug">{assignment.title}</p>
                    <p className="mt-1 text-xs text-muted">
                      {assignment.course.code} · due {formatDate(assignment.dueAt)} ·{' '}
                      {assignment._count.submissions} submitted
                    </p>
                  </div>
                ))
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle as="h2">Marking standards</CardTitle>
            </CardHeader>
            <CardBody>
              <ul className="space-y-2 text-sm leading-relaxed text-muted">
                <li>
                  <strong className="text-fg">24 hours.</strong> Feedback is returned within a day
                  of the marking window opening. This is the commitment students are given.
                </li>
                <li>
                  <strong className="text-fg">Two strengths, two improvements.</strong> Every piece
                  of feedback names what worked as well as what did not.
                </li>
                <li>
                  <strong className="text-fg">Specific, not general.</strong> &ldquo;Q4 conflates
                  two definitions&rdquo; helps; &ldquo;more detail needed&rdquo; does not.
                </li>
                <li>
                  <strong className="text-fg">Similarity above 25%</strong> goes to the academic
                  integrity team rather than being handled in the mark.
                </li>
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
