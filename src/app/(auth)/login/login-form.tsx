'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

import { Alert, Button } from '@/components/ui';
import { Field, Input } from '@/components/ui/form';

const DEMO_ACCOUNTS = [
  { label: 'Student', email: 'student@rumax.edu' },
  { label: 'Lecturer', email: 'lecturer@rumax.edu' },
  { label: 'Registrar', email: 'registrar@rumax.edu' },
  { label: 'Administrator', email: 'admin@rumax.edu' },
];

/**
 * Whether to offer the demonstration account shortcuts at all.
 *
 * Off unless explicitly switched on. This block used to render unconditionally, with a
 * comment asking whoever deployed the site to delete it first — which is not a control,
 * it is a hope. Any public deployment that kept it was one click and one known password
 * away from an administrator session. Defaulting to off makes forgetting safe and makes
 * showing them a decision.
 *
 * The shortcuts now fill in the email only. The seed password is never shipped to the
 * browser: it is chosen per deployment via `SEED_PASSWORD`, and a value compiled into the
 * client bundle would be readable by anyone who opened the page, whatever this flag said.
 */
const SHOW_DEMO_ACCOUNTS = process.env.NEXT_PUBLIC_SHOW_DEMO_LOGINS === 'true';

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data?.error?.message ?? 'Sign in failed. Please try again.');
        return;
      }

      // `next` is a path chosen by our own middleware; reject anything absolute so a
      // crafted link cannot bounce a freshly authenticated user off-site.
      const target = next && next.startsWith('/') && !next.startsWith('//') ? next : data.redirectTo;
      router.push(target);
      router.refresh();
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <form onSubmit={onSubmit} className="mt-8" noValidate>
        {error ? (
          <Alert tone="danger" className="mb-5">
            {error}
          </Alert>
        ) : null}

        <Field label="Email address" htmlFor="email" required>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </Field>

        <Field label="Password" htmlFor="password" required>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted hover:text-fg"
            >
              {showPassword ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
            </button>
          </div>
        </Field>

        <div className="mb-6 flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-muted">
            <input type="checkbox" name="remember" className="h-4 w-4 rounded border-border text-brand" />
            Keep me signed in
          </label>
          <Link href="/forgot-password" className="font-medium text-brand hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" disabled={pending} className="w-full" size="lg">
          {pending ? <Loader2 size={16} className="animate-spin" aria-hidden /> : null}
          {pending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-border" />
        or continue with
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {['Google', 'Microsoft'].map((provider) => (
          <button
            key={provider}
            type="button"
            onClick={() =>
              setError(
                `${provider} sign-in is configured through OAuth. Set ${provider.toUpperCase()}_CLIENT_ID and ${provider.toUpperCase()}_CLIENT_SECRET to enable it.`,
              )
            }
            className="rounded-xl border border-border py-2.5 text-sm font-medium transition hover:bg-surface-2"
          >
            {provider}
          </button>
        ))}
      </div>

      {SHOW_DEMO_ACCOUNTS ? (
        <div className="mt-8 rounded-xl border border-dashed border-border p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            Demonstration accounts
          </p>
          <div className="flex flex-wrap gap-1.5">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => setEmail(account.email)}
                className="rounded-lg border border-border px-2.5 py-1 text-xs transition hover:border-brand hover:text-brand"
              >
                {account.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted">
            Fills in the address only. The password is the <code>SEED_PASSWORD</code> this
            installation was seeded with.
          </p>
        </div>
      ) : null}
    </>
  );
}
