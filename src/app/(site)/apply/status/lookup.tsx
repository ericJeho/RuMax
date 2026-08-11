'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

import { Button, Card, CardBody } from '@/components/ui';
import { Input } from '@/components/ui/form';

export function StatusLookup({ initialReference }: { initialReference?: string }) {
  const router = useRouter();
  const [reference, setReference] = useState(initialReference ?? '');

  function submit(event: FormEvent) {
    event.preventDefault();
    router.push(`/apply/status?reference=${encodeURIComponent(reference.trim().toUpperCase())}`);
  }

  return (
    <Card>
      <CardBody>
        <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
          <label htmlFor="reference" className="sr-only">
            Application reference
          </label>
          <Input
            id="reference"
            value={reference}
            onChange={(event) => setReference(event.target.value.toUpperCase())}
            placeholder="APP-2025-000001"
            className="font-mono uppercase"
            autoComplete="off"
          />
          <Button type="submit" className="shrink-0" disabled={reference.trim().length < 6}>
            <Search size={15} aria-hidden />
            Check status
          </Button>
        </form>
        <p className="mt-2 text-xs text-muted">
          Your reference is in the confirmation email we sent when you applied.
        </p>
      </CardBody>
    </Card>
  );
}
