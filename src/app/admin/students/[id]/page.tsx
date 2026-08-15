import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Card, CardBody, CardHeader, CardTitle, PageHeader } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { can, isStaff } from '@/lib/rbac';
import { formatDateTime } from '@/lib/format';

import { EditProfileForm } from './edit-form';

export const metadata: Metadata = { title: 'Edit record' };
export const dynamic = 'force-dynamic';

const ASSIGNABLE = ['APPLICANT', 'STUDENT', 'ALUMNI', 'LECTURER', 'REGISTRAR', 'FINANCE'] as const;

export default async function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireUser();
  const { id } = await params;

  const subject = await prisma.user.findUnique({ where: { id } });
  if (!subject) notFound();

  // The route handler enforces this again; this check exists so someone without the
  // permission sees a 404 rather than a form that fails on submit.
  const needed = isStaff(subject.role) ? 'staff:write' : 'student:write';
  if (!can(actor.role, needed)) notFound();

  const [programs, history] = await Promise.all([
    prisma.program.findMany({
      where: { published: true },
      select: { id: true, code: true, title: true },
      orderBy: { code: 'asc' },
    }),
    prisma.auditLog.findMany({
      where: { entityType: 'User', entityId: id, action: 'user.update' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { user: { select: { firstName: true, lastName: true } } },
    }),
  ]);

  const assignableRoles = actor.role === 'ADMIN' ? [...ASSIGNABLE, 'ADMIN'] : [...ASSIGNABLE];

  return (
    <>
      <PageHeader
        title={`${subject.firstName} ${subject.lastName}`}
        description={
          isStaff(subject.role)
            ? 'Staff record. Changes are written to the audit log with a reason.'
            : 'Student record. Changes are written to the audit log with a reason.'
        }
      />

      <p className="mb-6 text-sm">
        <Link href="/admin/students" className="text-brand hover:underline">
          ← Back to students
        </Link>
      </p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
        <Card>
          <CardBody>
            <EditProfileForm
              subject={{
                id: subject.id,
                firstName: subject.firstName,
                lastName: subject.lastName,
                email: subject.email,
                phone: subject.phone,
                country: subject.country,
                gender: subject.gender,
                dateOfBirth: subject.dateOfBirth ? subject.dateOfBirth.toISOString() : null,
                studentNumber: subject.studentNumber,
                programId: subject.programId,
                yearOfStudy: subject.yearOfStudy,
                status: subject.status,
                role: subject.role,
              }}
              programs={programs}
              assignableRoles={assignableRoles}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h2">Change history</CardTitle>
          </CardHeader>
          <CardBody>
            {history.length === 0 ? (
              <p className="text-sm text-muted">No corrections have been made to this record.</p>
            ) : (
              <ol className="space-y-4">
                {history.map((entry) => {
                  const metadata = (entry.metadata ?? {}) as {
                    reason?: string;
                    changes?: Record<string, { from: unknown; to: unknown }>;
                  };
                  return (
                    <li key={entry.id} className="border-l-2 border-border pl-3">
                      <p className="text-xs text-muted">
                        {formatDateTime(entry.createdAt)} ·{' '}
                        {entry.user ? `${entry.user.firstName} ${entry.user.lastName}` : 'Unknown'}
                      </p>
                      {metadata.reason ? <p className="mt-1 text-sm">{metadata.reason}</p> : null}
                      {metadata.changes ? (
                        <ul className="mt-1 space-y-0.5">
                          {Object.entries(metadata.changes).map(([field, change]) => (
                            <li key={field} className="text-xs text-muted">
                              <span className="font-medium text-fg">{field}</span>{' '}
                              <span className="line-through">{String(change.from ?? '—')}</span> →{' '}
                              {String(change.to ?? '—')}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
