import { z } from 'zod';

import { handleError, ok, parseBody, rateLimitOrThrow } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateQuizQuestions } from '@/lib/ai';

const schema = z.object({
  topic: z.string().min(3).max(300),
  count: z.number().int().min(1).max(20).default(5),
  courseId: z.string().optional(),
});

// See the note in ../chat/route.ts: generation can outrun a serverless default timeout.
export const maxDuration = 60;

/** POST /api/ai/quiz-questions — draft question suggestions for the quiz builder. */
export async function POST(request: Request) {
  try {
    const user = await requireRole('LECTURER', 'ADMIN');
    rateLimitOrThrow(`ai-quiz:${user.id}`, 20, 60_000);

    const body = await parseBody(request, schema);

    // Ground suggestions in the course's own material where we have it.
    let material: string | undefined;
    if (body.courseId) {
      const course = await prisma.course.findUnique({
        where: { id: body.courseId },
        include: {
          modules: { include: { lessons: { select: { title: true, body: true } } }, orderBy: { position: 'asc' } },
        },
      });
      if (course) {
        material = [
          course.description,
          ...course.modules.flatMap((module) => [
            module.title,
            ...module.lessons.map((lesson) => `${lesson.title}: ${lesson.body ?? ''}`),
          ]),
        ].join('\n');
      }
    }

    const response = await generateQuizQuestions(body.topic, body.count, material);

    return ok({
      text: response.text,
      source: response.source,
      disclaimer:
        'Suggestions only. Check every question and its marked answer before publishing — a wrong key in a graded quiz is worse than no quiz.',
    });
  } catch (error) {
    return handleError(error);
  }
}
