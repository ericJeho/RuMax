import Link from 'next/link';
import { GraduationCap, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';

import { FOOTER_NAV, LEGAL_NAV, SITE } from '@/lib/site';

export function SiteFooter() {
  return (
    <footer className="no-print mt-24 border-t border-border bg-surface-2/40">
      <div className="rx-container py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <Link href="/" className="mb-4 flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient text-white">
                <GraduationCap size={20} aria-hidden />
              </span>
              <span className="font-display text-base font-semibold">{SITE.shortName}</span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-muted">{SITE.description}</p>

            <ul className="mt-5 space-y-2 text-sm text-muted">
              <li className="flex items-start gap-2">
                <MapPin size={15} className="mt-0.5 shrink-0" aria-hidden />
                {SITE.address}
              </li>
              <li className="flex items-center gap-2">
                <Mail size={15} className="shrink-0" aria-hidden />
                <a href={`mailto:${SITE.email}`} className="hover:text-brand">
                  {SITE.email}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={15} className="shrink-0" aria-hidden />
                <a href={`tel:${SITE.phone.replace(/\s/g, '')}`} className="hover:text-brand">
                  {SITE.phone}
                </a>
              </li>
            </ul>
          </div>

          {FOOTER_NAV.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-fg">
                {column.heading}
              </h2>
              <ul className="space-y-2 text-sm">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-muted transition hover:text-brand">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-border pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE.name}. Registered {SITE.registrationNumber}. All rights
            reserved.
          </p>
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {LEGAL_NAV.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-brand">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-4 flex items-center gap-2 text-xs text-muted">
          <ShieldCheck size={14} aria-hidden className="text-success" />
          GDPR and FERPA aligned · WCAG 2.2 AA · Data encrypted in transit and at rest
        </p>
      </div>
    </footer>
  );
}
