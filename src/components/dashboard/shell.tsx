'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, ChevronLeft, GraduationCap, LogOut, Menu, Search, X } from 'lucide-react';

import { cn } from '@/lib/cn';
import { Avatar } from '@/components/ui';
import { SITE } from '@/lib/site';

export type NavSection = {
  heading: string;
  items: { label: string; href: string; icon: string; badge?: number }[];
};

export type ShellUser = {
  name: string;
  email: string;
  role: string;
  identifier?: string | null;
  avatarUrl?: string | null;
};

/**
 * Shared chrome for the three portals.
 *
 * The sidebar collapses to an off-canvas drawer below `lg`, which is how the majority of
 * our students use the platform — the mobile layout is the primary one, not a fallback.
 */
export function DashboardShell({
  user,
  sections,
  portalName,
  notificationCount = 0,
  children,
}: {
  user: ShellUser;
  sections: NavSection[];
  portalName: string;
  notificationCount?: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const nav = (
    <nav aria-label={`${portalName} navigation`} className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {sections.map((section) => (
        <div key={section.heading}>
          <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            {section.heading}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(`${item.href}/`));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm transition',
                      active
                        ? 'bg-brand/10 font-medium text-brand'
                        : 'text-muted hover:bg-surface-2 hover:text-fg',
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span aria-hidden className="w-4 shrink-0 text-center text-[13px]">
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.badge ? (
                      <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-semibold text-brand-fg">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-dvh bg-bg">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-gradient text-white">
              <GraduationCap size={17} aria-hidden />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-sm font-semibold">{SITE.shortName}</span>
              <span className="block text-[10px] text-muted">{portalName}</span>
            </span>
          </Link>
        </div>
        {nav}
        <UserFooter user={user} onSignOut={signOut} />
      </aside>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} aria-hidden />
          <aside className="relative flex h-full w-72 flex-col border-r border-border bg-surface">
            <div className="flex h-16 items-center justify-between border-b border-border px-5">
              <span className="font-display text-sm font-semibold">{portalName}</span>
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="p-1.5 text-muted">
                <X size={18} aria-hidden />
              </button>
            </div>
            {nav}
            <UserFooter user={user} onSignOut={signOut} />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border px-4 sm:px-6">
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="grid h-9 w-9 place-items-center rounded-xl border border-border lg:hidden"
          >
            <Menu size={17} aria-hidden />
          </button>

          <Link
            href="/"
            className="hidden items-center gap-1.5 text-sm text-muted transition hover:text-brand sm:flex"
          >
            <ChevronLeft size={15} aria-hidden />
            University site
          </Link>

          <div className="ml-auto flex items-center gap-1.5">
            <Link
              href="/search"
              aria-label="Search"
              className="grid h-9 w-9 place-items-center rounded-xl text-muted transition hover:bg-surface-2 hover:text-fg"
            >
              <Search size={17} aria-hidden />
            </Link>
            <Link
              href={`${sections[0]?.items[0]?.href.split('/').slice(0, 2).join('/') ?? ''}/notifications`}
              aria-label={`Notifications${notificationCount ? `, ${notificationCount} unread` : ''}`}
              className="relative grid h-9 w-9 place-items-center rounded-xl text-muted transition hover:bg-surface-2 hover:text-fg"
            >
              <Bell size={17} aria-hidden />
              {notificationCount > 0 ? (
                <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              ) : null}
            </Link>
            <Avatar name={user.name} src={user.avatarUrl} size={32} className="ml-1" />
          </div>
        </header>

        <main id="main" className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function UserFooter({ user, onSignOut }: { user: ShellUser; onSignOut: () => void }) {
  return (
    <div className="border-t border-border p-3">
      <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
        <Avatar name={user.name} src={user.avatarUrl} size={34} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted">{user.identifier ?? user.role}</p>
        </div>
        <button
          onClick={onSignOut}
          aria-label="Sign out"
          className="rounded-lg p-1.5 text-muted transition hover:bg-surface-2 hover:text-danger"
        >
          <LogOut size={16} aria-hidden />
        </button>
      </div>
    </div>
  );
}
