import type { Metadata } from 'next';
import { FileSearch, QrCode, ShieldCheck } from 'lucide-react';

import { Card, CardBody, SectionHeading } from '@/components/ui';
import { VerifyForm } from './verify-form';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Verify a certificate',
  description:
    'Check the authenticity of any RuMax Global Digital University award instantly. Enter the serial printed on the certificate — no account required.',
  alternates: { canonical: '/verify' },
};

export default function VerifyPage() {
  return (
    <>
      <section className="border-b border-border bg-mesh">
        <div className="rx-container py-16 text-center">
          <span className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-brand-gradient text-white">
            <ShieldCheck size={26} aria-hidden />
          </span>
          <h1 className="font-display text-4xl font-semibold sm:text-5xl">Verify a credential</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">
            Every award {SITE.shortName} issues carries a unique serial and a cryptographic hash.
            Enter the serial to confirm the holder, the award and the date it was conferred — free,
            instant, and no account needed.
          </p>
        </div>
      </section>

      <section className="rx-container py-14">
        <VerifyForm />
      </section>

      <section className="border-t border-border bg-surface-2/40 py-16">
        <div className="rx-container">
          <SectionHeading
            align="center"
            eyebrow="How it works"
            title="Why you can trust the answer"
            description="Verification is not a lookup in a list that anyone could edit."
          />

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: FileSearch,
                title: 'Signed at issue',
                body: 'When Senate confers an award we hash the holder, the award, the classification and the date into a SHA-256 digest and store it with the record.',
              },
              {
                icon: ShieldCheck,
                title: 'Recomputed at check',
                body: 'Every verification recalculates the hash from the live record. If any field has been altered — even a middle name — the digest no longer matches and the check fails.',
              },
              {
                icon: QrCode,
                title: 'Anchored publicly',
                body: 'The digest is also written to a public chain, so the university itself cannot rewrite history without it being visible.',
              },
            ].map((item) => (
              <Card key={item.title} className="p-6">
                <item.icon size={22} className="mb-3 text-brand" aria-hidden />
                <h3 className="font-display text-base font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
              </Card>
            ))}
          </div>

          <Card className="mx-auto mt-10 max-w-3xl">
            <CardBody>
              <h2 className="font-display text-base font-semibold">For employers and institutions</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Bulk verification and an API for HR systems are available at no cost. The endpoint
                is <code className="rounded bg-surface-2 px-1.5 py-0.5 text-brand">GET /api/certificates/:serial</code>{' '}
                and returns JSON. Rate limited to 30 requests a minute per address; contact{' '}
                <a href={`mailto:${SITE.supportEmail}`} className="text-brand underline">
                  {SITE.supportEmail}
                </a>{' '}
                for a higher allowance.
              </p>
            </CardBody>
          </Card>
        </div>
      </section>
    </>
  );
}
