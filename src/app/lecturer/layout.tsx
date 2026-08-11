import { redirect } from 'next/navigation';

import { DashboardShell, type NavSection } from '@/components/dashboard/shell';
import { getCurrentUser } from '@/lib/auth';
import { ROLE_LABELS } from '@/lib/rbac';
import { prisma } from '@/lib/db';

export default async function LecturerLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/lecturer');
  if (!['LECTURER', 'ADMIN'].includes(user.role)) redirect('/login');

  const [toMark, unread] = await Promise.all([
    prisma.submission.count({
      where: {
        status: { in: ['SUBMITTED', 'LATE'] },
        assignment: { course: { lecturerId: user.id } },
      },
    }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);

  const sections: NavSection[] = [
    {
      heading: 'Teaching',
      items: [
        { label: 'Dashboard', href: '/lecturer', icon: '◈' },
        { label: 'My courses', href: '/lecturer/courses', icon: '▤' },
        { label: 'Course builder', href: '/lecturer/builder', icon: '✚' },
        { label: 'Live sessions', href: '/lecturer/sessions', icon: '◉' },
        { label: 'Office hours', href: '/lecturer/office-hours', icon: '◷' },
      ],
    },
    {
      heading: 'Assessment',
      items: [
        { label: 'Marking queue', href: '/lecturer/marking', icon: '✎', badge: toMark },
        { label: 'Assignments', href: '/lecturer/assignments', icon: '▥' },
        { label: 'Quiz builder', href: '/lecturer/quizzes', icon: '◎' },
        { label: 'Gradebook', href: '/lecturer/gradebook', icon: '◍' },
        { label: 'Attendance', href: '/lecturer/attendance', icon: '✓' },
      ],
    },
    {
      heading: 'Insight',
      items: [
        { label: 'Student analytics', href: '/lecturer/analytics', icon: '▲' },
        { label: 'Discussion boards', href: '/lecturer/forums', icon: '❐' },
        { label: 'Research', href: '/lecturer/research', icon: '⚗' },
      ],
    },
    {
      heading: 'Account',
      items: [
        { label: 'Messages', href: '/lecturer/messages', icon: '✉' },
        { label: 'Notifications', href: '/lecturer/notifications', icon: '◔', badge: unread },
      ],
    },
  ];

  return (
    <DashboardShell
      portalName="Lecturer Portal"
      notificationCount={unread}
      user={{
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: ROLE_LABELS[user.role],
        identifier: user.staffNumber ?? ROLE_LABELS[user.role],
        avatarUrl: user.avatarUrl,
      }}
      sections={sections}
    >
      {children}
    </DashboardShell>
  );
}
