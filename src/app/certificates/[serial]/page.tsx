import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import QRCode from 'qrcode';

import { prisma } from '@/lib/db';
import { env } from '@/lib/env';
import { isValidSerial } from '@/lib/certificates';
import { SITE } from '@/lib/site';

import './certificate.css';
import { PrintButton } from './print-button';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ serial: string }>;
}): Promise<Metadata> {
  const { serial } = await params;
  return {
    title: `Certificate ${decodeURIComponent(serial).toUpperCase()}`,
    // A certificate carries a named individual's award. It should be shareable by its
    // holder, not indexable by a search engine.
    robots: { index: false, follow: false },
  };
}

/**
 * How the award is conferred, by type.
 *
 * A single sentence cannot serve all five: "admitted to the degree of Certificate in
 * Educational Technology" is not English, and a transcript is not conferred at all.
 */
const CONFERRAL: Record<string, string> = {
  DEGREE: 'having satisfied the requirements prescribed by the Senate, has been admitted to the degree of',
  DIPLOMA: 'having satisfied the requirements prescribed by the Senate, has been awarded the',
  CERTIFICATE: 'having satisfied the requirements prescribed by the Senate, has been awarded the',
  COMPLETION: 'has completed, to the satisfaction of the examiners, the programme of study in',
  TRANSCRIPT: 'is recorded in the register of the university as having undertaken',
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** "the fourteenth day of August, two thousand and twenty-six" reads wrong on a screen. */
function formalDate(date: Date): string {
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/**
 * The certificate itself — an A4 landscape document, printable to PDF from the browser.
 *
 * There is no PDF generation library here on purpose. The browser's own print pipeline
 * produces a correct, selectable-text, vector PDF on every platform, honours @page, and
 * costs nothing to maintain. A server-side renderer would mean shipping a headless browser
 * to produce a worse version of what the user already has.
 *
 * Public by serial, like the verification page. A certificate is issued to be shown; the
 * serial is the capability, and it is long enough not to be guessable.
 */
export default async function CertificatePage({ params }: { params: Promise<{ serial: string }> }) {
  const { serial: rawSerial } = await params;
  const serial = decodeURIComponent(rawSerial).trim().toUpperCase();

  if (!isValidSerial(serial)) notFound();

  const certificate = await prisma.certificate.findUnique({
    where: { serial },
    include: {
      user: { select: { firstName: true, lastName: true } },
      program: { select: { title: true, level: true } },
    },
  });

  if (!certificate) notFound();

  const site = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  const verifyUrl = `${site}/verify/${serial}`;
  const verifyHost = site.replace(/^https?:\/\//, '');
  const qr = await QRCode.toString(verifyUrl, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 0,
    color: { dark: '#171410', light: '#00000000' },
  });

  const holder = `${certificate.user.firstName} ${certificate.user.lastName}`;

  return (
    <div className="sheet-wrap">
      <div className="controls">
        <Link href={`/verify/${serial}`}>← Verify this certificate</Link>
        <span className="note">
          Print to PDF for a vector copy. A4 landscape, margins off.
        </span>
        <PrintButton />
      </div>

      <article className="sheet" aria-label={`Certificate ${serial} awarded to ${holder}`}>
        <svg className="guilloche" aria-hidden focusable="false">
          <defs>
            <pattern id="engine" width="34" height="34" patternUnits="userSpaceOnUse">
              <circle cx="17" cy="17" r="15.5" fill="none" stroke="#2c3ea8" strokeWidth="0.6" />
              <circle cx="17" cy="17" r="9" fill="none" stroke="#ad7428" strokeWidth="0.5" />
              <circle cx="0" cy="0" r="15.5" fill="none" stroke="#2c3ea8" strokeWidth="0.4" />
              <circle cx="34" cy="34" r="15.5" fill="none" stroke="#2c3ea8" strokeWidth="0.4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#engine)" />
        </svg>

        <div className="inner">
          <header>
            <div className="crest">
              <span className="crest-mark" aria-hidden>
                R
              </span>
              <h1 className="university">{SITE.name}</h1>
            </div>
            <p className="motto">
              {SITE.motto} — {SITE.mottoTranslation}
            </p>
            <div className="rule" />
          </header>

          <div className="award">
            <p className="preamble">This is to certify that</p>
            <p className="recipient">{holder}</p>
            <div className="recipient-underline" />
            <p className="conferral">{CONFERRAL[certificate.type]}</p>
            <p className="award-title">{certificate.title}</p>
            {certificate.classification ? (
              <p className="classification">{certificate.classification}</p>
            ) : null}
            <p className="conferred-on">
              Conferred on {formalDate(certificate.issuedAt)} · Accreditation {SITE.registrationNumber}
            </p>
          </div>

          <footer className="footer">
            <div className="signature">
              <p className="signature-name">A. Okonkwo</p>
              <p className="signature-line">Vice-Chancellor</p>
            </div>

            <div className="verification">
              {/* The QR encodes the verification URL, so a scan runs the check rather than
                  landing on a search box. */}
              <div className="qr" dangerouslySetInnerHTML={{ __html: qr }} />
              <p className="serial">{serial}</p>
              <p className="verify-hint">Verify at {verifyHost}/verify</p>
            </div>

            <div className="signature">
              <p className="signature-name">S. Marchetti</p>
              <p className="signature-line">Registrar</p>
            </div>
          </footer>
        </div>

        {certificate.revoked ? (
          <div className="revoked-stamp" aria-label="This certificate has been revoked">
            <span>REVOKED</span>
          </div>
        ) : null}
      </article>
    </div>
  );
}
