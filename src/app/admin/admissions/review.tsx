'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, FileText, Loader2, XCircle } from 'lucide-react';

import {
  Badge,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  StatusBadge,
} from '@/components/ui';
import { Textarea } from '@/components/ui/form';
import { useToast } from '@/components/ui/interactive';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';

type ApplicationView = {
  id: string;
  reference: string;
  status: string;
  name: string;
  email: string;
  phone: string | null;
  country: string | null;
  nationality: string | null;
  program: string;
  level: string;
  qualification: string | null;
  institution: string | null;
  graduationYear: number | null;
  gpa: string | null;
  personalStatement: string | null;
  intakeTerm: string | null;
  feePaid: boolean;
  reviewNotes: string | null;
  submittedAt: string | null;
  documents: { id: string; type: string; fileName: string; verified: boolean }[];
};

/** Required supporting documents. Missing any of these blocks an offer. */
const REQUIRED_DOCUMENTS = ['PASSPORT_PHOTO', 'ACADEMIC_CERTIFICATE', 'TRANSCRIPT'];

const DECISIONS = [
  { action: 'UNDER_REVIEW', label: 'Begin review', tone: 'secondary' as const },
  { action: 'INTERVIEW', label: 'Invite to interview', tone: 'secondary' as const },
  { action: 'OFFER_MADE', label: 'Make offer', tone: 'primary' as const },
  { action: 'ENROLLED', label: 'Enrol student', tone: 'accent' as const },
  { action: 'REJECTED', label: 'Reject', tone: 'danger' as const },
];

export function AdmissionsReview({ applications }: { applications: ApplicationView[] }) {
  const router = useRouter();
  const toast = useToast();
  const [selectedId, setSelectedId] = useState(applications[0]?.id ?? '');
  const [notes, setNotes] = useState('');
  const [pending, setPending] = useState<string | null>(null);

  const application = applications.find((a) => a.id === selectedId);

  const missingDocuments = application
    ? REQUIRED_DOCUMENTS.filter(
        (type) => !application.documents.some((document) => document.type === type),
      )
    : [];

  async function decide(action: string) {
    if (!application) return;
    setPending(action);

    try {
      const response = await fetch(`/api/applications/${application.id}/decision`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: action, notes: notes || undefined }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.push({ tone: 'danger', title: 'Decision not saved', body: data?.error?.message ?? 'Try again.' });
        return;
      }

      toast.push({
        tone: 'success',
        title: `Application ${action.replace(/_/g, ' ').toLowerCase()}`,
        body: data.studentNumber
          ? `${application.name} enrolled as ${data.studentNumber}.`
          : `${application.name} has been notified.`,
      });
      setNotes('');
      router.refresh();
    } catch {
      toast.push({ tone: 'danger', title: 'Offline', body: 'Could not reach the server.' });
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      {/* Queue */}
      <Card className="h-fit">
        <CardHeader>
          <CardTitle as="h2">Queue ({applications.length})</CardTitle>
        </CardHeader>
        <CardBody className="max-h-[36rem] space-y-1.5 overflow-y-auto p-3">
          {applications.map((entry) => (
            <button
              key={entry.id}
              onClick={() => {
                setSelectedId(entry.id);
                setNotes('');
              }}
              className={cn(
                'w-full rounded-xl border p-3 text-left transition',
                entry.id === selectedId
                  ? 'border-brand bg-brand/5'
                  : 'border-border hover:bg-surface-2',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{entry.name}</span>
                  <span className="block truncate text-xs text-muted">{entry.program}</span>
                </span>
                <StatusBadge status={entry.status} />
              </div>
              <span className="mt-1 block font-mono text-[11px] text-muted">{entry.reference}</span>
            </button>
          ))}
        </CardBody>
      </Card>

      {/* Detail */}
      {application ? (
        <Card>
          <CardHeader className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle as="h2">{application.name}</CardTitle>
              <p className="mt-0.5 font-mono text-xs text-muted">{application.reference}</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <StatusBadge status={application.status} />
              <Badge tone={application.feePaid ? 'success' : 'warning'}>
                {application.feePaid ? 'Fee paid' : 'Fee outstanding'}
              </Badge>
            </div>
          </CardHeader>

          <CardBody>
            <dl className="mb-6 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
              <Row label="Programme" value={application.program} />
              <Row label="Level" value={application.level.replace(/_/g, ' ').toLowerCase()} />
              <Row label="Email" value={application.email} />
              <Row label="Phone" value={application.phone ?? '—'} />
              <Row label="Country" value={application.country ?? '—'} />
              <Row label="Nationality" value={application.nationality ?? '—'} />
              <Row label="Highest qualification" value={application.qualification ?? '—'} />
              <Row label="Institution" value={application.institution ?? '—'} />
              <Row label="Graduated" value={application.graduationYear?.toString() ?? '—'} />
              <Row label="GPA / grade" value={application.gpa ?? '—'} />
              <Row label="Intake" value={application.intakeTerm ?? '—'} />
              <Row
                label="Submitted"
                value={application.submittedAt ? formatDate(application.submittedAt) : 'Not submitted'}
              />
            </dl>

            {application.personalStatement ? (
              <section className="mb-6">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                  Personal statement
                </h3>
                <p className="whitespace-pre-wrap rounded-xl border border-border bg-surface-2/50 p-4 text-sm leading-relaxed">
                  {application.personalStatement}
                </p>
              </section>
            ) : null}

            <section className="mb-6">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                Supporting documents ({application.documents.length})
              </h3>

              {missingDocuments.length > 0 ? (
                <p className="mb-3 flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
                  <XCircle size={14} className="mt-0.5 shrink-0" aria-hidden />
                  Missing: {missingDocuments.map((type) => type.replace(/_/g, ' ').toLowerCase()).join(', ')}.
                  An offer cannot be made until these are supplied.
                </p>
              ) : (
                <p className="mb-3 flex items-center gap-2 text-xs text-success">
                  <CheckCircle2 size={14} aria-hidden />
                  All required documents present.
                </p>
              )}

              <ul className="space-y-1.5">
                {application.documents.map((document) => (
                  <li
                    key={document.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <FileText size={14} className="shrink-0 text-muted" aria-hidden />
                      <span className="min-w-0">
                        <span className="block truncate">{document.fileName}</span>
                        <span className="block text-xs capitalize text-muted">
                          {document.type.replace(/_/g, ' ').toLowerCase()}
                        </span>
                      </span>
                    </span>
                    <Badge tone={document.verified ? 'success' : 'neutral'}>
                      {document.verified ? 'Verified' : 'Unverified'}
                    </Badge>
                  </li>
                ))}
              </ul>
            </section>

            {application.reviewNotes ? (
              <section className="mb-6">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                  Previous review notes
                </h3>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">
                  {application.reviewNotes}
                </p>
              </section>
            ) : null}

            <label htmlFor="notes" className="label">
              Decision notes
            </label>
            <Textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Record the reasoning. Applicants can request these under a subject access request, so write what you would be content to have read back."
            />
          </CardBody>

          <CardFooter className="flex flex-wrap gap-2">
            {DECISIONS.map((decision) => {
              const blocked = decision.action === 'OFFER_MADE' && missingDocuments.length > 0;
              return (
                <Button
                  key={decision.action}
                  size="sm"
                  variant={decision.tone}
                  disabled={pending !== null || blocked || application.status === decision.action}
                  title={blocked ? 'Required documents are missing' : undefined}
                  onClick={() => decide(decision.action)}
                >
                  {pending === decision.action ? (
                    <Loader2 size={13} className="animate-spin" aria-hidden />
                  ) : null}
                  {decision.label}
                </Button>
              );
            })}
          </CardFooter>
        </Card>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted">{label}</dt>
      <dd className="mt-0.5 break-words font-medium">{value}</dd>
    </div>
  );
}
