'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, GraduationCap, LogIn, Menu, Search, X } from 'lucide-react';

import { cn } from '@/lib/cn';
import { PRIMARY_NAV, SITE } from '@/lib/site';
import { LanguageSwitcher } from './language-switcher';

export function SiteHeader({ signedInAs }: { signedInAs?: { name: string; href: string } | null }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Route change should always dismiss any open navigation surface.
  useEffect(() => {
    setMobileOpen(false);
    setOpenMenu(null);
  }, [pathname]);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-shadow duration-300',
        scrolled ? 'glass shadow-sm' : 'border-b border-transparent bg-bg',
      )}
    >
      {/* Utility strip */}
      <div className="hidden border-b border-border/60 text-xs lg:block">
        <div className="rx-container flex h-9 items-center justify-between text-muted">
          <p>
            {SITE.motto} — <span className="italic">{SITE.mottoTranslation}</span>
          </p>
          <div className="flex items-center gap-4">
            <Link href="/verify" className="hover:text-brand">
              Verify a certificate
            </Link>
            <Link href="/library" className="hover:text-brand">
              Library
            </Link>
            <Link href="/support" className="hover:text-brand">
              Help desk
            </Link>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      <div className="rx-container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label={`${SITE.name} home`}>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient text-white">
            <GraduationCap size={20} aria-hidden />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-base font-semibold">{SITE.shortName}</span>
            <span className="block text-[10px] uppercase tracking-[0.16em] text-muted">
              Global Digital University
            </span>
          </span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {PRIMARY_NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => setOpenMenu(item.label)}
                onMouseLeave={() => setOpenMenu(null)}
              >
                <button
                  onClick={() => setOpenMenu(openMenu === item.label ? null : item.label)}
                  aria-expanded={openMenu === item.label}
                  aria-haspopup="true"
                  className={cn(
                    'flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition',
                    active ? 'text-brand' : 'text-fg hover:bg-surface-2',
                  )}
                >
                  {item.label}
                  <ChevronDown
                    size={14}
                    aria-hidden
                    className={cn('transition', openMenu === item.label && 'rotate-180')}
                  />
                </button>

                {openMenu === item.label ? (
                  <div className="absolute left-0 top-full w-80 pt-2">
                    <div className="animate-fade-up rounded-2xl border border-border bg-surface p-2 shadow-lift">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block rounded-xl px-3 py-2.5 transition hover:bg-surface-2"
                        >
                          <span className="block text-sm font-medium text-fg">{child.label}</span>
                          <span className="block text-xs text-muted">{child.description}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/search"
            aria-label="Search the site"
            className="grid h-9 w-9 place-items-center rounded-xl text-muted transition hover:bg-surface-2 hover:text-fg"
          >
            <Search size={18} aria-hidden />
          </Link>

          {signedInAs ? (
            <Link
              href={signedInAs.href}
              className="hidden rounded-xl border border-border px-3 py-2 text-sm font-medium transition hover:bg-surface-2 sm:block"
            >
              {signedInAs.name}
            </Link>
          ) : (
            <Link
              href="/login"
              className="hidden items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-medium transition hover:bg-surface-2 sm:flex"
            >
              <LogIn size={15} aria-hidden />
              Sign in
            </Link>
          )}

          <Link
            href="/apply"
            className="hidden rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-fg transition hover:brightness-110 sm:block"
          >
            Apply now
          </Link>

          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label="Toggle navigation menu"
            className="grid h-9 w-9 place-items-center rounded-xl border border-border lg:hidden"
          >
            {mobileOpen ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="max-h-[75vh] overflow-y-auto border-t border-border bg-surface px-4 py-4 lg:hidden"
        >
          {PRIMARY_NAV.map((item) => (
            <details key={item.label} className="border-b border-border/60 py-1">
              <summary className="cursor-pointer list-none py-2.5 font-medium">{item.label}</summary>
              <div className="pb-2 pl-3">
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className="block py-2 text-sm text-muted hover:text-brand"
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            </details>
          ))}
          <div className="mt-4 flex gap-2">
            <Link
              href={signedInAs?.href ?? '/login'}
              className="flex-1 rounded-xl border border-border py-2.5 text-center text-sm font-medium"
            >
              {signedInAs ? 'My portal' : 'Sign in'}
            </Link>
            <Link
              href="/apply"
              className="flex-1 rounded-xl bg-brand py-2.5 text-center text-sm font-semibold text-brand-fg"
            >
              Apply now
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
