import { describe, expect, it } from 'vitest';

import { challengeFor, createState, createVerifier, decideLinking, readProfile, redirectUri } from '@/lib/oauth';

describe('decideLinking', () => {
  it('signs in when this exact provider identity is already linked', () => {
    expect(
      decideLinking({ hasExistingLink: true, existingAccountWithEmail: true, emailVerified: false }),
    ).toEqual({ action: 'sign-in' });
  });

  it('creates an account when the address is unknown here', () => {
    expect(
      decideLinking({ hasExistingLink: false, existingAccountWithEmail: false, emailVerified: true }),
    ).toEqual({ action: 'create' });
  });

  it('creates an account for an unverified address that matches nobody', () => {
    // Safe: the address identifies only the account it is creating.
    expect(
      decideLinking({ hasExistingLink: false, existingAccountWithEmail: false, emailVerified: false }),
    ).toEqual({ action: 'create' });
  });

  it('links to an existing account only when the provider vouches for the address', () => {
    expect(
      decideLinking({ hasExistingLink: false, existingAccountWithEmail: true, emailVerified: true }),
    ).toEqual({ action: 'link' });
  });

  it('refuses to attach an unverified address to an existing account', () => {
    // The account-takeover case. Without this, anyone who can get a provider to issue a
    // token for registrar@rumax.edu inherits the registrar's account without a password.
    const outcome = decideLinking({
      hasExistingLink: false,
      existingAccountWithEmail: true,
      emailVerified: false,
    });
    expect(outcome.action).toBe('refuse');
    expect(outcome.action === 'refuse' && outcome.reason).toContain('Sign in with your password');
  });
});

describe('readProfile', () => {
  it('trusts email_verified from Google', () => {
    const profile = readProfile('GOOGLE', {
      sub: '1234',
      email: 'Chikondi@Example.com',
      email_verified: true,
      given_name: 'Chikondi',
      family_name: 'Banda',
    });
    expect(profile).toMatchObject({
      providerId: '1234',
      email: 'chikondi@example.com',
      emailVerified: true,
      firstName: 'Chikondi',
      lastName: 'Banda',
    });
  });

  it('does not treat a Google address as verified unless the claim is exactly true', () => {
    expect(readProfile('GOOGLE', { sub: '1', email: 'a@b.com', email_verified: 'true' })?.emailVerified).toBe(
      false,
    );
    expect(readProfile('GOOGLE', { sub: '1', email: 'a@b.com' })?.emailVerified).toBe(false);
  });

  it('never treats a Microsoft address as verified', () => {
    // The common endpoint serves personal accounts, whose email claim is self-asserted,
    // and the response does not distinguish them from tenant accounts.
    const profile = readProfile('MICROSOFT', {
      sub: 'abc',
      email: 'someone@outlook.com',
      email_verified: true,
      name: 'Someone Else',
    });
    expect(profile?.emailVerified).toBe(false);
  });

  it('falls back to the full name when given and family names are absent', () => {
    const profile = readProfile('MICROSOFT', { sub: 'x', email: 'a@b.com', name: 'Grace Chirwa' });
    expect(profile).toMatchObject({ firstName: 'Grace', lastName: 'Chirwa' });
  });

  it('falls back to the local part when no name is supplied at all', () => {
    expect(readProfile('GOOGLE', { sub: 'x', email: 'tendai@example.com' })?.firstName).toBe('tendai');
  });

  it('rejects a response with no subject or no email', () => {
    expect(readProfile('GOOGLE', { email: 'a@b.com' })).toBeNull();
    expect(readProfile('GOOGLE', { sub: 'x' })).toBeNull();
  });
});

describe('PKCE', () => {
  it('derives a challenge that is the base64url SHA-256 of the verifier', () => {
    // Known vector from RFC 7636 appendix B.
    expect(challengeFor('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')).toBe(
      'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
    );
  });

  it('generates a fresh verifier and state each time', () => {
    expect(createVerifier()).not.toBe(createVerifier());
    expect(createState()).not.toBe(createState());
  });

  it('produces url-safe values needing no further encoding', () => {
    for (let i = 0; i < 20; i += 1) {
      expect(createVerifier()).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(createState()).toMatch(/^[A-Za-z0-9_-]+$/);
    }
  });
});

describe('redirectUri', () => {
  it('builds the callback for each provider', () => {
    expect(redirectUri('GOOGLE', 'https://ru-max.vercel.app')).toBe(
      'https://ru-max.vercel.app/api/auth/oauth/google/callback',
    );
  });

  it('tolerates a trailing slash on the site URL', () => {
    expect(redirectUri('MICROSOFT', 'https://ru-max.vercel.app/')).toBe(
      'https://ru-max.vercel.app/api/auth/oauth/microsoft/callback',
    );
  });
});
