import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { RegisterForm } from './register-form';
import { configuredProviders } from '@/lib/oauth';
import { getSessionClaims } from '@/lib/auth';
import { homeFor } from '@/lib/rbac';

export const metadata: Metadata = {
  title: 'Create an account',
  description: 'Create a RuMax applicant account to apply for a programme and track your application.',
  robots: { index: false, follow: false },
};

export default async function RegisterPage() {
  const providers = configuredProviders();
  const claims = await getSessionClaims();
  if (claims) redirect(homeFor(claims.role));

  return (
    <>
      <h1 className="font-display text-3xl font-semibold">Create your account</h1>
      <p className="mt-2 text-sm text-muted">
        One account to apply, track your application, and — once you are offered a place —
        study with us.
      </p>

      <RegisterForm />

      {providers.length > 0 ? (
        <>
          <div className="my-6 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-border" />
            or sign up with
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className={providers.length > 1 ? 'grid grid-cols-2 gap-3' : 'grid gap-3'}>
            {providers.map((provider) => (
              <a
                key={provider.id}
                href={`/api/auth/oauth/${provider.id.toLowerCase()}`}
                className="rounded-xl border border-border py-2.5 text-center text-sm font-medium transition hover:bg-surface-2"
              >
                {provider.label}
              </a>
            ))}
          </div>
        </>
      ) : null}

      <p className="mt-8 text-sm text-muted">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
