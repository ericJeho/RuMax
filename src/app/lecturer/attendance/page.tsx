import type { Metadata } from 'next';

import { EmptyState, PageHeader } from '@/components/ui';
import { AttendanceRegister } from './register';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const metadata: Metadata = { title: 'Attendance' };
export const dynamic = 'force-dynamic';

export default async function LecturerAttendancePage() {
  const user = await requireUser();

  const courses = await prisma.course.findMany({
    where: user.role === 'ADMIN' ? {} : { lecturerId: user.id },
    include: {
      registrations: {
        where: { status: 'APPROVED' },
        include: { user: { select: { id: true, firstName: true, lastName: true, studentNumber: true } } },
        orderBy: { user: { lastName: 'asc' } },
      },
    },
    orderBy: { code: 'asc' },
  });

  const withStudents = courses.filter((course) => course.registrations.length > 0);

  return (
    <>
      <PageHeader
        title="Attendance register"
        description="Mark a live session. Everyone defaults to present — change only the exceptions, which is how registers actually get filled in."
      />

      {withStudents.length === 0 ? (
        <EmptyState
          title="No enrolled students"
          description="Attendance can be taken once registrations are approved."
        />
      ) : (
        <AttendanceRegister
          courses={withStudents.map((course) => ({
            id: course.id,
            label: `${course.code} — ${course.title}`,
            students: course.registrations.map((registration) => ({
              id: registration.user.id,
              name: `${registration.user.firstName} ${registration.user.lastName}`,
              studentNumber: registration.user.studentNumber,
            })),
          }))}
        />
      )}
    </>
  );
}
