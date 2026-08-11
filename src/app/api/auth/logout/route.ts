import { audit, handleError, ok } from '@/lib/api';
import { destroySession, getSessionClaims } from '@/lib/auth';

/** POST /api/auth/logout — revokes the session row and clears the cookie. */
export async function POST() {
  try {
    const claims = await getSessionClaims();
    await destroySession();
    if (claims) await audit({ userId: claims.sub, action: 'auth.logout' });
    return ok({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
