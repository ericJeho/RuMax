import type { Metadata } from 'next';

import { Badge, Card, CardBody, PageHeader, Table, Td, Th } from '@/components/ui';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDateTime } from '@/lib/format';

export const metadata: Metadata = { title: 'Audit log' };
export const dynamic = 'force-dynamic';

/**
 * The audit trail.
 *
 * Append-only by design — there is no edit or delete path anywhere in the codebase. Under
 * FERPA and GDPR the university must be able to say who saw or changed a student record
 * and when, and a log that can be quietly rewritten cannot answer that.
 */
export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  await requireRole('ADMIN');
  const { action } = await searchParams;

  const [entries, actions] = await Promise.all([
    prisma.auditLog.findMany({
      where: action ? { action: { startsWith: action } } : {},
      include: { user: { select: { firstName: true, lastName: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    prisma.auditLog.groupBy({ by: ['action'], _count: { _all: true }, orderBy: { _count: { action: 'desc' } }, take: 12 }),
  ]);

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Every consequential action, appended and never edited. Retained for seven years."
      />

      <div className="mb-6 flex flex-wrap gap-1.5">
        <a href="/admin/audit" className={`badge ${!action ? 'border-brand text-brand' : ''}`}>
          All ({entries.length})
        </a>
        {actions.map((entry) => (
          <a
            key={entry.action}
            href={`/admin/audit?action=${encodeURIComponent(entry.action)}`}
            className={`badge ${action === entry.action ? 'border-brand text-brand' : ''}`}
          >
            {entry.action} ({entry._count._all})
          </a>
        ))}
      </div>

      <Card>
        <CardBody className="p-0">
          <Table>
            <caption className="sr-only">Audit log entries</caption>
            <thead>
              <tr>
                <Th>When</Th>
                <Th>Who</Th>
                <Th>Action</Th>
                <Th>Entity</Th>
                <Th>Detail</Th>
                <Th>IP</Th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <Td className="whitespace-nowrap text-xs">{formatDateTime(entry.createdAt)}</Td>
                  <Td className="text-xs">
                    {entry.user ? (
                      <>
                        <span className="block font-medium">
                          {entry.user.firstName} {entry.user.lastName}
                        </span>
                        <span className="block capitalize text-muted">{entry.user.role.toLowerCase()}</span>
                      </>
                    ) : (
                      <span className="text-muted">system / anonymous</span>
                    )}
                  </Td>
                  <Td>
                    <Badge tone={entry.action.includes('failed') ? 'danger' : 'neutral'}>{entry.action}</Badge>
                  </Td>
                  <Td className="text-xs text-muted">
                    {entry.entityType ? `${entry.entityType}` : '—'}
                    {entry.entityId ? <span className="block font-mono">{entry.entityId.slice(0, 12)}…</span> : null}
                  </Td>
                  <Td className="max-w-64 truncate text-xs text-muted">
                    {entry.metadata ? JSON.stringify(entry.metadata) : '—'}
                  </Td>
                  <Td className="font-mono text-xs text-muted">{entry.ip ?? '—'}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardBody>
      </Card>
    </>
  );
}
