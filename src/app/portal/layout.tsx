import { redirect } from 'next/navigation';

import { DashboardShell, type NavSection } from '@/components/dashboard/shell';
import { getCurrentUser } from '@/lib/auth';
import { ROLE_LABELS } from '@/lib/rbac';
import { prisma } from '@/lib/db';

/**
 * Student portal shell. `middleware.ts` has already checked the JWT role; this second
 * check hits the database, so a revoked or suspended session is caught here even when
 * the token itself is still within its lifetime.
 */
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/portal');
  if (!['STUDENT', 'ALUMNI', 'ADMIN'].includes(user.role)) redirect('/login');

  const [unreadNotifications, unreadMessages, openAssignments] = await Promise.all([
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
    prisma.message.count({ where: { recipientId: user.id, readAt: null } }),
    prisma.assignment.count({
      where: {
        published: true,
        dueAt: { gte: new Date() },
        course: { registrations: { some: { userId: user.id, status: 'APPROVED' } } },
        submissions: { none: { userId: user.id, status: { in: ['SUBMITTED', 'GRADED', 'RETURNED'] } } },
      },
    }),
  ]);

  const sections: NavSection[] = [
    {
      heading: 'Learning',
      items: [
        { label: 'Dashboard', href: '/portal', icon: '◈' },
        { label: 'My courses', href: '/portal/courses', icon: '▤' },
        { label: 'Timetable', href: '/portal/timetable', icon: '▦' },
        { label: 'Assignments', href: '/portal/assignments', icon: '✎', badge: openAssignments },
        { label: 'Quizzes & exams', href: '/portal/quizzes', icon: '◎' },
        { label: 'Discussion forums', href: '/portal/forums', icon: '❐' },
        { label: 'Digital library', href: '/portal/library', icon: '❏' },
      ],
    },
    {
      heading: 'Progress',
      items: [
        { label: 'Grades', href: '/portal/grades', icon: '◍' },
        { label: 'Transcript', href: '/portal/transcript', icon: '▧' },
        { label: 'Attendance', href: '/portal/attendance', icon: '✓' },
        { label: 'Graduation tracker', href: '/portal/graduation', icon: '★' },
        { label: 'Certificates', href: '/portal/certificates', icon: '▣' },
      ],
    },
    {
      heading: 'Administration',
      items: [
        { label: 'Course registration', href: '/portal/registration', icon: '⊞' },
        { label: 'Finance', href: '/portal/finance', icon: '$' },
        { label: 'Messages', href: '/portal/messages', icon: '✉', badge: unreadMessages },
        { label: 'Notifications', href: '/portal/notifications', icon: '◔', badge: unreadNotifications },
      ],
    },
    {
      heading: 'Support',
      items: [
        { label: 'AI tutor', href: '/portal/ai-tutor', icon: '✦' },
        { label: 'Academic advisor', href: '/portal/advisor', icon: '◇' },
        { label: 'Student ID', href: '/portal/student-id', icon: '▭' },
        { label: 'Profile & settings', href: '/portal/profile', icon: '⚙' },
      ],
    },
  ];

  return (
    <DashboardShell
      portalName="Student Portal"
      notificationCount={unreadNotifications}
      user={{
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: ROLE_LABELS[user.role],
        identifier: user.studentNumber ?? ROLE_LABELS[user.role],
        avatarUrl: user.avatarUrl,
      }}
      sections={sections}
    >
      {children}
    </DashboardShell>
  );
}
