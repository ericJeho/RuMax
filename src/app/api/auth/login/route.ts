import { headers } from 'next/headers';
import { z } from 'zod';

import { audit, handleError, ok, parseBody, rateLimitOrThrow } from '@/lib/api';
import { authenticate, clientIp, createSession } from '@/lib/auth';
import { homeFor } from '@/lib/rbac';

const schema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
});

/**
 * POST /api/auth/login
 *
 * Rate limited per client IP. Failure responses are intentionally uniform so the
 * endpoint cannot be used to discover which addresses have accounts.
 */
export async function POST(request: Request) {
  try {
    const headerList = await headers();
    const ip = clientIp(headerList) ?? 'unknown';
    rateLimitOrThrow(`login:${ip}`, 10, 60_000);

    const { email, password } = await parseBody(request, schema);
    const result = await authenticate(email, password);

    if (!result.ok) {
      await audit({ action: 'auth.login.failed', metadata: { email }, ip });
      return Response.json({ error: { code: 'invalid_credentials', message: result.error } }, { status: 401 });
    }

    await createSession(result.user);
    await audit({ userId: result.user.id, action: 'auth.login', ip });

    return ok({
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
      },
      redirectTo: homeFor(result.user.role),
    });
  } catch (error) {
    return handleError(error);
  }
}
