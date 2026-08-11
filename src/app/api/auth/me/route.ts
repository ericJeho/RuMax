import { handleError, ok } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { permissionsFor } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

/** GET /api/auth/me — the signed-in user plus their effective permissions. */
export async function GET() {
  try {
    const user = await requireUser();
    return ok({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      studentNumber: user.studentNumber,
      staffNumber: user.staffNumber,
      programId: user.programId,
      locale: user.locale,
      timezone: user.timezone,
      twoFactorEnabled: user.twoFactorEnabled,
      permissions: permissionsFor(user.role),
    });
  } catch (error) {
    return handleError(error);
  }
}
