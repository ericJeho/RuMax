import Link from 'next/link';
import { GraduationCap, Quote } from 'lucide-react';

import { SITE, STATS } from '@/lib/site';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-md">
          <Link href="/" className="mb-10 flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-gradient text-white">
              <GraduationCap size={21} aria-hidden />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-base font-semibold">{SITE.shortName}</span>
              <span className="block text-[10px] uppercase tracking-[0.16em] text-muted">
                Global Digital University
              </span>
            </span>
          </Link>
          <main id="main">{children}</main>
        </div>
      </div>

      {/* Decorative panel — hidden from assistive technology and on small screens. */}
      <aside
        aria-hidden
        className="relative hidden overflow-hidden bg-brand-gradient p-12 text-white lg:flex lg:flex-col lg:justify-between"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgb(255_255_255/0.18),transparent_55%)]" />
        <div className="relative">
          <p className="text-sm uppercase tracking-[0.2em] text-white/70">{SITE.tagline}</p>
        </div>

        <div className="relative max-w-md">
          <Quote size={34} className="mb-5 text-white/40" />
          <p className="font-display text-2xl leading-snug">
            I studied for my masters between night shifts, on a phone, in a town with no
            university. RuMax is the only reason I have this degree.
          </p>
          <p className="mt-5 text-sm text-white/75">
            Amina Kamau — MSc Public Health, Class of 2024
          </p>
        </div>

        <dl className="relative grid grid-cols-2 gap-6 border-t border-white/20 pt-8">
          {STATS.slice(0, 4).map((stat) => (
            <div key={stat.label}>
              <dt className="text-xs text-white/70">{stat.label}</dt>
              <dd className="font-display text-2xl font-semibold">
                {stat.value.toLocaleString()}
                {stat.suffix}
              </dd>
            </div>
          ))}
        </dl>
      </aside>
    </div>
  );
}
