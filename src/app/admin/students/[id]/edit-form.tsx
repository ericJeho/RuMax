'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { Alert, Button } from '@/components/ui';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import { ROLE_LABELS } from '@/lib/rbac';

type Subject = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  country: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  studentNumber: string | null;
  programId: string | null;
  yearOfStudy: number | null;
  status: string;
  role: string;
};

const STATUSES = ['PENDING', 'ACTIVE', 'SUSPENDED', 'GRADUATED', 'WITHDRAWN'] as const;

export function EditProfileForm({
  subject,
  programs,
  assignableRoles,
}: {
  subject: Subject;
  programs: { id: string; code: string; title: string }[];
  /** Roles this actor may assign. Excludes ADMIN unless the actor is one. */
  assignableRoles: string[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string[] | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const value = (name: string) => {
      const raw = form.get(name);
      const text = typeof raw === 'string' ? raw.trim() : '';
      return text === '' ? null : text;
    };

    try {
      const response = await fetch(`/api/students/${subject.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          firstName: value('firstName'),
          lastName: value('lastName'),
          email: value('email'),
          phone: value('phone'),
          country: value('country'),
          gender: value('gender'),
          dateOfBirth: value('dateOfBirth') ? `${value('dateOfBirth')}T00:00:00.000Z` : null,
          studentNumber: value('studentNumber'),
          programId: value('programId'),
          yearOfStudy: value('yearOfStudy'),
          status: value('status'),
          role: value('role'),
          reason: value('reason'),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data?.error?.message ?? 'The record could not be saved.');
        return;
      }

      setSaved(data.changed ?? []);
      router.refresh();
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {error ? <Alert tone="danger">{error}</Alert> : null}
      {saved ? (
        <Alert tone="success">
          {saved.length === 0
            ? 'Nothing changed — the record already held those values.'
            : `Saved. Updated ${saved.join(', ')}.`}
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" htmlFor="firstName" required>
          <Input id="firstName" name="firstName" defaultValue={subject.firstName} required />
        </Field>
        <Field label="Last name" htmlFor="lastName" required>
          <Input id="lastName" name="lastName" defaultValue={subject.lastName} required />
        </Field>
        <Field label="Email address" htmlFor="email" required>
          <Input id="email" name="email" type="email" defaultValue={subject.email} required />
        </Field>
        <Field label="Phone" htmlFor="phone">
          <Input id="phone" name="phone" defaultValue={subject.phone ?? ''} />
        </Field>
        <Field label="Country" htmlFor="country">
          <Input id="country" name="country" defaultValue={subject.country ?? ''} />
        </Field>
        <Field label="Gender" htmlFor="gender">
          <Input id="gender" name="gender" defaultValue={subject.gender ?? ''} />
        </Field>
        <Field label="Date of birth" htmlFor="dateOfBirth">
          <Input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            defaultValue={subject.dateOfBirth ? subject.dateOfBirth.slice(0, 10) : ''}
          />
        </Field>
        <Field label="Student number" htmlFor="studentNumber">
          <Input id="studentNumber" name="studentNumber" defaultValue={subject.studentNumber ?? ''} />
        </Field>
        <Field label="Programme" htmlFor="programId">
          <Select id="programId" name="programId" defaultValue={subject.programId ?? ''}>
            <option value="">— none —</option>
            {programs.map((program) => (
              <option key={program.id} value={program.id}>
                {program.code} — {program.title}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Year of study" htmlFor="yearOfStudy">
          <Input
            id="yearOfStudy"
            name="yearOfStudy"
            type="number"
            min={1}
            max={8}
            defaultValue={subject.yearOfStudy ?? ''}
          />
        </Field>
        <Field label="Status" htmlFor="status">
          <Select id="status" name="status" defaultValue={subject.status}>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Role"
          htmlFor="role"
          hint={
            assignableRoles.includes('ADMIN')
              ? undefined
              : 'Only an administrator can assign the administrator role.'
          }
        >
          <Select id="role" name="role" defaultValue={subject.role}>
            {assignableRoles.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? role}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field
        label="Reason for this change"
        htmlFor="reason"
        required
        hint="Recorded in the audit log with the before and after values. Say what prompted the correction."
      >
        <Textarea
          id="reason"
          name="reason"
          rows={2}
          required
          minLength={3}
          placeholder="e.g. Name corrected against passport supplied at registration."
        />
      </Field>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save changes'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
