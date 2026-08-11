'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, Send } from 'lucide-react';

import { Alert, Button, Card, CardBody, CardHeader, CardTitle } from '@/components/ui';
import { Field, Input, Select, Textarea } from '@/components/ui/form';

const SUBJECTS = [
  'Admissions enquiry',
  'Fees and payment',
  'Technical problem',
  'Accessibility barrier',
  'Verify a credential',
  'Media enquiry',
  'Something else',
];

export function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', subject: SUBJECTS[0], message: '' });
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  async function submit() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data?.error?.message ?? 'We could not send that. Please email us directly.');
        return;
      }
      setSent(true);
    } catch {
      setError('Could not reach the server. Please email admissions@rumax.edu directly.');
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <Card>
        <CardBody className="py-14 text-center">
          <CheckCircle2 size={40} className="mx-auto mb-4 text-success" aria-hidden />
          <h2 className="font-display text-xl font-semibold">Message received</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
            We reply to everything. If you have not heard back within two working days, email the
            relevant desk directly — that means something went wrong on our side.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Send us a message</CardTitle>
      </CardHeader>
      <CardBody>
        {error ? (
          <Alert tone="danger" className="mb-5">
            {error}
          </Alert>
        ) : null}

        <div className="grid gap-x-4 sm:grid-cols-2">
          <Field label="Your name" htmlFor="name" required>
            <Input id="name" value={form.name} onChange={set('name')} autoComplete="name" />
          </Field>
          <Field label="Email address" htmlFor="email" required>
            <Input id="email" type="email" value={form.email} onChange={set('email')} autoComplete="email" />
          </Field>
        </div>

        <Field label="What is this about?" htmlFor="subject" required>
          <Select id="subject" value={form.subject} onChange={set('subject')}>
            {SUBJECTS.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Message"
          htmlFor="message"
          required
          hint="Include your application reference or student number if you have one — it saves a round trip."
        >
          <Textarea id="message" rows={7} value={form.message} onChange={set('message')} />
        </Field>

        <Button
          className="w-full"
          onClick={submit}
          disabled={pending || !form.name.trim() || !form.email.trim() || form.message.trim().length < 10}
        >
          {pending ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <Send size={15} aria-hidden />}
          Send message
        </Button>

        <p className="mt-3 text-xs leading-relaxed text-muted">
          We use what you send only to answer you, and keep it for two years. See the privacy policy.
        </p>
      </CardBody>
    </Card>
  );
}
