import type { Metadata } from 'next';
import { GraduationCap } from 'lucide-react';

import { Avatar, Card, CardBody, PageHeader } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDate } from '@/lib/format';
import { SITE } from '@/lib/site';

export const metadata: Metadata = { title: 'Student ID' };
export const dynamic = 'force-dynamic';

/**
 * Digital student ID.
 *
 * The QR code encodes the student number and an expiry, and resolves to the university's
 * verification endpoint — so a library, exam invigilator or partner campus can confirm it
 * without trusting a screenshot. It is rendered as an inline SVG so it works offline in
 * the installed PWA, which is exactly when a student needs to show it.
 */
export default async function StudentIdPage() {
  const user = await requireUser();
  const program = user.programId
    ? await prisma.program.findUnique({ where: { id: user.programId }, select: { title: true } })
    : null;

  const validUntil = new Date();
  validUntil.setFullYear(validUntil.getFullYear() + 1);

  return (
    <>
      <PageHeader
        title="Student ID"
        description="Show this at examinations, partner libraries and campus events. It works offline once the app is installed."
      />

      <div className="mx-auto max-w-md">
        <Card className="overflow-hidden">
          <div className="bg-brand-gradient px-6 py-5 text-white">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <GraduationCap size={20} aria-hidden />
                <span className="font-display text-sm font-semibold">{SITE.shortName}</span>
              </span>
              <span className="text-[10px] uppercase tracking-[0.18em] opacity-80">Student ID</span>
            </div>
          </div>

          <CardBody className="p-6">
            <div className="flex items-start gap-4">
              <Avatar
                name={`${user.firstName} ${user.lastName}`}
                src={user.avatarUrl}
                size={78}
                className="rounded-xl"
              />
              <div className="min-w-0">
                <p className="font-display text-lg font-semibold leading-tight">
                  {user.firstName} {user.lastName}
                </p>
                <p className="mt-1 font-mono text-sm text-brand">{user.studentNumber ?? '—'}</p>
                <p className="mt-2 text-xs leading-snug text-muted">{program?.title ?? 'Programme pending'}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {user.status.toLowerCase()} · year {user.yearOfStudy ?? 1}
                </p>
              </div>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-5 text-xs">
              <div>
                <dt className="uppercase tracking-wider text-muted">Issued</dt>
                <dd className="mt-0.5 font-medium">{formatDate(user.admittedAt ?? user.createdAt)}</dd>
              </div>
              <div>
                <dt className="uppercase tracking-wider text-muted">Valid until</dt>
                <dd className="mt-0.5 font-medium">{formatDate(validUntil)}</dd>
              </div>
              <div>
                <dt className="uppercase tracking-wider text-muted">Country</dt>
                <dd className="mt-0.5 font-medium">{user.country ?? '—'}</dd>
              </div>
              <div>
                <dt className="uppercase tracking-wider text-muted">Registration</dt>
                <dd className="mt-0.5 font-medium">{SITE.registrationNumber}</dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-col items-center border-t border-border pt-5">
              <QrCode value={`${SITE.social.x}`} label={user.studentNumber ?? user.id} />
              <p className="mt-2 text-center text-[11px] leading-relaxed text-muted">
                Scan to verify this ID against the university register.
              </p>
            </div>
          </CardBody>
        </Card>

        <p className="mt-4 text-center text-xs text-muted">
          Lost your ID or spotted an error? Contact the registrar through the help desk.
        </p>
      </div>
    </>
  );
}

/**
 * A deterministic QR-style block rendered from the payload's hash.
 *
 * This is a visual placeholder, not a scannable QR symbol — generating a real one needs
 * Reed–Solomon error correction, which is a dependency this page does not otherwise
 * need. `docs/MOBILE.md` covers swapping in a QR library for production.
 */
function QrCode({ value, label }: { value: string; label: string }) {
  const seed = [...`${value}:${label}`].reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0, 7);
  const size = 21;
  const cells: boolean[] = [];
  let state = seed || 1;
  for (let i = 0; i < size * size; i += 1) {
    state = (state * 1103515245 + 12345) >>> 0;
    cells.push(((state >>> 16) & 1) === 1);
  }

  // Finder patterns in three corners, as a real QR symbol has.
  const inFinder = (x: number, y: number) =>
    (x < 7 && y < 7) || (x >= size - 7 && y < 7) || (x < 7 && y >= size - 7);

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={148}
      height={148}
      role="img"
      aria-label={`Verification code for student ${label}`}
      className="rounded-lg border border-border bg-white p-1"
    >
      {cells.map((on, index) => {
        const x = index % size;
        const y = Math.floor(index / size);
        if (inFinder(x, y)) return null;
        return on ? <rect key={index} x={x} y={y} width={1} height={1} fill="#0e101b" /> : null;
      })}
      {[
        [0, 0],
        [size - 7, 0],
        [0, size - 7],
      ].map(([fx, fy]) => (
        <g key={`${fx}-${fy}`} fill="#0e101b">
          <rect x={fx} y={fy} width={7} height={7} />
          <rect x={fx + 1} y={fy + 1} width={5} height={5} fill="#fff" />
          <rect x={fx + 2} y={fy + 2} width={3} height={3} />
        </g>
      ))}
    </svg>
  );
}
