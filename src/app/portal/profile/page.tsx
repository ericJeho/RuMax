import type { Metadata } from 'next';
import { Download, ShieldCheck, Trash2 } from 'lucide-react';

import { Avatar, Badge, Card, CardBody, CardHeader, CardTitle, PageHeader } from '@/components/ui';
import { ProfileForm } from './profile-form';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDate, formatDateTime } from '@/lib/format';
import { LANGUAGES } from '@/lib/site';

export const metadata: Metadata = { title: 'Profile & settings' };
export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const user = await requireUser();

  const [program, sessions] = await Promise.all([
    user.programId
      ? prisma.program.findUnique({
          where: { id: user.programId },
          include: { faculty: { select: { name: true } } },
        })
      : null,
    prisma.session.findMany({
      where: { userId: user.id, revokedAt: null, expiresAt: { gte: new Date() } },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
  ]);

  return (
    <>
      <PageHeader title="Profile & settings" description="Your details, security and data." />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle as="h2">Personal details</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="mb-6 flex items-center gap-4">
                <Avatar name={`${user.firstName} ${user.lastName}`} src={user.avatarUrl} size={64} />
                <div>
                  <p className="font-display text-lg font-semibold">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-sm text-muted">{user.email}</p>
                  <button className="mt-1.5 text-xs font-medium text-brand hover:underline">
                    Change photo
                  </button>
                </div>
              </div>

              <ProfileForm
                initial={{
                  phone: user.phone ?? '',
                  country: user.country ?? '',
                  city: user.city ?? '',
                  bio: user.bio ?? '',
                  locale: user.locale,
                  timezone: user.timezone,
                }}
                languages={LANGUAGES.map((l) => ({ code: l.code, label: `${l.native} (${l.label})` }))}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle as="h2">Your data</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4 text-sm leading-relaxed text-muted">
              <p>
                Under GDPR you can obtain a copy of everything we hold about you, correct anything
                inaccurate, and ask us to delete what we are not legally required to keep. Academic
                records must be retained for 40 years under the awarding regulations; everything
                else can be erased on request.
              </p>
              <div className="flex flex-wrap gap-2">
                <a href="/api/me/export" className="btn-secondary text-sm" download>
                  <Download size={14} aria-hidden />
                  Export my data
                </a>
                <button className="btn-secondary text-sm text-danger">
                  <Trash2 size={14} aria-hidden />
                  Request erasure
                </button>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle as="h2">Academic profile</CardTitle>
            </CardHeader>
            <CardBody>
              <dl className="space-y-3 text-sm">
                <Row label="Student number" value={user.studentNumber ?? '—'} mono />
                <Row label="Programme" value={program?.title ?? '—'} />
                <Row label="Faculty" value={program?.faculty.name ?? '—'} />
                <Row label="Year of study" value={String(user.yearOfStudy ?? '—')} />
                <Row label="Status" value={user.status.toLowerCase()} />
                <Row label="Admitted" value={formatDate(user.admittedAt)} />
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle as="h2">Security</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Two-factor authentication</p>
                  <p className="text-xs text-muted">
                    {user.twoFactorEnabled ? 'Enabled via authenticator app' : 'Not enabled'}
                  </p>
                </div>
                <Badge tone={user.twoFactorEnabled ? 'success' : 'warning'}>
                  {user.twoFactorEnabled ? 'On' : 'Off'}
                </Badge>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                <div>
                  <p className="text-sm font-medium">Password</p>
                  <p className="text-xs text-muted">
                    Last changed {formatDate(user.passwordChangedAt)}
                  </p>
                </div>
                <button className="text-sm font-medium text-brand hover:underline">Change</button>
              </div>

              <div className="border-t border-border pt-4">
                <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <ShieldCheck size={14} className="text-success" aria-hidden />
                  Active sessions
                </p>
                <ul className="space-y-2">
                  {sessions.map((session) => (
                    <li key={session.id} className="text-xs text-muted">
                      <span className="block truncate">
                        {session.userAgent?.slice(0, 60) ?? 'Unknown device'}
                      </span>
                      <span className="block">
                        {session.ip ?? 'unknown address'} · started{' '}
                        {formatDateTime(session.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
                <button className="mt-3 text-sm font-medium text-danger hover:underline">
                  Sign out of all other devices
                </button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className={`text-right font-medium capitalize ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
    </div>
  );
}
