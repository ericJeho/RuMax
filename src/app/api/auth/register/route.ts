import { headers } from 'next/headers';
import { z } from 'zod';

import { audit, conflict, created, handleError, parseBody, rateLimitOrThrow, HttpError } from '@/lib/api';
import { clientIp, createSession, hashPassword, passwordProblems } from '@/lib/auth';
import { prisma } from '@/lib/db';

const schema = z.object({
  firstName: z.string().min(1, 'Enter your first name.').max(80),
  lastName: z.string().min(1, 'Enter your family name.').max(80),
  email: z.string().email('Enter a valid email address.'),
  password: z.string(),
  country: z.string().max(80).optional(),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms to create an account.' }),
  }),
});

/**
 * POST /api/auth/register
 *
 * Creates an APPLICANT account — the entry point to the admissions funnel. Student,
 * lecturer and staff accounts are never self-service: they are provisioned by the
 * registrar when an application is accepted or a member of staff is appointed.
 */
export async function POST(request: Request) {
  try {
    const headerList = await headers();
    const ip = clientIp(headerList) ?? 'unknown';
    rateLimitOrThrow(`register:${ip}`, 5, 3_600_000);

    const body = await parseBody(request, schema);

    const problems = passwordProblems(body.password);
    if (problems.length > 0) {
      throw new HttpError(422, 'weak_password', 'Choose a stronger password.', { password: problems });
    }

    const email = body.email.trim().toLowerCase();
    if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
      throw conflict('An account already exists for that email address. Try signing in instead.');
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(body.password),
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
        country: body.country?.trim() || null,
        role: 'APPLICANT',
        status: 'PENDING',
      },
    });

    await createSession(user);
    await audit({ userId: user.id, action: 'auth.register', ip });

    return created({
      user: { id: user.id, email: user.email, firstName: user.firstName, role: user.role },
      redirectTo: '/apply',
    });
  } catch (error) {
    return handleError(error);
  }
}
