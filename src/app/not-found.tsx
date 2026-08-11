import Link from 'next/link';

export default function NotFound() {
  return (
    <main id="main" className="grid min-h-dvh place-items-center px-6 py-20 text-center">
      <div className="max-w-lg">
        <p className="font-mono text-sm text-brand">404</p>
        <h1 className="mt-2 font-display text-4xl font-semibold">Page not found</h1>
        <p className="mt-4 leading-relaxed text-muted">
          The page you asked for does not exist, or it has moved. If you followed a link from
          somewhere on this site, that is our mistake — tell the help desk and we will fix it.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary">
            University home
          </Link>
          <Link href="/programs" className="btn-secondary">
            Browse programmes
          </Link>
          <Link href="/search" className="btn-secondary">
            Search
          </Link>
        </div>
      </div>
    </main>
  );
}
