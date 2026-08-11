import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

/**
 * Edge middleware: the first gate in front of every protected route.
 *
 * It only checks that a structurally valid, unexpired JWT is present and that the role
 * inside it is allowed in this area — it deliberately does no database work, because
 * middleware runs on every request including static assets. Revocation, suspension and
 * fine-grained permissions are enforced again in the route handlers and server
 * components via `getCurrentUser()`/`requireRole()`, which do hit the database. Treat
 * this layer as a fast redirect, never as the authorisation decision.
 */

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? 'rumax_session';
const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? '');

type Area = { prefix: string; roles: string[] };

const PROTECTED: Area[] = [
  { prefix: '/portal', roles: ['STUDENT', 'ALUMNI', 'ADMIN'] },
  { prefix: '/lecturer', roles: ['LECTURER', 'ADMIN'] },
  { prefix: '/admin', roles: ['ADMIN', 'REGISTRAR', 'FINANCE'] },
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const area = PROTECTED.find((a) => pathname === a.prefix || pathname.startsWith(`${a.prefix}/`));
  if (!area) return NextResponse.next();

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return redirectToLogin(request);

  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: 'rumax.edu',
      audience: 'rumax.edu/app',
    });

    const role = String(payload.role ?? '');
    if (!area.roles.includes(role)) {
      // Signed in, but in the wrong portal — send them to their own rather than to login.
      const home =
        role === 'LECTURER' ? '/lecturer' : ['ADMIN', 'REGISTRAR', 'FINANCE'].includes(role) ? '/admin' : '/portal';
      return NextResponse.redirect(new URL(home, request.url));
    }

    return NextResponse.next();
  } catch {
    // Expired or tampered token: clear it so the user is not stuck in a redirect loop.
    const response = redirectToLogin(request);
    response.cookies.delete(COOKIE_NAME);
    return response;
  }
}

function redirectToLogin(request: NextRequest) {
  const url = new URL('/login', request.url);
  url.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/portal/:path*', '/lecturer/:path*', '/admin/:path*'],
};
