import { z } from 'zod';

import { audit, handleError, ok, parseBody } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

const schema = z.object({
  phone: z.string().max(40).optional(),
  country: z.string().max(80).optional(),
  city: z.string().max(80).optional(),
  bio: z.string().max(1000).optional(),
  locale: z.string().max(8).optional(),
  timezone: z.string().max(60).optional(),
  avatarUrl: z.string().url().max(500).optional(),
});

/**
 * PATCH /api/me — update the caller's own profile.
 *
 * Only presentation fields are writable here. Name, email, role, programme and student
 * number are part of the academic record and can only be changed by the registrar, with
 * an audit entry — a student editing their own name would invalidate every certificate
 * hash tied to it.
 */
export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = await parseBody(request, schema);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        phone: body.phone?.trim() || null,
        country: body.country?.trim() || null,
        city: body.city?.trim() || null,
        bio: body.bio?.trim() || null,
        ...(body.locale ? { locale: body.locale } : {}),
        ...(body.timezone ? { timezone: body.timezone } : {}),
        ...(body.avatarUrl ? { avatarUrl: body.avatarUrl } : {}),
      },
      select: { id: true, locale: true, timezone: true, country: true, city: true, phone: true },
    });

    await audit({
      userId: user.id,
      action: 'profile.update',
      entityType: 'User',
      entityId: user.id,
      metadata: { fields: Object.keys(body) },
    });

    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}
