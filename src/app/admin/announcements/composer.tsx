'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Megaphone } from 'lucide-react';

import { Button, Card, CardBody, CardFooter, CardHeader, CardTitle } from '@/components/ui';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/form';
import { useToast } from '@/components/ui/interactive';

const AUDIENCES = [
  { value: 'ALL', label: 'Everyone' },
  { value: 'STUDENTS', label: 'Students' },
  { value: 'LECTURERS', label: 'Lecturers' },
  { value: 'STAFF', label: 'Professional staff' },
  { value: 'ALUMNI', label: 'Alumni' },
  { value: 'APPLICANTS', label: 'Applicants' },
];

export function AnnouncementComposer() {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState({
    title: '',
    body: '',
    audience: 'ALL',
    pinned: false,
    notify: true,
  });
  const [pending, setPending] = useState(false);

  async function publish() {
    setPending(true);
    try {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.push({ tone: 'danger', title: 'Not published', body: data?.error?.message ?? 'Try again.' });
        return;
      }

      toast.push({
        tone: 'success',
        title: 'Announcement published',
        body: form.notify
          ? `${data.notified} people notified.`
          : 'Visible in the portals; no notifications sent.',
      });
      setForm({ ...form, title: '', body: '' });
      router.refresh();
    } catch {
      toast.push({ tone: 'danger', title: 'Offline', body: 'Could not reach the server.' });
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle as="h2">
          <span className="flex items-center gap-2">
            <Megaphone size={16} className="text-brand" aria-hidden />
            New announcement
          </span>
        </CardTitle>
      </CardHeader>

      <CardBody>
        <Field label="Audience" htmlFor="audience" required>
          <Select
            id="audience"
            value={form.audience}
            onChange={(event) => setForm({ ...form, audience: event.target.value })}
          >
            {AUDIENCES.map((audience) => (
              <option key={audience.value} value={audience.value}>
                {audience.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Title" htmlFor="title" required>
          <Input
            id="title"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            maxLength={150}
          />
        </Field>

        <Field
          label="Message"
          htmlFor="body"
          required
          hint="Lead with the action required and the deadline. Most people read the first line only."
        >
          <Textarea
            id="body"
            rows={6}
            value={form.body}
            onChange={(event) => setForm({ ...form, body: event.target.value })}
          />
        </Field>

        <div className="space-y-3">
          <Checkbox
            label="Pin to the top"
            description="Stays above other announcements until unpinned."
            checked={form.pinned}
            onChange={(event) => setForm({ ...form, pinned: event.target.checked })}
          />
          <Checkbox
            label="Send a notification"
            description="Also delivers to each recipient's notification list. Use sparingly — an audience that ignores notifications is worse than one that never had them."
            checked={form.notify}
            onChange={(event) => setForm({ ...form, notify: event.target.checked })}
          />
        </div>
      </CardBody>

      <CardFooter>
        <Button
          className="w-full"
          onClick={publish}
          disabled={pending || !form.title.trim() || form.body.trim().length < 10}
        >
          {pending ? <Loader2 size={15} className="animate-spin" aria-hidden /> : null}
          Publish announcement
        </Button>
      </CardFooter>
    </Card>
  );
}
