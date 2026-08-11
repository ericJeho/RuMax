import type { Metadata } from 'next';
import Link from 'next/link';
import { CloudOff } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Offline',
  description: 'You are offline.',
  robots: { index: false, follow: false },
};

/** Served by the service worker when a navigation fails and nothing is cached. */
export default function OfflinePage() {
  return (
    <main id="main" className="grid min-h-dvh place-items-center px-6 py-20 text-center">
      <div className="max-w-md">
        <CloudOff size={44} className="mx-auto mb-5 text-muted" aria-hidden />
        <h1 className="font-display text-3xl font-semibold">You are offline</h1>
        <p className="mt-3 leading-relaxed text-muted">
          This page has not been downloaded to your device. Anything you have already opened —
          including downloaded lessons — is still available, and work you have typed is saved
          locally and will upload when you reconnect.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/portal" className="btn-primary">
            My courses
          </Link>
          <Link href="/" className="btn-secondary">
            Home
          </Link>
        </div>

        <p className="mt-8 text-xs leading-relaxed text-muted">
          Tip: open a unit while you have a connection and use the download button. The whole unit,
          including video in its low-bandwidth form, will then work with no connection at all.
        </p>
      </div>
    </main>
  );
}
