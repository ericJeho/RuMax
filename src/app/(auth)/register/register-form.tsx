'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, Loader2, X } from 'lucide-react';

import { Alert, Button } from '@/components/ui';
import { Checkbox, Field, Input } from '@/components/ui/form';
import { cn } from '@/lib/cn';
import { passwordProblems } from '@/lib/password';

/**
 * Live password feedback. The labels are the ones `passwordProblems` returns, so the
 * client checklist and the server's rejection message can never disagree.
 */
const RULES = [
  'Use at least 10 characters',
  'Include a lowercase letter',
  'Include an uppercase letter',
  'Include a number',
  'Include a symbol',
];

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    country: '',
    password: '',
    acceptTerms: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const problems = useMemo(() => passwordProblems(form.password), [form.password]);
  const met = RULES.map((rule) => !problems.includes(rule));
  const strong = met.every(Boolean);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data?.error?.message ?? 'We could not create your account.');
        return;
      }
      router.push(data.redirectTo ?? '/apply');
      router.refresh();
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setPending(false);
    }
  }

  const set = (key: keyof typeof form) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  return (
    <form onSubmit={onSubmit} className="mt-8" noValidate>
      {error ? (
        <Alert tone="danger" className="mb-5">
          {error}
        </Alert>
      ) : null}

      <div className="grid gap-x-4 sm:grid-cols-2">
        <Field label="First name" htmlFor="firstName" required>
          <Input id="firstName" required autoComplete="given-name" value={form.firstName} onChange={set('firstName')} />
        </Field>
        <Field label="Family name" htmlFor="lastName" required>
          <Input id="lastName" required autoComplete="family-name" value={form.lastName} onChange={set('lastName')} />
        </Field>
      </div>

      <Field label="Email address" htmlFor="email" required hint="We send your application updates here.">
        <Input id="email" type="email" required autoComplete="email" value={form.email} onChange={set('email')} />
      </Field>

      <Field label="Country of residence" htmlFor="country">
        <Input id="country" autoComplete="country-name" value={form.country} onChange={set('country')} />
      </Field>

      <Field label="Password" htmlFor="password" required>
        <Input
          id="password"
          type="password"
          required
          autoComplete="new-password"
          value={form.password}
          onChange={set('password')}
        />
      </Field>

      <ul className="mb-5 grid gap-1 sm:grid-cols-2" aria-label="Password requirements">
        {RULES.map((rule, index) => (
          <li
            key={rule}
            className={cn('flex items-center gap-1.5 text-xs', met[index] ? 'text-success' : 'text-muted')}
          >
            {met[index] ? <Check size={12} aria-hidden /> : <X size={12} aria-hidden />}
            {rule}
          </li>
        ))}
      </ul>

      <div className="mb-6">
        <Checkbox
          label="I accept the terms of use and privacy policy"
          checked={form.acceptTerms}
          onChange={(e) => setForm((c) => ({ ...c, acceptTerms: e.target.checked }))}
          required
        />
        <p className="mt-1.5 pl-7 text-xs text-muted">
          Read the{' '}
          <Link href="/terms" className="text-brand underline">
            terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-brand underline">
            privacy policy
          </Link>
          .
        </p>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={pending || !strong || !form.acceptTerms}>
        {pending ? <Loader2 size={16} className="animate-spin" aria-hidden /> : null}
        {pending ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  );
}
