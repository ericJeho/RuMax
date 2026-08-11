import 'server-only';

import { cookies, headers } from 'next/headers';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import type { Role, User } from '@prisma/client';

import { env } from './env';
import { prisma } from './db';

const secretKey = new TextEncoder().encode(env.AUTH_SECRET);
const ISSUER = 'rumax.edu';
const AUDIENCE = 'rumax.edu/app';

export type SessionClaims = {
  sub: string;
  email: string;
  role: Role;
  name: string;
  /// Session row id — lets us revoke a token server-side before it expires.
  sid: string;
};

const MAX_FAILED_LOGINS = 5;
const LOCKOUT_MINUTES = 15;
const BCRYPT_ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// The password policy lives in ./password so the register form can apply the identical
// rules in the browser; this module is server-only and cannot be imported there.
export { passwordProblems, isStrongPassword } from './password';

export async function signSessionToken(claims: SessionClaims): Promise<string> {
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setSubject(claims.sub)
    .setExpirationTime(`${env.AUTH_TOKEN_TTL_HOURS}h`)
    .sign(secretKey);
}

export async function verifySessionToken(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (!payload.sub || !payload.sid) return null;
    return {
      sub: payload.sub,
      sid: String(payload.sid),
      email: String(payload.email ?? ''),
      role: payload.role as Role,
      name: String(payload.name ?? ''),
    };
  } catch {
    return null;
  }
}

/**
 * Authenticate a set of credentials.
 *
 * Failed attempts are counted and the account locks for {@link LOCKOUT_MINUTES} after
 * five consecutive failures. The same generic message is returned for "no such user"
 * and "wrong password" so the endpoint cannot be used to enumerate accounts.
 */
export async function authenticate(
  email: string,
  password: string,
): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
  const normalised = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalised } });

  if (!user) {
    // Equalise timing with the success path so response time does not leak existence.
    await bcrypt.compare(password, '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva');
    return { ok: false, error: 'Incorrect email or password.' };
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return { ok: false, error: 'Account temporarily locked. Try again shortly.' };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    const failed = user.failedLogins + 1;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLogins: failed,
        lockedUntil:
          failed >= MAX_FAILED_LOGINS ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000) : null,
      },
    });
    return { ok: false, error: 'Incorrect email or password.' };
  }

  if (user.status === 'SUSPENDED') {
    return { ok: false, error: 'This account is suspended. Contact the registrar.' };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() },
  });

  return { ok: true, user };
}

/** Create the session row, sign a JWT for it and set the httpOnly cookie. */
export async function createSession(user: User): Promise<string> {
  const headerList = await headers();
  const expiresAt = new Date(Date.now() + env.AUTH_TOKEN_TTL_HOURS * 3_600_000);

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      tokenId: crypto.randomUUID(),
      userAgent: headerList.get('user-agent')?.slice(0, 250) ?? null,
      ip: clientIp(headerList),
      expiresAt,
    },
  });

  const token = await signSessionToken({
    sub: user.id,
    sid: session.id,
    email: user.email,
    role: user.role,
    name: `${user.firstName} ${user.lastName}`,
  });

  const cookieStore = await cookies();
  cookieStore.set(env.AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });

  return token;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(env.AUTH_COOKIE_NAME)?.value;
  if (token) {
    const claims = await verifySessionToken(token);
    if (claims?.sid) {
      await prisma.session
        .update({ where: { id: claims.sid }, data: { revokedAt: new Date() } })
        .catch(() => undefined);
    }
  }
  cookieStore.delete(env.AUTH_COOKIE_NAME);
}

/** Claims only — cheap, no database round trip. Use in layouts and nav rendering. */
export async function getSessionClaims(): Promise<SessionClaims | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(env.AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * The full user record, with the session verified as still live. Returns null if the
 * session was revoked (sign out everywhere, role change, admin suspension) even when
 * the JWT itself has not expired yet.
 */
export async function getCurrentUser(): Promise<User | null> {
  const claims = await getSessionClaims();
  if (!claims) return null;

  const session = await prisma.session.findUnique({
    where: { id: claims.sid },
    include: { user: true },
  });

  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;
  if (session.user.status === 'SUSPENDED') return null;
  return session.user;
}

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError('Authentication required.', 401);
  return user;
}

export async function requireRole(...roles: Role[]): Promise<User> {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw new AuthError('You do not have permission to perform this action.', 403);
  }
  return user;
}

export function clientIp(headerList: Headers): string | null {
  const forwarded = headerList.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return headerList.get('x-real-ip');
}
