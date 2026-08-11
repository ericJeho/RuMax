'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Loader2, Sparkles } from 'lucide-react';

import { Badge, Button, Card, CardBody, CardFooter, CardHeader, CardTitle } from '@/components/ui';
import { Field, Input, Textarea } from '@/components/ui/form';
import { useToast } from '@/components/ui/interactive';
import { formatDateTime } from '@/lib/format';
import { letterFor } from '@/lib/grading';

type QueuedSubmission = {
  id: string;
  content: string;
  fileUrl: string | null;
  status: string;
  similarity: number | null;
  submittedAt: string | null;
  student: { name: string; studentNumber: string | null };
  assignment: { title: string; maxScore: number; instructions: string; courseCode: string };
};

/**
 * The marking workspace.
 *
 * One submission at a time, deliberately: marking a queue side by side encourages
 * comparative marking, which drifts. The AI draft button produces feedback the lecturer
 * edits and owns — it never sets the mark.
 */
export function MarkingQueue({ submissions }: { submissions: QueuedSubmission[] }) {
  const router = useRouter();
  const toast = useToast();
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [pending, setPending] = useState(false);
  const [drafting, setDrafting] = useState(false);

  const submission = submissions[index];
  if (!submission) return null;

  const percent = score ? (Number(score) / submission.assignment.maxScore) * 100 : null;

  async function draftFeedback() {
    setDrafting(true);
    try {
      const response = await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ submissionId: submission.id }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.push({ tone: 'danger', title: 'Could not draft', body: data?.error?.message });
        return;
      }
      setFeedback(data.text);
      toast.push({
        tone: 'info',
        title: 'Draft inserted',
        body: 'Edit it before releasing — you own the feedback that goes to the student.',
      });
    } catch {
      toast.push({ tone: 'danger', title: 'Offline' });
    } finally {
      setDrafting(false);
    }
  }

  async function release() {
    setPending(true);
    try {
      const response = await fetch(`/api/submissions/${submission.id}/grade`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ score: Number(score), feedback }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.push({ tone: 'danger', title: 'Not saved', body: data?.error?.message ?? 'Try again.' });
        return;
      }

      toast.push({ tone: 'success', title: 'Mark released', body: `${submission.student.name} has been notified.` });
      setScore('');
      setFeedback('');

      if (index < submissions.length - 1) setIndex(index + 1);
      else router.refresh();
    } catch {
      toast.push({ tone: 'danger', title: 'Offline', body: 'Could not reach the server.' });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
      <Card>
        <CardHeader className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle as="h2">{submission.assignment.title}</CardTitle>
            <p className="mt-0.5 text-xs text-muted">
              {submission.assignment.courseCode} · {submission.student.name} ·{' '}
              <span className="font-mono">{submission.student.studentNumber}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {submission.status === 'LATE' ? <Badge tone="danger">Late</Badge> : null}
            <Badge>
              {index + 1} of {submissions.length}
            </Badge>
          </div>
        </CardHeader>

        <CardBody>
          <div className="mb-4 rounded-xl border border-border bg-surface-2/50 p-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">Brief</p>
            <p className="text-sm leading-relaxed text-muted">{submission.assignment.instructions}</p>
          </div>

          {submission.similarity !== null && submission.similarity > 25 ? (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden />
              <span>
                Similarity {submission.similarity}% — above the 25% threshold. Refer to the academic
                integrity team rather than reflecting it in the mark.
              </span>
            </div>
          ) : null}

          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            Submission
            {submission.submittedAt ? ` · handed in ${formatDateTime(submission.submittedAt)}` : ''}
          </p>
          <div className="max-h-[28rem] overflow-y-auto whitespace-pre-wrap rounded-xl border border-border p-4 text-sm leading-relaxed">
            {submission.content || <span className="text-muted">No written content — see attachment.</span>}
          </div>

          {submission.fileUrl ? (
            <a href={submission.fileUrl} className="mt-3 inline-block text-sm text-brand hover:underline">
              Download attached file →
            </a>
          ) : null}
        </CardBody>
      </Card>

      <Card className="h-fit">
        <CardHeader className="flex items-center justify-between">
          <CardTitle as="h2">Mark and feedback</CardTitle>
          <Button variant="ghost" size="sm" onClick={draftFeedback} disabled={drafting}>
            {drafting ? (
              <Loader2 size={13} className="animate-spin" aria-hidden />
            ) : (
              <Sparkles size={13} aria-hidden />
            )}
            AI draft
          </Button>
        </CardHeader>

        <CardBody>
          <Field
            label={`Score out of ${submission.assignment.maxScore}`}
            htmlFor="score"
            required
            hint={
              percent !== null
                ? `${percent.toFixed(1)}% — grade ${letterFor(percent)}${percent < 50 ? ' (fail)' : ''}`
                : undefined
            }
          >
            <Input
              id="score"
              type="number"
              min={0}
              max={submission.assignment.maxScore}
              step="0.5"
              value={score}
              onChange={(event) => setScore(event.target.value)}
            />
          </Field>

          <Field label="Feedback to the student" htmlFor="feedback" required>
            <Textarea
              id="feedback"
              rows={12}
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              placeholder="Two strengths, two specific improvements, and what to do next."
            />
          </Field>

          <p className="mb-4 text-xs leading-relaxed text-muted">
            Releasing a mark notifies the student immediately and locks their submission. Marks feed
            the course gradebook and can only be changed by the registrar afterwards.
          </p>
        </CardBody>

        <CardFooter className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIndex(Math.max(0, index - 1))}
              disabled={index === 0}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIndex(Math.min(submissions.length - 1, index + 1))}
              disabled={index >= submissions.length - 1}
            >
              Skip
            </Button>
          </div>
          <Button size="sm" onClick={release} disabled={pending || !score || feedback.trim().length < 20}>
            {pending ? <Loader2 size={14} className="animate-spin" aria-hidden /> : null}
            Release mark
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
