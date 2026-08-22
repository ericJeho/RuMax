import { createHash, randomBytes } from 'node:crypto';

import type { AuthProvider } from '@prisma/client';

/**
 * Sign-in with Google and Microsoft.
 *
 * Both are ordinary OAuth 2.0 authorisation-code flows with PKCE. The interesting part is
 * not the protocol — it is deciding what to do when the address a provider hands back
 * already belongs to an account here. Get that wrong and third-party sign-in becomes an
 * account-takeover mechanism, so the rule lives in `decideLinking` below with the reasoning
 * attached.
 */

export type ProviderConfig = {
  id: AuthProvider;
  label: string;
  authorizeUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scope: string;
  clientId?: string;
  clientSecret?: string;
};

export function providerConfig(provider: AuthProvider): ProviderConfig {
  switch (provider) {
    case 'GOOGLE':
      return {
        id: 'GOOGLE',
        label: 'Google',
        authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userInfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
        scope: 'openid email profile',
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      };
    case 'MICROSOFT':
      return {
        id: 'MICROSOFT',
        label: 'Microsoft',
        // The `common` tenant accepts both work/school and personal accounts.
        authorizeUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        userInfoUrl: 'https://graph.microsoft.com/oidc/userinfo',
        scope: 'openid email profile',
        clientId: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      };
  }
}

export function isConfigured(provider: AuthProvider): boolean {
  const config = providerConfig(provider);
  return Boolean(config.clientId && config.clientSecret);
}

/** Which providers the sign-in page should offer. */
export function configuredProviders(): { id: AuthProvider; label: string }[] {
  return (['GOOGLE', 'MICROSOFT'] as const)
    .filter(isConfigured)
    .map((id) => ({ id, label: providerConfig(id).label }));
}

export function redirectUri(provider: AuthProvider, siteUrl: string): string {
  return `${siteUrl.replace(/\/$/, '')}/api/auth/oauth/${provider.toLowerCase()}/callback`;
}

/* ------------------------------------------------------------------- PKCE */

export function createVerifier(): string {
  return randomBytes(32).toString('base64url');
}

export function challengeFor(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}

export function createState(): string {
  return randomBytes(16).toString('base64url');
}

/* ----------------------------------------------------------------- Profile */

export type ProviderProfile = {
  providerId: string;
  email: string;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
};

/**
 * Normalise a provider's userinfo response.
 *
 * `emailVerified` is treated as false unless the provider explicitly says otherwise.
 * Google returns `email_verified`. Microsoft does not return it at all: a work or school
 * account's address is verified by the tenant, but a personal Microsoft account's `email`
 * claim is self-asserted and can be set to an address the holder does not control. Since
 * the `common` endpoint serves both and the response does not distinguish them, the safe
 * reading is unverified — which restricts what the address may be used for rather than
 * refusing the sign-in.
 */
export function readProfile(provider: AuthProvider, raw: Record<string, unknown>): ProviderProfile | null {
  const email = typeof raw.email === 'string' ? raw.email.trim().toLowerCase() : '';
  const providerId = typeof raw.sub === 'string' ? raw.sub : '';
  if (!email || !providerId) return null;

  const given = typeof raw.given_name === 'string' ? raw.given_name : '';
  const family = typeof raw.family_name === 'string' ? raw.family_name : '';
  const full = typeof raw.name === 'string' ? raw.name : '';
  const [fallbackFirst = '', ...fallbackRest] = full.split(' ');

  return {
    providerId,
    email,
    emailVerified: provider === 'GOOGLE' ? raw.email_verified === true : false,
    firstName: given || fallbackFirst || email.split('@')[0],
    lastName: family || fallbackRest.join(' ') || '',
  };
}

/* ------------------------------------------------------------------ Linking */

export type LinkingOutcome =
  | { action: 'sign-in' }
  | { action: 'create' }
  | { action: 'link' }
  | { action: 'refuse'; reason: string };

/**
 * What to do when someone signs in with a provider.
 *
 * The dangerous case is the third one. If an account already exists for the address and we
 * link to it on the strength of an unverified claim, then anyone who can persuade a
 * provider to issue them a token for `registrar@rumax.edu` takes over the registrar's
 * account — no password needed. Providers that let a user type an address without proving
 * control make this trivial.
 *
 * So an unverified address may create a new account, where it identifies nobody but
 * itself, and may never attach itself to an existing one. Attaching requires either the
 * provider vouching for the address, or the user proving they hold the account by signing
 * in with their password and linking from their profile.
 */
export function decideLinking(input: {
  /** An existing link for this exact provider identity, if any. */
  hasExistingLink: boolean;
  /** An account already registered with this email address, if any. */
  existingAccountWithEmail: boolean;
  emailVerified: boolean;
}): LinkingOutcome {
  if (input.hasExistingLink) return { action: 'sign-in' };

  if (!input.existingAccountWithEmail) return { action: 'create' };

  if (input.emailVerified) return { action: 'link' };

  return {
    action: 'refuse',
    reason:
      'An account already exists for that email address, and your provider did not confirm that you own it. ' +
      'Sign in with your password, then link this provider from your profile.',
  };
}
