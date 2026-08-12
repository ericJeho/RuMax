import { z } from 'zod';

import { handleError, ok, parseBody, rateLimitOrThrow } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { chat, type AiPersona } from '@/lib/ai';

const schema = z.object({
  persona: z.enum(['tutor', 'advisor', 'writing', 'research', 'career']).default('tutor'),
  courseId: z.string().optional(),
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(20_000) }))
    .min(1)
    .max(40),
});

/**
 * A serverless platform's default function timeout (10–15s on Vercel) is shorter than the
 * 30s ceiling `lib/ai.ts` allows a Claude call, so a slow-but-successful generation would
 * be killed mid-flight and surface as a 504 rather than falling back to the offline
 * responder. 60s leaves room for that ceiling plus the surrounding database work. The
 * setting is inert anywhere the process is long-lived (Docker, Kubernetes, `next start`).
 */
export const maxDuration = 60;

/**
 * POST /api/ai/chat
 *
 * Rate limited per user rather than per IP — students share networks, and a per-IP limit
 * would penalise a whole computer lab for one heavy user.
 */
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    rateLimitOrThrow(`ai:${user.id}`, 30, 60_000);

    const body = await parseBody(request, schema);

    // Ground the model in the student's actual syllabus when they name a course, and only
    // for a course they are registered on.
    let context: string | undefined;
    if (body.courseId) {
      const course = await prisma.course.findFirst({
        where: {
          id: body.courseId,
          registrations: { some: { userId: user.id, status: 'APPROVED' } },
        },
        include: { modules: { select: { title: true }, orderBy: { position: 'asc' } } },
      });
      if (course) {
        context = [
          `Course: ${course.code} ${course.title} (${course.credits} credits, level ${course.level})`,
          `Description: ${course.description}`,
          `Units: ${course.modules.map((m) => m.title).join('; ')}`,
        ].join('\n');
      }
    }

    const response = await chat(body.persona as AiPersona, body.messages, { context });

    // Persist the exchange: it gives students their history back and gives academic
    // integrity reviews a record of what assistance was actually given.
    const title = body.messages.find((m) => m.role === 'user')?.content.slice(0, 60) ?? 'Conversation';
    await prisma.tutorConversation.create({
      data: {
        userId: user.id,
        title,
        courseId: body.courseId,
        messages: [...body.messages, { role: 'assistant', content: response.text }] as never,
      },
    });

    return ok(response);
  } catch (error) {
    return handleError(error);
  }
}
