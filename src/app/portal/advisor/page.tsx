import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarClock, LifeBuoy, MessageSquare } from 'lucide-react';

import { Alert, Card, CardBody, CardHeader, CardTitle, PageHeader, ProgressBar } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { getGraduationAudit } from '@/lib/student';
import { onProbation } from '@/lib/grading';

export const metadata: Metadata = { title: 'Academic advisor' };
export const dynamic = 'force-dynamic';

/**
 * Academic advising.
 *
 * The advice here is generated from the student's own record rather than being generic
 * guidance — a student who is behind on credits sees something different from one who is
 * ahead, which is the whole point of an advisor.
 */
export default async function AdvisorPage() {
  const user = await requireUser();
  const { audit } = await getGraduationAudit(user.id);

  const recommendations: { title: string; body: string; tone: 'info' | 'warning' | 'success' }[] = [];

  if (onProbation(audit.cgpa, audit.earnedCredits)) {
    recommendations.push({
      tone: 'warning',
      title: 'Your CGPA is below the minimum',
      body: 'Book a meeting this week. A reduced course load for one term is the intervention that works most often, and it does not extend your degree as much as failing a full load would.',
    });
  } else if (audit.cgpa >= 3.7) {
    recommendations.push({
      tone: 'success',
      title: 'You are on track for a First',
      body: 'Consider asking a lecturer about a research assistantship or an undergraduate research project — students in your position are usually eligible and rarely ask.',
    });
  }

  if (audit.remainingCredits > 0 && audit.inProgressCredits === 0) {
    recommendations.push({
      tone: 'warning',
      title: 'You are not registered for any credits this term',
      body: `${audit.remainingCredits} credits remain in your programme. Register before the window closes, or speak to us about interrupting your studies formally rather than simply pausing.`,
    });
  }

  if (audit.outstandingRequirements.some((r) => r.startsWith('Core course'))) {
    recommendations.push({
      tone: 'info',
      title: 'Core courses outstanding',
      body: 'Core courses are often prerequisites for later ones and are not offered every term. Clear them before choosing electives.',
    });
  }

  if (audit.outstandingRequirements.includes('Outstanding tuition balance')) {
    recommendations.push({
      tone: 'warning',
      title: 'Tuition balance may block your graduation',
      body: 'A balance does not stop you studying, but it does stop an award being conferred. Contact the finance office about an instalment plan early rather than at graduation.',
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      tone: 'success',
      title: 'Nothing needs attention',
      body: 'Your credits, marks and account are all in order. Keep going.',
    });
  }

  return (
    <>
      <PageHeader
        title="Academic advisor"
        description="A read on where you are, and what to do about it."
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          {recommendations.map((recommendation) => (
            <Alert key={recommendation.title} tone={recommendation.tone} title={recommendation.title}>
              {recommendation.body}
            </Alert>
          ))}

          <Card>
            <CardHeader>
              <CardTitle as="h2">Where you are</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4">
              <ProgressBar
                value={audit.earnedCredits}
                max={Math.max(1, audit.requiredCredits)}
                label={`${audit.earnedCredits} of ${audit.requiredCredits} credits earned`}
              />
              <dl className="grid gap-4 sm:grid-cols-3 text-sm">
                <div>
                  <dt className="text-muted">Cumulative GPA</dt>
                  <dd className="font-display text-2xl font-semibold">{audit.cgpa.toFixed(2)}</dd>
                </div>
                <div>
                  <dt className="text-muted">Classification</dt>
                  <dd className="mt-1 font-medium">{audit.classification}</dd>
                </div>
                <div>
                  <dt className="text-muted">In progress</dt>
                  <dd className="mt-1 font-medium">{audit.inProgressCredits} credits</dd>
                </div>
              </dl>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle as="h2">Talk to a person</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              <p className="text-sm leading-relaxed text-muted">
                An algorithm can tell you what your record says. It cannot tell you what to do about
                a bereavement, a job loss or a health problem — for that, talk to us. Nothing you
                say to an advisor affects your marks.
              </p>
              <Link href="/portal/messages" className="btn-primary w-full text-sm">
                <MessageSquare size={14} aria-hidden />
                Message my advisor
              </Link>
              <button className="btn-secondary w-full text-sm">
                <CalendarClock size={14} aria-hidden />
                Book a 20-minute call
              </button>
              <Link href="/support" className="btn-secondary w-full text-sm">
                <LifeBuoy size={14} aria-hidden />
                Student support services
              </Link>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle as="h2">Common options</CardTitle>
            </CardHeader>
            <CardBody>
              <ul className="space-y-3 text-sm leading-relaxed text-muted">
                <li>
                  <strong className="text-fg">Reduced load.</strong> Take fewer credits for a term
                  without penalty.
                </li>
                <li>
                  <strong className="text-fg">Interruption of studies.</strong> Pause for up to a
                  year and return where you left off.
                </li>
                <li>
                  <strong className="text-fg">Deadline extension.</strong> Up to two weeks, granted
                  by your lecturer, no reason required once per course.
                </li>
                <li>
                  <strong className="text-fg">Mitigating circumstances.</strong> Formal process for
                  when something serious affected an assessment.
                </li>
                <li>
                  <strong className="text-fg">Programme transfer.</strong> Move to a related
                  programme carrying your credits with you.
                </li>
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
