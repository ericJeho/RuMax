import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';
import { getSessionClaims } from '@/lib/auth';
import { homeFor } from '@/lib/rbac';

/**
 * Public marketing shell. The header is given the viewer's identity when they already
 * have a session so the "Sign in" call to action becomes a link into their own portal.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const claims = await getSessionClaims();

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader
        signedInAs={
          claims ? { name: claims.name.split(' ')[0] || 'My portal', href: homeFor(claims.role) } : null
        }
      />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
