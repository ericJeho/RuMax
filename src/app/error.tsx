'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Root error boundary. The message is deliberately generic — the underlying error may
 * contain query fragments or record identifiers that should not reach a browser.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app] unhandled error', error);
  }, [error]);

  return (
    <main id="main" className="grid min-h-dvh place-items-center px-6 py-20 text-center">
      <div className="max-w-lg">
        <p className="font-mono text-sm text-danger">Something went wrong</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">We could not load this page</h1>
        <p className="mt-4 leading-relaxed text-muted">
          The problem has been logged and someone will look at it. Nothing you had saved is lost —
          drafts and submitted work are stored server-side.
        </p>

        {error.digest ? (
          <p className="mt-4 font-mono text-xs text-muted">
            Reference {error.digest} — quote this if you contact the help desk.
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button onClick={reset} className="btn-primary">
            Try again
          </button>
          <Link href="/" className="btn-secondary">
            University home
          </Link>
          <Link href="/support" className="btn-secondary">
            Help desk
          </Link>
        </div>
      </div>
    </main>
  );
}
