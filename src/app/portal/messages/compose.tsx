'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Send } from 'lucide-react';

import { Button, Card, CardBody, CardHeader, CardTitle, EmptyState } from '@/components/ui';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import { useToast } from '@/components/ui/interactive';

export function ComposeMessage({ contacts }: { contacts: { id: string; label: string }[] }) {
  const router = useRouter();
  const toast = useToast();
  const [recipientId, setRecipientId] = useState(contacts[0]?.id ?? '');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [pending, setPending] = useState(false);

  async function send() {
    setPending(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ recipientId, subject, body }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.push({ tone: 'danger', title: 'Not sent', body: data?.error?.message ?? 'Try again.' });
        return;
      }

      setSubject('');
      setBody('');
      toast.push({ tone: 'success', title: 'Message sent' });
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
        <CardTitle as="h2">New message</CardTitle>
      </CardHeader>
      <CardBody>
        {contacts.length === 0 ? (
          <EmptyState
            title="No contacts yet"
            description="Once your course registrations are approved you can message the lecturers teaching you."
          />
        ) : (
          <>
            <Field label="To" htmlFor="recipient" required>
              <Select
                id="recipient"
                value={recipientId}
                onChange={(event) => setRecipientId(event.target.value)}
              >
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Subject" htmlFor="subject" required>
              <Input
                id="subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                maxLength={150}
              />
            </Field>

            <Field label="Message" htmlFor="body" required>
              <Textarea
                id="body"
                rows={7}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Be specific — mention the course code and, if it is about a piece of work, its title."
              />
            </Field>

            <Button
              className="w-full"
              onClick={send}
              disabled={pending || !subject.trim() || !body.trim()}
            >
              {pending ? (
                <Loader2 size={15} className="animate-spin" aria-hidden />
              ) : (
                <Send size={15} aria-hidden />
              )}
              Send message
            </Button>

            <p className="mt-3 text-xs leading-relaxed text-muted">
              Staff aim to reply within two working days. For anything urgent about fees or
              registration, use the help desk instead.
            </p>
          </>
        )}
      </CardBody>
    </Card>
  );
}
