import { z } from 'zod';

import { handleError, notFound, ok, parseBody, rateLimitOrThrow } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { draftFeedback } from '@/lib/ai';

const schema = z.object({ submissionId: z.string().min(1) });

// See the note in ../chat/route.ts: generation can outrun a serverless default timeout.
export const maxDuration = 60;

/**
 * POST /api/ai/feedback — draft formative feedback for a lecturer to edit.
 *
 * Restricted to teaching staff and never returns a mark. The drafted text is not stored
 * against the submission; it only reaches the student once a human has edited it and
 * released it through the grading endpoint.
 */
export async function POST(request: Request) {
  try {
    const marker = await requireRole('LECTURER', 'ADMIN', 'REGISTRAR');
    rateLimitOrThrow(`ai-feedback:${marker.id}`, 40, 60_000);

    const { submissionId } = await parseBody(request, schema);

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { assignment: { include: { course: { select: { lecturerId: true } } } } },
    });
    if (!submission) throw notFound('Submission');
    if (marker.role === 'LECTURER' && submission.assignment.course.lecturerId !== marker.id) {
      throw notFound('Submission');
    }

    const response = await draftFeedback(
      submission.assignment.title,
      submission.assignment.instructions,
      submission.content ?? '(no written content submitted)',
    );

    return ok({
      text: response.text,
      source: response.source,
      disclaimer:
        'Draft only. Review, edit and take ownership of this feedback before releasing it — the mark is always yours to set.',
    });
  } catch (error) {
    return handleError(error);
  }
}
