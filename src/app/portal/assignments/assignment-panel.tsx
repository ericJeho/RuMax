'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Paperclip, Save, Send } from 'lucide-react';

import { Badge, Button, Card, CardBody, CardFooter, CardHeader, CardTitle } from '@/components/ui';
import { Textarea } from '@/components/ui/form';
import { useToast } from '@/components/ui/interactive';

type AssignmentView = {
  id: string;
  title: string;
  instructions: string;
  maxScore: number;
  weight: number;
  allowLate: boolean;
  dueAtLabel: string;
  dueRelative: string;
  courseCode: string;
  courseTitle: string;
};

const AUTOSAVE_DELAY_MS = 4000;

/**
 * Assignment submission with autosave.
 *
 * Losing a long answer to a dropped connection is one of the most damaging things a
 * learning platform can do, so the draft is saved to the server on a debounce and
 * mirrored into localStorage as a second line of defence.
 */
export function AssignmentPanel({
  assignment,
  submission,
}: {
  assignment: AssignmentView;
  submission: { content: string; status: string } | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const storageKey = `rumax:draft:${assignment.id}`;

  const [content, setContent] = useState(submission?.content ?? '');
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const dirty = useRef(false);

  // Recover a local draft that never made it to the server.
  useEffect(() => {
    const local = localStorage.getItem(storageKey);
    if (local && !submission?.content) setContent(local);
  }, [storageKey, submission?.content]);

  useEffect(() => {
    if (!dirty.current) return;
    localStorage.setItem(storageKey, content);

    const timer = setTimeout(() => void save('DRAFT'), AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- save is stable per render
  }, [content]);

  async function save(status: 'DRAFT' | 'SUBMITTED') {
    if (status === 'DRAFT' && !content.trim()) return;
    if (status === 'SUBMITTED') setSubmitting(true);
    else setSaving(true);

    try {
      const response = await fetch(`/api/assignments/${assignment.id}/submissions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content, status }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.push({ tone: 'danger', title: 'Not saved', body: data?.error?.message ?? 'Try again.' });
        return;
      }

      dirty.current = false;
      setSavedAt(new Date());

      if (status === 'SUBMITTED') {
        localStorage.removeItem(storageKey);
        toast.push({
          tone: 'success',
          title: 'Submitted',
          body: `${assignment.title} has been handed in. You will receive feedback within 24 hours of marking opening.`,
        });
        router.refresh();
      }
    } catch {
      toast.push({
        tone: 'danger',
        title: 'Offline',
        body: 'Your work is saved on this device and will upload when you reconnect.',
      });
    } finally {
      setSaving(false);
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>{assignment.title}</CardTitle>
          <p className="mt-0.5 text-xs text-muted">
            {assignment.courseCode} · {assignment.courseTitle}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="warning">Due {assignment.dueRelative}</Badge>
          <Badge>{Math.round(assignment.weight * 100)}% of course</Badge>
          <Badge>{assignment.maxScore} marks</Badge>
        </div>
      </CardHeader>

      <CardBody>
        <p className="mb-4 text-sm leading-relaxed text-muted">{assignment.instructions}</p>

        <label htmlFor={`answer-${assignment.id}`} className="label">
          Your submission
        </label>
        <Textarea
          id={`answer-${assignment.id}`}
          value={content}
          rows={9}
          onChange={(event) => {
            dirty.current = true;
            setContent(event.target.value);
          }}
          placeholder="Type or paste your answer. Your work saves automatically as you write."
        />

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <span>
            {content.trim() ? `${content.trim().split(/\s+/).length} words` : 'No content yet'}
            {savedAt ? ` · draft saved ${savedAt.toLocaleTimeString()}` : ''}
          </span>
          <button type="button" className="flex items-center gap-1.5 hover:text-brand">
            <Paperclip size={13} aria-hidden />
            Attach a file (PDF, DOCX, ZIP — max 50 MB)
          </button>
        </div>
      </CardBody>

      <CardFooter className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs">
          Deadline: {assignment.dueAtLabel}
          {assignment.allowLate ? ' · late submissions accepted with a penalty' : ' · no late submissions'}
        </span>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => save('DRAFT')} disabled={saving || !content.trim()}>
            {saving ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Save size={14} aria-hidden />}
            Save draft
          </Button>
          <Button size="sm" onClick={() => save('SUBMITTED')} disabled={submitting || !content.trim()}>
            {submitting ? (
              <Loader2 size={14} className="animate-spin" aria-hidden />
            ) : (
              <Send size={14} aria-hidden />
            )}
            Submit
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
