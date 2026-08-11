import { redirect } from 'next/navigation';

import { DashboardShell, type NavSection } from '@/components/dashboard/shell';
import { getCurrentUser } from '@/lib/auth';
import { ROLE_LABELS } from '@/lib/rbac';
import { prisma } from '@/lib/db';

/**
 * Administration shell.
 *
 * Three roles share this area with different reach: ADMIN sees everything, REGISTRAR the
 * academic and admissions modules, FINANCE only the money. The navigation is filtered
 * here and every route re-checks with `requireRole` — hiding a link is presentation, not
 * security.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/admin');
  if (!['ADMIN', 'REGISTRAR', 'FINANCE'].includes(user.role)) redirect('/login');

  const [pendingApplications, pendingRegistrations, unread] = await Promise.all([
    prisma.application.count({ where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } } }),
    prisma.registration.count({ where: { status: 'PENDING' } }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);

  const isFinanceOnly = user.role === 'FINANCE';
  const isAdmin = user.role === 'ADMIN';

  const sections: NavSection[] = [
    {
      heading: 'Overview',
      items: [
        { label: 'Dashboard', href: '/admin', icon: '◈' },
        { label: 'Analytics', href: '/admin/analytics', icon: '▲' },
        { label: 'Reports', href: '/admin/reports', icon: '▤' },
      ],
    },
    ...(isFinanceOnly
      ? []
      : [
          {
            heading: 'Academic',
            items: [
              { label: 'Admissions', href: '/admin/admissions', icon: '⊕', badge: pendingApplications },
              { label: 'Registrations', href: '/admin/registrations', icon: '⊞', badge: pendingRegistrations },
              { label: 'Students', href: '/admin/students', icon: '☺' },
              { label: 'Staff', href: '/admin/staff', icon: '✦' },
              { label: 'Programmes', href: '/admin/programs', icon: '▦' },
              { label: 'Courses', href: '/admin/courses', icon: '▥' },
              { label: 'Academic calendar', href: '/admin/calendar', icon: '▩' },
              { label: 'Certificates', href: '/admin/certificates', icon: '▣' },
            ],
          },
        ]),
    {
      heading: 'Operations',
      items: [
        { label: 'Finance', href: '/admin/finance', icon: '$' },
        ...(isFinanceOnly
          ? []
          : [
              { label: 'Scholarships', href: '/admin/scholarships', icon: '★' },
              { label: 'Library', href: '/admin/library', icon: '❏' },
              { label: 'Research', href: '/admin/research', icon: '⚗' },
              { label: 'Announcements', href: '/admin/announcements', icon: '◆' },
              { label: 'Content (CMS)', href: '/admin/content', icon: '✎' },
            ]),
      ],
    },
    ...(isAdmin
      ? [
          {
            heading: 'System',
            items: [
              { label: 'Audit log', href: '/admin/audit', icon: '◍' },
              { label: 'Role permissions', href: '/admin/permissions', icon: '⚿' },
              { label: 'Settings', href: '/admin/settings', icon: '⚙' },
            ],
          },
        ]
      : []),
  ];

  return (
    <DashboardShell
      portalName="Administration"
      notificationCount={unread}
      user={{
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: ROLE_LABELS[user.role],
        identifier: ROLE_LABELS[user.role],
        avatarUrl: user.avatarUrl,
      }}
      sections={sections}
    >
      {children}
    </DashboardShell>
  );
}
