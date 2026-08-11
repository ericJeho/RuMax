import { audit, created, handleError } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { getServedQuestions, startAttempt } from '@/lib/quiz';

/** POST /api/quizzes/:id/attempts — begin (or resume) an attempt and serve its paper. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const { attempt, quiz } = await startAttempt(user.id, id);
    const questions = await getServedQuestions(attempt.id, user.id);

    await audit({
      userId: user.id,
      action: 'quiz.attempt.start',
      entityType: 'QuizAttempt',
      entityId: attempt.id,
      metadata: { quiz: quiz.title, attemptNo: attempt.attemptNo },
    });

    return created({
      attemptId: attempt.id,
      attemptNo: attempt.attemptNo,
      startedAt: attempt.startedAt,
      // The client counts down from this, but the server is the authority: an attempt
      // submitted after the deadline is still marked as expired.
      endsAt: new Date(attempt.startedAt.getTime() + quiz.durationMins * 60_000),
      durationMins: quiz.durationMins,
      proctored: quiz.proctored,
      questions,
    });
  } catch (error) {
    return handleError(error);
  }
}
