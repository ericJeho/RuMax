import type { Metadata } from 'next';

import { Badge, Card, CardBody, PageHeader, StatCard, Table, Td, Th } from '@/components/ui';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const metadata: Metadata = { title: 'Courses' };
export const dynamic = 'force-dynamic';

export default async function AdminCoursesPage() {
  await requireRole('ADMIN', 'REGISTRAR');

  const courses = await prisma.course.findMany({
    include: {
      department: { select: { name: true } },
      lecturer: { select: { firstName: true, lastName: true } },
      _count: { select: { registrations: true, modules: true, assignments: true, quizzes: true } },
    },
    orderBy: { code: 'asc' },
  });

  const unstaffed = courses.filter((course) => !course.lecturerId);

  return (
    <>
      <PageHeader
        title="Courses"
        description="Every course, who teaches it, and whether it has enough content to run."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <StatCard label="Courses" value={courses.length} />
        <StatCard label="Published" value={courses.filter((c) => c.published).length} />
        <StatCard label="Without a lecturer" value={unstaffed.length} hint={unstaffed.length ? 'Needs assignment' : 'All staffed'} />
        <StatCard label="Total enrolments" value={courses.reduce((sum, c) => sum + c._count.registrations, 0)} />
      </div>

      <Card>
        <CardBody className="p-0">
          <Table>
            <caption className="sr-only">Course catalogue</caption>
            <thead>
              <tr>
                <Th>Code</Th>
                <Th>Course</Th>
                <Th>Department</Th>
                <Th>Lecturer</Th>
                <Th className="text-right">Credits</Th>
                <Th className="text-right">Units</Th>
                <Th className="text-right">Assessments</Th>
                <Th className="text-right">Enrolled</Th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id}>
                  <Td className="font-mono text-xs">{course.code}</Td>
                  <Td className="font-medium">{course.title}</Td>
                  <Td className="text-xs text-muted">{course.department?.name ?? '—'}</Td>
                  <Td className="text-xs">
                    {course.lecturer ? (
                      `${course.lecturer.firstName} ${course.lecturer.lastName}`
                    ) : (
                      <Badge tone="warning">Unassigned</Badge>
                    )}
                  </Td>
                  <Td className="text-right tabular-nums">{course.credits}</Td>
                  <Td className="text-right tabular-nums">{course._count.modules}</Td>
                  <Td className="text-right tabular-nums">
                    {course._count.assignments + course._count.quizzes}
                  </Td>
                  <Td className="text-right tabular-nums">{course._count.registrations}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardBody>
      </Card>
    </>
  );
}
