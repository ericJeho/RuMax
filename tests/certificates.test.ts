import { describe, expect, it } from 'vitest';

import {
  canonicalise,
  formatApplicationReference,
  formatInvoiceNumber,
  formatStudentNumber,
  generateSerial,
  hashCertificate,
  isValidSerial,
  verifyCertificateHash,
  verificationUrl,
  type CertificatePayload,
} from '@/lib/certificates';

const payload: CertificatePayload = {
  serial: 'RX-2025-DEMO-0001',
  studentName: 'Chikondi Banda',
  studentNumber: 'RX2300001',
  programTitle: 'BSc (Hons) Computer Science',
  certificateType: 'DEGREE',
  classification: 'First Class',
  issuedAt: new Date('2025-06-15T10:30:00Z'),
};

describe('generateSerial', () => {
  it('produces a serial in the documented format', () => {
    for (let i = 0; i < 50; i += 1) {
      expect(isValidSerial(generateSerial(2025))).toBe(true);
    }
  });

  it('omits characters that are ambiguous when transcribed', () => {
    const serials = Array.from({ length: 200 }, () => generateSerial(2025)).join('');
    const blocks = serials.replace(/RX-\d{4}-/g, '').replace(/-/g, '');
    expect(blocks).not.toMatch(/[IO01]/);
  });

  it('scopes the serial to the issuing year', () => {
    expect(generateSerial(2031).startsWith('RX-2031-')).toBe(true);
  });
});

describe('isValidSerial', () => {
  it('rejects malformed input without touching the database', () => {
    expect(isValidSerial('not-a-serial')).toBe(false);
    expect(isValidSerial('RX-25-ABCD-EFGH')).toBe(false);
    expect(isValidSerial('RX-2025-ABC-EFGH')).toBe(false);
    expect(isValidSerial('')).toBe(false);
  });

  it('accepts every serial the generator can emit', () => {
    for (let i = 0; i < 50; i += 1) {
      expect(isValidSerial(generateSerial())).toBe(true);
    }
  });

  it('accepts characters outside the generator alphabet', () => {
    // Validation must not reject a serial an employer typed correctly off a certificate
    // just because the current generator would not have produced those characters.
    expect(isValidSerial('RX-2025-DEMO-0001')).toBe(true);
    expect(isValidSerial('rx-2025-demo-0001')).toBe(true);
    expect(isValidSerial('  RX-2025-DEMO-0001  ')).toBe(true);
  });
});

describe('canonicalise', () => {
  it('is stable regardless of surrounding whitespace in names', () => {
    const spaced = canonicalise({ ...payload, studentName: '  Chikondi   Banda ' });
    expect(spaced).toBe(canonicalise(payload));
  });

  it('normalises the issue date to a calendar day', () => {
    const later = canonicalise({ ...payload, issuedAt: new Date('2025-06-15T23:59:59Z') });
    expect(later).toBe(canonicalise(payload));
  });

  it('accepts a date string as well as a Date', () => {
    expect(canonicalise({ ...payload, issuedAt: '2025-06-15T10:30:00Z' })).toBe(canonicalise(payload));
  });
});

describe('hashCertificate', () => {
  it('is deterministic', () => {
    expect(hashCertificate(payload)).toBe(hashCertificate(payload));
  });

  it('produces a SHA-256 hex digest', () => {
    expect(hashCertificate(payload)).toMatch(/^[0-9a-f]{64}$/);
  });

  it('changes if any material field is altered', () => {
    const original = hashCertificate(payload);
    expect(hashCertificate({ ...payload, studentName: 'Chikondi Bande' })).not.toBe(original);
    expect(hashCertificate({ ...payload, programTitle: 'BSc Computer Science' })).not.toBe(original);
    expect(hashCertificate({ ...payload, classification: 'Second Class (Upper Division)' })).not.toBe(original);
    expect(hashCertificate({ ...payload, issuedAt: new Date('2025-06-16T10:30:00Z') })).not.toBe(original);
    expect(hashCertificate({ ...payload, studentNumber: 'RX2300002' })).not.toBe(original);
  });
});

describe('verifyCertificateHash', () => {
  it('accepts the matching hash', () => {
    expect(verifyCertificateHash(payload, hashCertificate(payload))).toBe(true);
  });

  it('rejects a tampered record', () => {
    const stored = hashCertificate(payload);
    // Somebody edits the classification in the database but leaves the hash alone.
    expect(verifyCertificateHash({ ...payload, classification: 'First Class Honours' }, stored)).toBe(false);
  });

  it('rejects a hash of the wrong length without throwing', () => {
    expect(verifyCertificateHash(payload, 'abc123')).toBe(false);
  });
});

describe('verificationUrl', () => {
  it('builds a clean URL regardless of a trailing slash on the base', () => {
    expect(verificationUrl('RX-2025-DEMO-0001', 'https://rumax.edu/')).toBe(
      'https://rumax.edu/verify/RX-2025-DEMO-0001',
    );
    expect(verificationUrl('RX-2025-DEMO-0001', 'https://rumax.edu')).toBe(
      'https://rumax.edu/verify/RX-2025-DEMO-0001',
    );
  });
});

describe('identifier formats', () => {
  it('formats student numbers as RX + two-digit year + sequence', () => {
    expect(formatStudentNumber(2025, 184)).toBe('RX2500184');
    expect(formatStudentNumber(2023, 1)).toBe('RX2300001');
  });

  it('formats application and invoice references with a year scope', () => {
    expect(formatApplicationReference(42, 2025)).toBe('APP-2025-000042');
    expect(formatInvoiceNumber(7, 2025)).toBe('INV-2025-000007');
  });
});
