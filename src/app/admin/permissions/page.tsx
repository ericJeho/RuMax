import type { Metadata } from 'next';
import { Check, Minus } from 'lucide-react';

import { Card, CardBody, CardHeader, CardTitle, PageHeader, Table, Td, Th } from '@/components/ui';
import { requireRole } from '@/lib/auth';
import { PERMISSIONS, ROLE_LABELS, can } from '@/lib/rbac';
import { prisma } from '@/lib/db';
import type { Role } from '@prisma/client';

export const metadata: Metadata = { title: 'Role permissions' };
export const dynamic = 'force-dynamic';

const ROLES: Role[] = ['APPLICANT', 'STUDENT', 'ALUMNI', 'LECTURER', 'REGISTRAR', 'FINANCE', 'ADMIN'];

/**
 * The permission matrix, rendered from the same table the API enforces.
 *
 * It is deliberately read-only: the matrix is code, reviewed and deployed like any other
 * security control. An administrator who could grant themselves `settings:write` from a
 * web form would make the audit log meaningless.
 */
export default async function PermissionsPage() {
  await requireRole('ADMIN');

  const counts = await prisma.user.groupBy({ by: ['role'], _count: { _all: true } });
  const byRole = new Map(counts.map((row) => [row.role, row._count._all]));

  return (
    <>
      <PageHeader
        title="Role permissions"
        description="Who can do what. This matrix is the single source of truth — the API, the navigation and this page all read from it."
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle as="h2">Accounts by role</CardTitle>
        </CardHeader>
        <CardBody>
          <dl className="grid gap-4 sm:grid-cols-4 lg:grid-cols-7">
            {ROLES.map((role) => (
              <div key={role}>
                <dt className="text-xs text-muted">{ROLE_LABELS[role]}</dt>
                <dd className="font-display text-2xl font-semibold">{byRole.get(role) ?? 0}</dd>
              </div>
            ))}
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-0">
          <Table>
            <caption className="sr-only">Permission matrix by role</caption>
            <thead>
              <tr>
                <Th className="sticky left-0 bg-surface">Permission</Th>
                {ROLES.map((role) => (
                  <Th key={role} className="text-center">
                    {ROLE_LABELS[role]}
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map((permission) => (
                <tr key={permission}>
                  <Td className="sticky left-0 bg-surface font-mono text-xs">{permission}</Td>
                  {ROLES.map((role) => (
                    <Td key={role} className="text-center">
                      {can(role, permission) ? (
                        <>
                          <Check size={15} className="mx-auto text-success" aria-hidden />
                          <span className="sr-only">granted</span>
                        </>
                      ) : (
                        <>
                          <Minus size={15} className="mx-auto text-muted/40" aria-hidden />
                          <span className="sr-only">not granted</span>
                        </>
                      )}
                    </Td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>
          <p className="border-t border-border px-4 py-3 text-xs leading-relaxed text-muted">
            To change a grant, edit <code className="text-brand">src/lib/rbac.ts</code> and deploy.
            Route handlers call <code className="text-brand">requireRole()</code> independently, so a
            change here without the corresponding route change grants nothing.
          </p>
        </CardBody>
      </Card>
    </>
  );
}
