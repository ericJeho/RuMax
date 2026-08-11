import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';

import {
  Badge,
  Breadcrumbs,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  PageHeader,
  ProgressBar,
  StatCard,
  Table,
  Td,
  Th,
} from '@/components/ui';
import { ColumnChart } from '@/components/charts';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getAssessmentStats, getCoursePerformance } from '@/lib/lecturer';
import { formatDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const course = await prisma.course.findUnique({ where: { slug }, select: { code: true } });
  return { title: course?.code ?? 'Course' };
}

export default async function LecturerCoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser();

  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      department: { select: { name: true } },
      modules: { include: { _count: { select: { lessons: true } } }, orderBy: { position: 'asc' } },
      assignments: { orderBy: { dueAt: 'asc' } },
      quizzes: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!course) notFound();
  if (user.role !== 'ADMIN' && course.lecturerId !== user.id) notFound();

  const [performance, assessmentStats] = await Promise.all([
    getCoursePerformance(course.id),
    getAssessmentStats(course.id),
  ]);

  const atRisk = performance.filter((student) => student.atRisk);
  const averageMark = performance.length
    ? performance.reduce((sum, s) => sum + s.runningMark, 0) / performance.length
    : 0;
  const averageEngagement = performance.length
    ? performance.reduce((sum, s) => sum + (s.lessonsTotal ? s.lessonsComplete / s.lessonsTotal : 0), 0) /
      performance.length
    : 0;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Lecturer', href: '/lecturer' },
          { label: 'My courses', href: '/lecturer/courses' },
          { label: course.code },
        ]}
      />

      <PageHeader
        title={course.title}
        description={`${course.code} · ${course.department?.name ?? ''} · ${course.credits} credits · level ${course.level}`}
        actions={
          <Badge tone={course.published ? 'success' : 'warning'}>
            {course.published ? 'Published' : 'Draft'}
          </Badge>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Enrolled" value={performance.length} />
        <StatCard label="Average running mark" value={`${averageMark.toFixed(1)}%`} />
        <StatCard label="Material completed" value={`${Math.round(averageEngagement * 100)}%`} hint="cohort mean" />
        <StatCard
          label="At risk"
          value={atRisk.length}
          hint={atRisk.length > 0 ? 'Worth a conversation' : 'Nobody flagged'}
          icon={atRisk.length > 0 ? <AlertTriangle size={18} aria-hidden /> : undefined}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle as="h2">Student performance</CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              <Table>
                <caption className="sr-only">Performance of each student on {course.code}</caption>
                <thead>
                  <tr>
                    <Th>Student</Th>
                    <Th className="text-right">Running mark</Th>
                    <Th className="text-right">Submitted</Th>
                    <Th className="text-right">Material</Th>
                    <Th className="text-right">Flag</Th>
                  </tr>
                </thead>
                <tbody>
                  {performance.map((student) => (
                    <tr key={student.userId}>
                      <Td>
                        <span className="block font-medium">{student.name}</span>
                        <span className="block font-mono text-xs text-muted">{student.studentNumber}</span>
                      </Td>
                      <Td className="text-right tabular-nums">
                        {student.runningMark > 0 ? `${student.runningMark.toFixed(1)}%` : '—'}
                      </Td>
                      <Td className="text-right tabular-nums">
                        {student.submitted}/{student.expected}
                      </Td>
                      <Td className="text-right tabular-nums">
                        {student.lessonsTotal
                          ? `${Math.round((student.lessonsComplete / student.lessonsTotal) * 100)}%`
                          : '—'}
                      </Td>
                      <Td className="text-right">
                        {student.atRisk ? <Badge tone="danger">At risk</Badge> : <Badge tone="success">OK</Badge>}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </CardBody>
          </Card>

          {assessmentStats.some((stat) => stat.marked > 0) ? (
            <Card>
              <CardHeader>
                <CardTitle as="h2">Assessment statistics</CardTitle>
              </CardHeader>
              <CardBody>
                <ColumnChart
                  data={assessmentStats
                    .filter((stat) => stat.marked > 0)
                    .map((stat) => ({ name: stat.title.split('—').pop()?.trim() ?? stat.title, mean: stat.mean, median: stat.median }))}
                  xKey="name"
                  series={[
                    { key: 'mean', label: 'Mean %' },
                    { key: 'median', label: 'Median %' },
                  ]}
                />

                <Table className="mt-4">
                  <caption className="sr-only">Assessment statistics in figures</caption>
                  <thead>
                    <tr>
                      <Th>Assessment</Th>
                      <Th className="text-right">Marked</Th>
                      <Th className="text-right">Mean</Th>
                      <Th className="text-right">Range</Th>
                      <Th className="text-right">Pass rate</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessmentStats.map((stat) => (
                      <tr key={stat.id}>
                        <Td>{stat.title}</Td>
                        <Td className="text-right tabular-nums">{stat.marked}</Td>
                        <Td className="text-right tabular-nums">{stat.mean}%</Td>
                        <Td className="text-right tabular-nums">
                          {stat.marked ? `${stat.lowest.toFixed(0)}–${stat.highest.toFixed(0)}%` : '—'}
                        </Td>
                        <Td className="text-right tabular-nums">{stat.marked ? `${stat.passRate}%` : '—'}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>

                <p className="mt-4 text-xs leading-relaxed text-muted">
                  A mean far above 75% or below 45% usually says more about the assessment than the
                  cohort. Consider whether the question tested what you intended before adjusting
                  the teaching.
                </p>
              </CardBody>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle as="h2">Course content</CardTitle>
            </CardHeader>
            <CardBody className="space-y-2">
              {course.modules.map((module) => (
                <div key={module.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate">{module.title}</span>
                  <span className="shrink-0 text-xs text-muted">{module._count.lessons} lessons</span>
                </div>
              ))}
              <a href="/lecturer/builder" className="btn-secondary mt-3 w-full text-sm">
                Open course builder
              </a>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle as="h2">Assessment schedule</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              {course.assignments.map((assignment) => (
                <div key={assignment.id} className="rounded-xl border border-border p-3">
                  <p className="text-sm font-medium leading-snug">{assignment.title}</p>
                  <p className="mt-1 text-xs text-muted">
                    {Math.round(assignment.weight * 100)}% · due {formatDate(assignment.dueAt)}
                  </p>
                </div>
              ))}
              {course.quizzes.map((quiz) => (
                <div key={quiz.id} className="rounded-xl border border-border p-3">
                  <p className="text-sm font-medium leading-snug">{quiz.title}</p>
                  <p className="mt-1 text-xs text-muted">
                    {Math.round(quiz.weight * 100)}% · {quiz.durationMins} min
                    {quiz.proctored ? ' · proctored' : ''}
                    {quiz.published ? '' : ' · unpublished'}
                  </p>
                </div>
              ))}
            </CardBody>
          </Card>

          {atRisk.length > 0 ? (
            <Card className="border-danger/40">
              <CardHeader>
                <CardTitle as="h2">Students to contact</CardTitle>
              </CardHeader>
              <CardBody className="space-y-3">
                {atRisk.slice(0, 8).map((student) => (
                  <div key={student.userId}>
                    <p className="text-sm font-medium">{student.name}</p>
                    <ProgressBar
                      value={student.lessonsComplete}
                      max={Math.max(1, student.lessonsTotal)}
                      tone="danger"
                      className="mt-1"
                    />
                    <p className="mt-1 text-xs text-muted">
                      {student.runningMark > 0 ? `${student.runningMark.toFixed(0)}% running` : 'No marks yet'} ·{' '}
                      {student.submitted}/{student.expected} submitted
                    </p>
                  </div>
                ))}
                <p className="border-t border-border pt-3 text-xs leading-relaxed text-muted">
                  A short, specific message early — naming the piece of work and offering a deadline
                  extension — recovers more students than any automated nudge.
                </p>
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
