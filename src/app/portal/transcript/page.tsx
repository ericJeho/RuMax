import type { Metadata } from 'next';
import { Printer } from 'lucide-react';

import { Card, CardBody, PageHeader, Table, Td, Th } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { getTranscript } from '@/lib/student';
import { classify } from '@/lib/grading';
import { formatDate } from '@/lib/format';
import { SITE } from '@/lib/site';

export const metadata: Metadata = { title: 'Academic transcript' };
export const dynamic = 'force-dynamic';

export default async function TranscriptPage() {
  const user = await requireUser();
  const { terms, cgpa, totalCredits } = await getTranscript(user.id);

  return (
    <>
      <div className="no-print">
        <PageHeader
          title="Academic transcript"
          description="An unofficial copy of your record. Official sealed transcripts are issued by the registrar and carry a verification code."
          actions={
            <a href="/api/transcripts/me" className="btn-secondary text-sm" download>
              <Printer size={14} aria-hidden />
              Download PDF data
            </a>
          }
        />
      </div>

      <Card className="mx-auto max-w-4xl">
        <CardBody className="p-8 sm:p-12">
          {/* Document header, styled to print cleanly on A4. */}
          <header className="mb-8 border-b border-border pb-6 text-center">
            <p className="font-display text-xl font-semibold">{SITE.name}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted">
              Official academic record — unofficial copy
            </p>
            <p className="mt-3 text-xs text-muted">
              {SITE.address} · Registered {SITE.registrationNumber}
            </p>
          </header>

          <dl className="mb-8 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
            <Row label="Student name" value={`${user.firstName} ${user.lastName}`} />
            <Row label="Student number" value={user.studentNumber ?? '—'} />
            <Row label="Programme" value={(await programTitle(user.programId)) ?? '—'} />
            <Row label="Date of admission" value={formatDate(user.admittedAt)} />
            <Row label="Status" value={user.status.toLowerCase()} />
            <Row label="Issued" value={formatDate(new Date())} />
          </dl>

          {terms.map((term) => (
            <section key={term.name} className="mb-6">
              <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wider">
                {term.name}
              </h2>
              <Table>
                <thead>
                  <tr>
                    <Th>Code</Th>
                    <Th>Course title</Th>
                    <Th className="text-right">Credits</Th>
                    <Th className="text-right">Mark</Th>
                    <Th className="text-right">Grade</Th>
                    <Th className="text-right">Point</Th>
                  </tr>
                </thead>
                <tbody>
                  {term.entries.map((grade) => (
                    <tr key={grade.id}>
                      <Td className="font-mono text-xs">{grade.course.code}</Td>
                      <Td>{grade.course.title}</Td>
                      <Td className="text-right tabular-nums">{grade.credits}</Td>
                      <Td className="text-right tabular-nums">{grade.score.toFixed(1)}</Td>
                      <Td className="text-right">{grade.letter}</Td>
                      <Td className="text-right tabular-nums">{grade.gradePoint.toFixed(1)}</Td>
                    </tr>
                  ))}
                  <tr className="font-medium">
                    <Td colSpan={2}>Term summary</Td>
                    <Td className="text-right tabular-nums">{term.credits}</Td>
                    <Td colSpan={2} className="text-right">
                      Term GPA
                    </Td>
                    <Td className="text-right tabular-nums">{term.gpa.toFixed(2)}</Td>
                  </tr>
                </tbody>
              </Table>
            </section>
          ))}

          <div className="mt-8 border-t border-border pt-6">
            <dl className="grid gap-3 text-sm sm:grid-cols-3">
              <Row label="Total credits passed" value={String(totalCredits)} />
              <Row label="Cumulative GPA" value={cgpa.toFixed(2)} />
              <Row label="Classification (provisional)" value={classify(cgpa)} />
            </dl>
          </div>

          <footer className="mt-10 border-t border-border pt-5 text-xs leading-relaxed text-muted">
            <p>
              Grading scale: A+ 90–100 (4.0), A 85–89 (4.0), A− 80–84 (3.7), B+ 75–79 (3.3), B 70–74
              (3.0), B− 65–69 (2.7), C+ 60–64 (2.3), C 55–59 (2.0), C− 50–54 (1.7), D 45–49 (1.0),
              F below 45 (0.0). Pass mark 50%.
            </p>
            <p className="mt-2">
              This copy is generated from the live student record and is not a certified document.
              Employers and institutions should request verification from the registrar or check a
              sealed transcript at {SITE.social.linkedin.replace('https://www.linkedin.com/school/', '')}
              /verify.
            </p>
          </footer>
        </CardBody>
      </Card>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted">{label}</dt>
      <dd className="mt-0.5 font-medium capitalize">{value}</dd>
    </div>
  );
}

async function programTitle(programId: string | null): Promise<string | null> {
  if (!programId) return null;
  const { prisma } = await import('@/lib/db');
  const program = await prisma.program.findUnique({ where: { id: programId }, select: { title: true } });
  return program?.title ?? null;
}
