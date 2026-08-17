import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { AuthProvider } from '@prisma/client';

import { env } from '@/lib/env';
import {
  challengeFor,
  createState,
  createVerifier,
  isConfigured,
  providerConfig,
  redirectUri,
} from '@/lib/oauth';

export const dynamic = 'force-dynamic';

const PROVIDERS: Record<string, AuthProvider> = { google: 'GOOGLE', microsoft: 'MICROSOFT' };

/** Short-lived cookie carrying the PKCE verifier and state across the round trip. */
export const OAUTH_COOKIE = 'rumax_oauth';

/**
 * GET /api/auth/oauth/:provider — begin third-party sign-in.
 *
 * State and a PKCE verifier are generated here and stored in an httpOnly cookie rather
 * than in a server-side store: the flow is short, single-use, and a cookie the browser
 * cannot read is sufficient to prove the callback belongs to the request that started it.
 * The cookie expires in ten minutes, which is generous for a consent screen and short
 * enough that a captured value is rarely still valid.
 */
export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider: slug } = await params;
  const provider = PROVIDERS[slug?.toLowerCase()];

  if (!provider) {
    return NextResponse.redirect(new URL('/login?error=unknown_provider', env.NEXT_PUBLIC_SITE_URL));
  }

  if (!isConfigured(provider)) {
    return NextResponse.redirect(new URL('/login?error=provider_not_configured', env.NEXT_PUBLIC_SITE_URL));
  }

  const config = providerConfig(provider);
  const verifier = createVerifier();
  const state = createState();

  // Where to send the user afterwards. Relative paths only — an absolute URL here would
  // turn the callback into an open redirect that borrows our domain's credibility.
  const requested = new URL(request.url).searchParams.get('next') ?? '';
  const next = requested.startsWith('/') && !requested.startsWith('//') ? requested : '';

  const authorize = new URL(config.authorizeUrl);
  authorize.searchParams.set('client_id', config.clientId!);
  authorize.searchParams.set('redirect_uri', redirectUri(provider, env.NEXT_PUBLIC_SITE_URL));
  authorize.searchParams.set('response_type', 'code');
  authorize.searchParams.set('scope', config.scope);
  authorize.searchParams.set('state', state);
  authorize.searchParams.set('code_challenge', challengeFor(verifier));
  authorize.searchParams.set('code_challenge_method', 'S256');
  // Ask for a fresh account choice rather than silently reusing whichever session the
  // browser happens to hold, which surprises anyone with more than one account.
  authorize.searchParams.set('prompt', 'select_account');

  const cookieStore = await cookies();
  cookieStore.set(OAUTH_COOKIE, JSON.stringify({ state, verifier, provider, next }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });

  return NextResponse.redirect(authorize);
}
