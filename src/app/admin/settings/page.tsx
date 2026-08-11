import type { Metadata } from 'next';
import { Check, X } from 'lucide-react';

import { Badge, Card, CardBody, CardHeader, CardTitle, PageHeader, Table, Td, Th } from '@/components/ui';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { integrations } from '@/lib/env';
import { SITE } from '@/lib/site';
import { formatDateTime } from '@/lib/format';

export const metadata: Metadata = { title: 'System settings' };
export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  await requireRole('ADMIN');
  const settings = await prisma.systemSetting.findMany({ orderBy: { key: 'asc' } });

  const services: { name: string; on: boolean; note: string }[] = [
    { name: 'AI services (Claude)', on: integrations.ai, note: 'Tutor, feedback drafts, quiz suggestions' },
    { name: 'Stripe', on: integrations.stripe, note: 'Card payments' },
    { name: 'PayPal', on: integrations.paypal, note: 'Wallet payments' },
    { name: 'Flutterwave', on: integrations.flutterwave, note: 'Pan-African payments' },
    { name: 'Paystack', on: integrations.paystack, note: 'West African payments' },
    { name: 'Airtel Money', on: integrations.airtelMoney, note: 'Mobile money' },
    { name: 'TNM Mpamba', on: integrations.tnmMpamba, note: 'Mobile money' },
    { name: 'AWS S3', on: integrations.s3, note: 'Uploads and media' },
    { name: 'Zoom', on: integrations.zoom, note: 'Live sessions' },
    { name: 'Email (SMTP)', on: integrations.email, note: 'Transactional mail' },
    { name: 'Redis', on: integrations.redis, note: 'Shared cache and rate limiting' },
  ];

  return (
    <>
      <PageHeader
        title="System settings"
        description="Feature flags, tenant configuration and the status of every external integration."
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle as="h2">Integration status</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            <Table>
              <caption className="sr-only">Configured integrations</caption>
              <thead>
                <tr>
                  <Th>Service</Th>
                  <Th>Used for</Th>
                  <Th className="text-right">Status</Th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.name}>
                    <Td className="font-medium">{service.name}</Td>
                    <Td className="text-xs text-muted">{service.note}</Td>
                    <Td className="text-right">
                      <Badge tone={service.on ? 'success' : 'neutral'}>
                        {service.on ? (
                          <>
                            <Check size={11} aria-hidden /> Configured
                          </>
                        ) : (
                          <>
                            <X size={11} aria-hidden /> Not configured
                          </>
                        )}
                      </Badge>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <p className="border-t border-border px-4 py-3 text-xs leading-relaxed text-muted">
              Unconfigured services degrade rather than fail: AI falls back to an offline responder,
              payments settle locally so the journey can be demonstrated, and uploads are stored on
              the local filesystem. Configure them in the environment, never in the database.
            </p>
          </CardBody>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle as="h2">Tenant configuration</CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              <Table>
                <caption className="sr-only">System settings stored in the database</caption>
                <thead>
                  <tr>
                    <Th>Key</Th>
                    <Th>Value</Th>
                    <Th>Updated</Th>
                  </tr>
                </thead>
                <tbody>
                  {settings.map((setting) => (
                    <tr key={setting.key}>
                      <Td className="font-mono text-xs">{setting.key}</Td>
                      <Td className="font-mono text-xs">{JSON.stringify(setting.value)}</Td>
                      <Td className="whitespace-nowrap text-xs text-muted">
                        {formatDateTime(setting.updatedAt)}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {settings.length === 0 ? <p className="p-5 text-sm text-muted">No settings stored.</p> : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle as="h2">Institution</CardTitle>
            </CardHeader>
            <CardBody>
              <dl className="space-y-2 text-sm">
                <Row label="Name" value={SITE.name} />
                <Row label="Registration" value={SITE.registrationNumber} />
                <Row label="Founded" value={String(SITE.founded)} />
                <Row label="Admissions email" value={SITE.email} />
                <Row label="Support email" value={SITE.supportEmail} />
              </dl>
              <p className="mt-4 text-xs leading-relaxed text-muted">
                These values live in <code className="text-brand">src/lib/site.ts</code> and are
                rendered across the public site, certificates and transcripts.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
