import { headers } from 'next/headers';
import { z } from 'zod';

import { created, handleError, parseBody, rateLimitOrThrow } from '@/lib/api';
import { clientIp } from '@/lib/auth';
import { prisma } from '@/lib/db';

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  subject: z.string().min(1).max(150),
  message: z.string().min(10).max(10_000),
  // Honeypot: a real person never fills this in, because it is hidden from them.
  website: z.string().max(0).optional(),
});

/** POST /api/contact — public enquiry form. */
export async function POST(request: Request) {
  try {
    const headerList = await headers();
    const ip = clientIp(headerList) ?? 'unknown';
    rateLimitOrThrow(`contact:${ip}`, 5, 3_600_000);

    const body = await parseBody(request, schema);

    const enquiry = await prisma.contactEnquiry.create({
      data: {
        name: body.name.trim(),
        email: body.email.trim().toLowerCase(),
        subject: body.subject.trim(),
        message: body.message.trim(),
      },
    });

    return created({
      id: enquiry.id,
      message: 'Message received. We reply to everything, usually within one working day.',
    });
  } catch (error) {
    return handleError(error);
  }
}
