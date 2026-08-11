import { z } from 'zod';

import { handleError, ok, parseBody } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { saveAnswer } from '@/lib/quiz';

const schema = z.object({
  questionId: z.string().min(1),
  selected: z.array(z.string()).max(20).optional(),
  text: z.string().max(50_000).optional(),
});

/** PUT /api/attempts/:id/answers — autosave a single answer mid-attempt. */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await parseBody(request, schema);

    const answer = await saveAnswer(user.id, id, body.questionId, {
      selected: body.selected,
      text: body.text,
    });

    return ok({ questionId: answer.questionId, savedAt: answer.updatedAt });
  } catch (error) {
    return handleError(error);
  }
}
