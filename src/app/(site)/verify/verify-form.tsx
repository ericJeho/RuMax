'use client';

import { useState, type FormEvent } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Search, XCircle } from 'lucide-react';

import { Badge, Button, Card, CardBody } from '@/components/ui';
import { Input } from '@/components/ui/form';
import { formatDate } from '@/lib/format';

type Verification =
  | {
      valid: true;
      serial: string;
      holder: string;
      studentNumber: string | null;
      award: string;
      awardType: string;
      classification: string | null;
      issuedAt: string;
      documentHash: string;
      blockchainTx: string | null;
      issuer: { name: string; registration: string; accreditation: string };
      verifiedAt: string;
    }
  | { valid: false; reason: string; message: string; serial?: string };

export function VerifyForm({ initialSerial }: { initialSerial?: string }) {
  const [serial, setSerial] = useState(initialSerial ?? '');
  const [result, setResult] = useState<Verification | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function check(event?: FormEvent) {
    event?.preventDefault();
    setError(null);
    setResult(null);
    setPending(true);

    try {
      const response = await fetch(`/api/certificates/${encodeURIComponent(serial.trim())}`);
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error?.message ?? 'Verification service is unavailable. Try again shortly.');
        return;
      }
      setResult(data);
    } catch {
      setError('Could not reach the verification service. Check your connection.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <form onSubmit={check} className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="serial" className="sr-only">
          Certificate serial number
        </label>
        <Input
          id="serial"
          value={serial}
          onChange={(event) => setSerial(event.target.value.toUpperCase())}
          placeholder="RX-2025-DEMO-0001"
          className="font-mono uppercase tracking-wider"
          autoComplete="off"
          spellCheck={false}
        />
        <Button type="submit" size="lg" disabled={pending || serial.trim().length < 4} className="shrink-0">
          {pending ? (
            <Loader2 size={16} className="animate-spin" aria-hidden />
          ) : (
            <Search size={16} aria-hidden />
          )}
          Verify
        </Button>
      </form>

      <p className="mt-2 text-center text-xs text-muted">
        The serial is printed on the certificate and encoded in its QR code. Try{' '}
        <button
          type="button"
          onClick={() => setSerial('RX-2025-DEMO-0001')}
          className="font-mono text-brand hover:underline"
        >
          RX-2025-DEMO-0001
        </button>{' '}
        on this demonstration deployment.
      </p>

      <div aria-live="polite" className="mt-8">
        {error ? (
          <Card className="border-danger/40">
            <CardBody className="flex items-start gap-3">
              <AlertTriangle size={20} className="mt-0.5 shrink-0 text-danger" aria-hidden />
              <p className="text-sm">{error}</p>
            </CardBody>
          </Card>
        ) : null}

        {result && !result.valid ? (
          <Card className="border-danger/40">
            <CardBody>
              <p className="flex items-center gap-2 font-display text-lg font-semibold text-danger">
                <XCircle size={20} aria-hidden />
                Not verified
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{result.message}</p>
              {result.reason === 'integrity_failure' ? (
                <p className="mt-3 rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs leading-relaxed">
                  A serial that exists but fails its signature check is a serious matter. Please
                  report it to the registrar with the serial and where you obtained the document.
                </p>
              ) : null}
            </CardBody>
          </Card>
        ) : null}

        {result && result.valid ? (
          <Card className="border-success/40">
            <CardBody>
              <p className="flex items-center gap-2 font-display text-lg font-semibold text-success">
                <CheckCircle2 size={20} aria-hidden />
                Verified genuine
              </p>

              <dl className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                <Row label="Holder" value={result.holder} />
                <Row label="Student number" value={result.studentNumber ?? '—'} />
                <Row label="Award" value={result.award} />
                <Row
                  label="Type"
                  value={result.awardType.replace(/_/g, ' ').toLowerCase()}
                  className="capitalize"
                />
                {result.classification ? (
                  <Row label="Classification" value={result.classification} />
                ) : null}
                <Row label="Conferred" value={formatDate(result.issuedAt, 'en', { dateStyle: 'long' })} />
                <Row label="Issuing institution" value={result.issuer.name} />
                <Row label="Accreditation" value={result.issuer.accreditation} />
              </dl>

              {/* Someone checking a serial usually wants to see the document it belongs to,
                  not just confirmation that it exists. */}
              <a
                href={`/certificates/${result.serial}`}
                target="_blank"
                rel="noopener"
                className="btn-secondary mt-5 inline-flex text-sm"
              >
                View the certificate
              </a>

              <div className="mt-6 border-t border-border pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Cryptographic record
                </p>
                <p className="mt-1.5 break-all font-mono text-xs text-muted">
                  SHA-256 {result.documentHash}
                </p>
                {result.blockchainTx ? (
                  <p className="mt-1 break-all font-mono text-xs text-muted">
                    Anchor {result.blockchainTx}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge tone="success">Signature valid</Badge>
                  <Badge tone="brand">Serial {result.serial}</Badge>
                  <span className="text-xs text-muted">
                    Checked {formatDate(result.verifiedAt, 'en', { dateStyle: 'medium', timeStyle: 'short' })} UTC
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted">{label}</dt>
      <dd className={`mt-0.5 font-medium ${className ?? ''}`}>{value}</dd>
    </div>
  );
}
