'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, X } from 'lucide-react';

import { Button, Card, CardBody, CardFooter, CardHeader, CardTitle, Table, Td, Th } from '@/components/ui';
import { useToast } from '@/components/ui/interactive';

type PendingRegistration = {
  id: string;
  student: string;
  studentNumber: string | null;
  program: string;
  course: string;
  credits: number;
  term: string;
};

export function RegistrationApprovals({ registrations }: { registrations: PendingRegistration[] }) {
  const router = useRouter();
  const toast = useToast();
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, setPending] = useState(false);

  const allSelected = selected.length === registrations.length && registrations.length > 0;

  async function decide(status: 'APPROVED' | 'REJECTED') {
    setPending(true);
    try {
      const response = await fetch('/api/registrations/decision', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ids: selected, status }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.push({ tone: 'danger', title: 'Not saved', body: data?.error?.message ?? 'Try again.' });
        return;
      }

      toast.push({
        tone: 'success',
        title: `${data.updated} registration${data.updated === 1 ? '' : 's'} ${status.toLowerCase()}`,
        body: 'Students have been notified.',
      });
      setSelected([]);
      router.refresh();
    } catch {
      toast.push({ tone: 'danger', title: 'Offline', body: 'Could not reach the server.' });
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <CardTitle as="h2">Pending approval ({registrations.length})</CardTitle>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(event) => setSelected(event.target.checked ? registrations.map((r) => r.id) : [])}
            className="h-4 w-4 rounded border-border text-brand"
          />
          Select all
        </label>
      </CardHeader>

      <CardBody className="p-0">
        <Table>
          <caption className="sr-only">Registrations awaiting approval</caption>
          <thead>
            <tr>
              <Th className="w-10">
                <span className="sr-only">Select</span>
              </Th>
              <Th>Student</Th>
              <Th>Programme</Th>
              <Th>Course</Th>
              <Th className="text-right">Credits</Th>
              <Th>Term</Th>
            </tr>
          </thead>
          <tbody>
            {registrations.map((registration) => (
              <tr key={registration.id}>
                <Td>
                  <input
                    type="checkbox"
                    checked={selected.includes(registration.id)}
                    onChange={(event) =>
                      setSelected((current) =>
                        event.target.checked
                          ? [...current, registration.id]
                          : current.filter((id) => id !== registration.id),
                      )
                    }
                    aria-label={`Select ${registration.student} for ${registration.course}`}
                    className="h-4 w-4 rounded border-border text-brand"
                  />
                </Td>
                <Td>
                  <span className="block font-medium">{registration.student}</span>
                  <span className="block font-mono text-xs text-muted">{registration.studentNumber}</span>
                </Td>
                <Td className="text-xs">{registration.program}</Td>
                <Td className="text-sm">{registration.course}</Td>
                <Td className="text-right tabular-nums">{registration.credits}</Td>
                <Td className="text-xs">{registration.term}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </CardBody>

      <CardFooter className="flex flex-wrap items-center justify-between gap-3">
        <span>{selected.length} selected</span>
        <div className="flex gap-2">
          <Button
            variant="danger"
            size="sm"
            disabled={pending || selected.length === 0}
            onClick={() => decide('REJECTED')}
          >
            {pending ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <X size={14} aria-hidden />}
            Decline
          </Button>
          <Button size="sm" disabled={pending || selected.length === 0} onClick={() => decide('APPROVED')}>
            {pending ? (
              <Loader2 size={14} className="animate-spin" aria-hidden />
            ) : (
              <Check size={14} aria-hidden />
            )}
            Approve
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
