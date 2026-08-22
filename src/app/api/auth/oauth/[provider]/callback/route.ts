import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import type { AuthProvider } from '@prisma/client';

import { audit } from '@/lib/api';
import { clientIp, createSession, hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { env } from '@/lib/env';
import { decideLinking, providerConfig, readProfile, redirectUri } from '@/lib/oauth';
import { homeFor } from '@/lib/rbac';

import { OAUTH_COOKIE } from '../route';

export const dynamic = 'force-dynamic';

const PROVIDERS: Record<string, AuthProvider> = { google: 'GOOGLE', microsoft: 'MICROSOFT' };

function back(error: string) {
  return NextResponse.redirect(new URL(`/login?error=${error}`, env.NEXT_PUBLIC_SITE_URL));
}

/**
 * GET /api/auth/oauth/:provider/callback — finish third-party sign-in.
 *
 * Everything here fails closed. A mismatched state, a missing verifier, a provider that
 * will not return a profile, or an address that cannot safely be attached to an existing
 * account all end in a redirect back to the sign-in page with a reason, never in a session.
 */
export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider: slug } = await params;
  const provider = PROVIDERS[slug?.toLowerCase()];
  if (!provider) return back('unknown_provider');

  const url = new URL(request.url);
  const cookieStore = await cookies();
  const raw = cookieStore.get(OAUTH_COOKIE)?.value;

  // Single use, whatever happens next.
  cookieStore.delete(OAUTH_COOKIE);

  if (url.searchParams.get('error')) return back('cancelled');
  if (!raw) return back('expired');

  let saved: { state?: string; verifier?: string; provider?: string; next?: string };
  try {
    saved = JSON.parse(raw);
  } catch {
    return back('expired');
  }

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (!code || !state || !saved.state || !saved.verifier) return back('expired');
  if (state !== saved.state || saved.provider !== provider) return back('state_mismatch');

  const config = providerConfig(provider);
  if (!config.clientId || !config.clientSecret) return back('provider_not_configured');

  try {
    const tokenResponse = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: redirectUri(provider, env.NEXT_PUBLIC_SITE_URL),
        code_verifier: saved.verifier,
      }),
    });

    if (!tokenResponse.ok) return back('exchange_failed');
    const tokens = (await tokenResponse.json()) as { access_token?: string };
    if (!tokens.access_token) return back('exchange_failed');

    const profileResponse = await fetch(config.userInfoUrl, {
      headers: { authorization: `Bearer ${tokens.access_token}`, accept: 'application/json' },
    });
    if (!profileResponse.ok) return back('profile_failed');

    const profile = readProfile(provider, (await profileResponse.json()) as Record<string, unknown>);
    if (!profile) return back('profile_failed');

    const [link, byEmail] = await Promise.all([
      prisma.linkedAccount.findUnique({
        where: { provider_providerId: { provider, providerId: profile.providerId } },
        include: { user: true },
      }),
      prisma.user.findUnique({ where: { email: profile.email } }),
    ]);

    const decision = decideLinking({
      hasExistingLink: Boolean(link),
      existingAccountWithEmail: Boolean(byEmail),
      emailVerified: profile.emailVerified,
    });

    if (decision.action === 'refuse') return back('link_requires_password');

    let user = link?.user ?? null;

    if (decision.action === 'link' && byEmail) {
      await prisma.linkedAccount.create({
        data: { userId: byEmail.id, provider, providerId: profile.providerId, email: profile.email },
      });
      user = byEmail;
      await audit({ userId: byEmail.id, action: 'auth.oauth.link', metadata: { provider } });
    }

    if (decision.action === 'create') {
      user = await prisma.user.create({
        data: {
          email: profile.email,
          // No password is set. A random unusable value keeps the column non-null while
          // guaranteeing the password path can never authenticate this account — the
          // holder uses the provider, or sets a password through the reset flow.
          passwordHash: await hashPassword(`${crypto.randomUUID()}${crypto.randomUUID()}`),
          firstName: profile.firstName,
          lastName: profile.lastName,
          role: 'APPLICANT',
          status: 'PENDING',
          linkedAccounts: {
            create: { provider, providerId: profile.providerId, email: profile.email },
          },
        },
      });
      await audit({ userId: user.id, action: 'auth.oauth.register', metadata: { provider } });
    }

    if (!user) return back('profile_failed');

    if (user.status === 'SUSPENDED') return back('account_suspended');

    if (link) {
      await prisma.linkedAccount.update({ where: { id: link.id }, data: { lastUsedAt: new Date() } });
    }

    await createSession(user);
    const headerList = await headers();
    await audit({
      userId: user.id,
      action: 'auth.oauth.login',
      ip: clientIp(headerList) ?? undefined,
      metadata: { provider },
    });

    const destination = saved.next && saved.next.startsWith('/') ? saved.next : homeFor(user.role);
    return NextResponse.redirect(new URL(destination, env.NEXT_PUBLIC_SITE_URL));
  } catch {
    return back('exchange_failed');
  }
}
