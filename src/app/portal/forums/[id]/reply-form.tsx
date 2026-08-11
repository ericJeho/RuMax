'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Send } from 'lucide-react';

import { Button, Card, CardBody } from '@/components/ui';
import { Textarea } from '@/components/ui/form';
import { useToast } from '@/components/ui/interactive';

export function ReplyForm({ threadId }: { threadId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [body, setBody] = useState('');
  const [pending, setPending] = useState(false);

  async function submit() {
    setPending(true);
    try {
      const response = await fetch(`/api/forums/${threadId}/posts`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.push({ tone: 'danger', title: 'Not posted', body: data?.error?.message ?? 'Try again.' });
        return;
      }

      setBody('');
      router.refresh();
    } catch {
      toast.push({ tone: 'danger', title: 'Offline', body: 'Could not reach the server.' });
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardBody>
        <label htmlFor="reply" className="label">
          Your reply
        </label>
        <Textarea
          id="reply"
          rows={5}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Answer the question, or add what you tried and where it broke down. Both are useful."
        />
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-muted">
            Be specific and be kind. Posts are visible to everyone on the course.
          </p>
          <Button onClick={submit} disabled={pending || body.trim().length < 5} size="sm">
            {pending ? (
              <Loader2 size={14} className="animate-spin" aria-hidden />
            ) : (
              <Send size={14} aria-hidden />
            )}
            Post reply
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
