import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { RegisterForm } from './register-form';
import { getSessionClaims } from '@/lib/auth';
import { homeFor } from '@/lib/rbac';

export const metadata: Metadata = {
  title: 'Create an account',
  description: 'Create a RuMax applicant account to apply for a programme and track your application.',
  robots: { index: false, follow: false },
};

export default async function RegisterPage() {
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

      <p className="mt-8 text-sm text-muted">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
