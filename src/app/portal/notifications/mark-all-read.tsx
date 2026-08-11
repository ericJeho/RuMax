'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCheck, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui';

export function MarkAllRead() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await fetch('/api/notifications/read-all', { method: 'POST' }).catch(() => undefined);
        setPending(false);
        router.refresh();
      }}
    >
      {pending ? (
        <Loader2 size={14} className="animate-spin" aria-hidden />
      ) : (
        <CheckCheck size={14} aria-hidden />
      )}
      Mark all read
    </Button>
  );
}
