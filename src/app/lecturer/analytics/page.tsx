import type { Metadata } from 'next';
import { AlertTriangle } from 'lucide-react';

import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  PageHeader,
  StatCard,
  Table,
  Td,
  Th,
} from '@/components/ui';
import { ColumnChart, DonutChart } from '@/components/charts';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getCoursePerformance } from '@/lib/lecturer';

export const metadata: Metadata = { title: 'Student analytics' };
export const dynamic = 'force-dynamic';

/**
 * Teaching analytics.
 *
 * Everything on this page is chosen to be actionable: a distribution that shows a
 * bimodal cohort, students whose engagement has stopped, and where each course sits
 * against the others. Vanity metrics are deliberately absent.
 */
export default async function LecturerAnalyticsPage() {
  const user = await requireUser();

  const courses = await prisma.course.findMany({
    where: user.role === 'ADMIN' ? {} : { lecturerId: user.id },
    select: { id: true, code: true, title: true },
    orderBy: { code: 'asc' },
  });

  const performances = await Promise.all(
    courses.map(async (course) => ({ course, students: await getCoursePerformance(course.id) })),
  );

  const everyone = performances.flatMap((entry) => entry.students);
  const withMarks = everyone.filter((student) => student.runningMark > 0);
  const atRisk = everyone.filter((student) => student.atRisk);

  const bands = [
    { name: '0–39%', min: 0, max: 40 },
    { name: '40–49%', min: 40, max: 50 },
    { name: '50–59%', min: 50, max: 60 },
    { name: '60–69%', min: 60, max: 70 },
    { name: '70–79%', min: 70, max: 80 },
    { name: '80–100%', min: 80, max: 101 },
  ].map((band) => ({
    name: band.name,
    students: withMarks.filter((s) => s.runningMark >= band.min && s.runningMark < band.max).length,
  }));

  const engagement = [
    { name: 'Completed most material', value: everyone.filter((s) => s.lessonsTotal && s.lessonsComplete / s.lessonsTotal >= 0.7).length },
    { name: 'Partway through', value: everyone.filter((s) => s.lessonsTotal && s.lessonsComplete / s.lessonsTotal >= 0.3 && s.lessonsComplete / s.lessonsTotal < 0.7).length },
    { name: 'Barely started', value: everyone.filter((s) => !s.lessonsTotal || s.lessonsComplete / s.lessonsTotal < 0.3).length },
  ].filter((slice) => slice.value > 0);

  const meanMark = withMarks.length
    ? withMarks.reduce((sum, s) => sum + s.runningMark, 0) / withMarks.length
    : 0;

  return (
    <>
      <PageHeader
        title="Student analytics"
        description="Across every course you teach. The point of this page is to find the students an early conversation would help."
      />

      {courses.length === 0 ? (
        <EmptyState title="No courses" description="You are not assigned to any courses." />
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Students taught" value={everyone.length} />
            <StatCard label="Mean running mark" value={`${meanMark.toFixed(1)}%`} />
            <StatCard
              label="Pass rate (running)"
              value={
                withMarks.length
                  ? `${Math.round((withMarks.filter((s) => s.runningMark >= 50).length / withMarks.length) * 100)}%`
                  : '—'
              }
            />
            <StatCard
              label="Flagged at risk"
              value={atRisk.length}
              icon={atRisk.length > 0 ? <AlertTriangle size={18} aria-hidden /> : undefined}
              hint={atRisk.length > 0 ? 'Contact these students' : 'Nobody flagged'}
            />
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle as="h2">Mark distribution</CardTitle>
              </CardHeader>
              <CardBody>
                <ColumnChart data={bands} xKey="name" series={[{ key: 'students', label: 'Students' }]} />
                <p className="mt-3 text-xs leading-relaxed text-muted">
                  Two peaks usually mean two cohorts — often those who did the preparatory reading
                  and those who did not. One long tail at the bottom usually means an assessment
                  that was unclear rather than hard.
                </p>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle as="h2">Engagement with material</CardTitle>
              </CardHeader>
              <CardBody>
                {engagement.length > 0 ? (
                  <DonutChart data={engagement} centerLabel={String(everyone.length)} />
                ) : (
                  <p className="text-sm text-muted">No lesson progress recorded yet.</p>
                )}
              </CardBody>
            </Card>
          </div>

          {atRisk.length > 0 ? (
            <Card className="mb-6 border-danger/40">
              <CardHeader>
                <CardTitle as="h2">Students to contact ({atRisk.length})</CardTitle>
              </CardHeader>
              <CardBody className="p-0">
                <Table>
                  <caption className="sr-only">Students flagged as at risk</caption>
                  <thead>
                    <tr>
                      <Th>Student</Th>
                      <Th className="text-right">Running mark</Th>
                      <Th className="text-right">Submitted</Th>
                      <Th className="text-right">Material seen</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {atRisk.map((student) => (
                      <tr key={student.userId}>
                        <Td>
                          <span className="block font-medium">{student.name}</span>
                          <span className="block font-mono text-xs text-muted">{student.studentNumber}</span>
                        </Td>
                        <Td className="text-right tabular-nums">
                          {student.runningMark > 0 ? `${student.runningMark.toFixed(1)}%` : 'no marks'}
                        </Td>
                        <Td className="text-right tabular-nums">
                          {student.submitted}/{student.expected}
                        </Td>
                        <Td className="text-right tabular-nums">
                          {student.lessonsTotal
                            ? `${Math.round((student.lessonsComplete / student.lessonsTotal) * 100)}%`
                            : '—'}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </CardBody>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle as="h2">By course</CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              <Table>
                <caption className="sr-only">Summary statistics per course</caption>
                <thead>
                  <tr>
                    <Th>Course</Th>
                    <Th className="text-right">Enrolled</Th>
                    <Th className="text-right">Mean mark</Th>
                    <Th className="text-right">Pass rate</Th>
                    <Th className="text-right">At risk</Th>
                  </tr>
                </thead>
                <tbody>
                  {performances.map(({ course, students }) => {
                    const marked = students.filter((s) => s.runningMark > 0);
                    const mean = marked.length
                      ? marked.reduce((sum, s) => sum + s.runningMark, 0) / marked.length
                      : 0;
                    const flagged = students.filter((s) => s.atRisk).length;

                    return (
                      <tr key={course.id}>
                        <Td>
                          <span className="block font-mono text-xs text-muted">{course.code}</span>
                          <span className="block">{course.title}</span>
                        </Td>
                        <Td className="text-right tabular-nums">{students.length}</Td>
                        <Td className="text-right tabular-nums">{marked.length ? `${mean.toFixed(1)}%` : '—'}</Td>
                        <Td className="text-right tabular-nums">
                          {marked.length
                            ? `${Math.round((marked.filter((s) => s.runningMark >= 50).length / marked.length) * 100)}%`
                            : '—'}
                        </Td>
                        <Td className="text-right">
                          {flagged > 0 ? <Badge tone="danger">{flagged}</Badge> : <Badge tone="success">0</Badge>}
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </CardBody>
          </Card>
        </>
      )}
    </>
  );
}
