import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { LoginForm } from './login-form';
import { getSessionClaims } from '@/lib/auth';
import { configuredProviders } from '@/lib/oauth';
import { homeFor } from '@/lib/rbac';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to the RuMax Global Digital University student, lecturer or admin portal.',
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const claims = await getSessionClaims();
  if (claims) redirect(homeFor(claims.role));

  const { next, error } = await searchParams;
  const providers = configuredProviders();

  return (
    <>
      <h1 className="font-display text-3xl font-semibold">Welcome back</h1>
      <p className="mt-2 text-sm text-muted">
        Sign in to reach your courses, grades and university services.
      </p>

      <LoginForm next={next} providers={providers} oauthError={error} />

      <p className="mt-8 text-sm text-muted">
        New to RuMax?{' '}
        <Link href="/register" className="font-medium text-brand hover:underline">
          Create an applicant account
        </Link>
      </p>
    </>
  );
}
