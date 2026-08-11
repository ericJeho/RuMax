import { z } from 'zod';

import { audit, handleError, ok } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { submitAttempt } from '@/lib/quiz';

const schema = z.object({
  proctorFlags: z
    .array(z.object({ at: z.string(), event: z.string(), detail: z.string().optional() }))
    .max(500)
    .optional(),
});

/** POST /api/attempts/:id/submit — close the attempt and mark it. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;

    // Proctoring telemetry is optional; a body-less submit is valid.
    const body = await request
      .json()
      .then((json) => schema.parse(json))
      .catch(() => ({ proctorFlags: undefined }));

    const result = await submitAttempt(user.id, id, { proctorFlags: body.proctorFlags });

    await audit({
      userId: user.id,
      action: 'quiz.attempt.submit',
      entityType: 'QuizAttempt',
      entityId: id,
      metadata: { percent: result.percent, flags: body.proctorFlags?.length ?? 0 },
    });

    return ok(result);
  } catch (error) {
    return handleError(error);
  }
}
