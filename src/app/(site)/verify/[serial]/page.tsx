import type { Metadata } from 'next';
import { ShieldCheck } from 'lucide-react';

import { VerifyForm } from '../verify-form';
import { SITE } from '@/lib/site';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ serial: string }>;
}): Promise<Metadata> {
  const { serial } = await params;
  return {
    title: `Verify ${serial}`,
    description: `Check the authenticity of RuMax credential ${serial}.`,
    robots: { index: false, follow: true },
  };
}

/**
 * Deep-linked verification. This is the URL encoded in each certificate's QR code, so
 * scanning it runs the check immediately rather than landing on an empty search box.
 */
export default async function VerifySerialPage({
  params,
}: {
  params: Promise<{ serial: string }>;
}) {
  const { serial } = await params;

  return (
    <section className="rx-container py-16">
      <div className="mb-10 text-center">
        <span className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-brand-gradient text-white">
          <ShieldCheck size={22} aria-hidden />
        </span>
        <h1 className="font-display text-3xl font-semibold">Credential verification</h1>
        <p className="mt-2 text-muted">
          Checking serial <span className="font-mono text-fg">{decodeURIComponent(serial)}</span> against{' '}
          {SITE.name}&rsquo;s register.
        </p>
      </div>

      <VerifyForm initialSerial={decodeURIComponent(serial).toUpperCase()} />
    </section>
  );
}
