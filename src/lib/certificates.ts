import { createHash } from 'node:crypto';

/**
 * Digital credential helpers.
 *
 * Every certificate carries a human-readable serial and a SHA-256 hash of its canonical
 * payload. The hash is what an employer's verification actually checks: re-deriving it
 * from the stored record must reproduce the value, so any tampering with the name,
 * programme or date invalidates the credential. In production the same hash is anchored
 * to a public chain (see docs/CERTIFICATES.md); the local record is the source of truth
 * either way.
 */

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 — avoids transcription errors

export type CertificatePayload = {
  serial: string;
  studentName: string;
  studentNumber: string;
  programTitle: string;
  certificateType: string;
  classification?: string | null;
  issuedAt: Date | string;
};

/** `RX-2025-7KQ4-M2P9` — year-scoped, unambiguous when read aloud or typed from paper. */
export function generateSerial(year = new Date().getFullYear()): string {
  const block = (length: number) =>
    Array.from({ length }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');
  return `RX-${year}-${block(4)}-${block(4)}`;
}

/**
 * Canonical JSON for hashing: fixed key order, dates normalised to ISO days, names
 * whitespace-collapsed. Two systems must be able to produce byte-identical input.
 */
export function canonicalise(payload: CertificatePayload): string {
  const issued =
    payload.issuedAt instanceof Date ? payload.issuedAt : new Date(payload.issuedAt);
  return JSON.stringify({
    certificateType: payload.certificateType,
    classification: payload.classification ?? null,
    issuedAt: issued.toISOString().slice(0, 10),
    programTitle: collapse(payload.programTitle),
    serial: payload.serial,
    studentName: collapse(payload.studentName),
    studentNumber: payload.studentNumber,
  });
}

export function hashCertificate(payload: CertificatePayload): string {
  return createHash('sha256').update(canonicalise(payload)).digest('hex');
}

export function verifyCertificateHash(payload: CertificatePayload, expectedHash: string): boolean {
  const actual = hashCertificate(payload);
  // Length-safe comparison; both values are hex digests of the same fixed length.
  if (actual.length !== expectedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i += 1) diff |= actual.charCodeAt(i) ^ expectedHash.charCodeAt(i);
  return diff === 0;
}

export function verificationUrl(serial: string, baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, '')}/verify/${encodeURIComponent(serial)}`;
}

/**
 * Shape check applied before a database lookup, so obvious junk never reaches the query.
 *
 * Note this accepts the full alphanumeric set, not the reduced {@link ALPHABET} the
 * generator draws from. Restricting *generation* avoids serials that are ambiguous when
 * read off paper; restricting *validation* the same way would reject serials issued under
 * an older scheme, or ones an employer typed correctly from a certificate we did issue.
 * Being strict on what we emit and liberal about what we accept is the right way round —
 * the lookup itself is what actually decides validity.
 */
export function isValidSerial(serial: string): boolean {
  return /^RX-\d{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(serial.trim().toUpperCase());
}

/** Student number format: `RX` + admission year + 5-digit sequence, e.g. RX2500184. */
export function formatStudentNumber(admissionYear: number, sequence: number): string {
  return `RX${String(admissionYear).slice(-2)}${String(sequence).padStart(5, '0')}`;
}

export function formatApplicationReference(sequence: number, year = new Date().getFullYear()): string {
  return `APP-${year}-${String(sequence).padStart(6, '0')}`;
}

export function formatInvoiceNumber(sequence: number, year = new Date().getFullYear()): string {
  return `INV-${year}-${String(sequence).padStart(6, '0')}`;
}

function collapse(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}
