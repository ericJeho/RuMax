import type { Metadata } from 'next';
import { CheckCircle2, Circle, XCircle } from 'lucide-react';

import {
  Alert,
  Badge,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  PageHeader,
  ProgressBar,
  StatCard,
} from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { getGraduationAudit } from '@/lib/student';

export const metadata: Metadata = { title: 'Graduation tracker' };
export const dynamic = 'force-dynamic';

export default async function GraduationPage() {
  const user = await requireUser();
  const { audit, coreCourses, passedCodes } = await getGraduationAudit(user.id);

  return (
    <>
      <PageHeader
        title="Graduation tracker"
        description="A live degree audit against your programme's requirements — the same check the registrar runs before conferring an award."
      />

      {audit.eligibleToGraduate ? (
        <Alert tone="success" title="You have met every graduation requirement" className="mb-6">
          Your record is complete. The registrar will confirm your award at the next Senate meeting
          and your certificate will appear under Certificates once conferred.
        </Alert>
      ) : (
        <Alert tone="info" title="Outstanding requirements" className="mb-6">
          {audit.outstandingRequirements.length} item
          {audit.outstandingRequirements.length === 1 ? '' : 's'} still to complete before you can
          graduate. Each is listed below.
        </Alert>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Credits earned" value={audit.earnedCredits} hint={`of ${audit.requiredCredits}`} />
        <StatCard label="In progress" value={audit.inProgressCredits} hint="credits this term" />
        <StatCard label="Cumulative GPA" value={audit.cgpa.toFixed(2)} hint={audit.classification} />
        <StatCard label="Progress" value={`${Math.round(audit.percentComplete)}%`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle as="h2">Core course requirements</CardTitle>
          </CardHeader>
          <CardBody>
            {coreCourses.length === 0 ? (
              <p className="text-sm text-muted">No core courses defined for your programme.</p>
            ) : (
              <ul className="space-y-2">
                {coreCourses.map((entry) => {
                  const passed = passedCodes.has(entry.course.code);
                  return (
                    <li
                      key={entry.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        {passed ? (
                          <CheckCircle2 size={16} className="shrink-0 text-success" aria-hidden />
                        ) : (
                          <Circle size={16} className="shrink-0 text-muted" aria-hidden />
                        )}
                        <span className="min-w-0">
                          <span className="block font-mono text-xs text-muted">{entry.course.code}</span>
                          <span className="block truncate text-sm">{entry.course.title}</span>
                        </span>
                      </span>
                      <Badge tone={passed ? 'success' : 'neutral'}>
                        {passed ? 'Passed' : `Year ${entry.year}`}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle as="h2">Credit progress</CardTitle>
            </CardHeader>
            <CardBody>
              <ProgressBar
                value={audit.earnedCredits}
                max={Math.max(1, audit.requiredCredits)}
                label={`${audit.earnedCredits} of ${audit.requiredCredits} credits`}
                tone={audit.percentComplete >= 100 ? 'success' : 'brand'}
              />
              <p className="mt-4 text-sm leading-relaxed text-muted">
                {audit.remainingCredits > 0
                  ? `${audit.remainingCredits} credits remain. At a typical load of 15 credits a term, that is about ${Math.ceil(audit.remainingCredits / 15)} more term${Math.ceil(audit.remainingCredits / 15) === 1 ? '' : 's'}.`
                  : 'You have earned every credit your programme requires.'}
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle as="h2">Requirements checklist</CardTitle>
            </CardHeader>
            <CardBody>
              {audit.outstandingRequirements.length === 0 ? (
                <p className="flex items-center gap-2 text-sm text-success">
                  <CheckCircle2 size={16} aria-hidden />
                  All requirements satisfied.
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {audit.outstandingRequirements.map((requirement) => (
                    <li key={requirement} className="flex items-start gap-2.5 text-sm">
                      <XCircle size={15} className="mt-0.5 shrink-0 text-danger" aria-hidden />
                      <span className="text-muted">{requirement}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle as="h2">What happens at graduation</CardTitle>
            </CardHeader>
            <CardBody>
              <ol className="space-y-2 text-sm leading-relaxed text-muted">
                <li>1. The registrar audits your record against the programme regulations.</li>
                <li>2. The Faculty Board recommends the award and its classification.</li>
                <li>3. Senate confers the award at its next meeting.</li>
                <li>4. Your certificate is issued with a verification serial and QR code.</li>
                <li>5. You are invited to the online ceremony and move to the alumni network.</li>
              </ol>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
