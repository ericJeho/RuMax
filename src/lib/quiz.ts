import 'server-only';

import { HttpError, badRequest, notFound } from './api';
import { prisma } from './db';

/**
 * Examination engine.
 *
 * Design decisions worth knowing about:
 *  - The served question order is persisted on the attempt. Shuffling on each render
 *    would let a student reload to reshuffle, and would make a proctoring report
 *    impossible to reconstruct.
 *  - Correct answers are never sent to the browser during an attempt. The question
 *    payload the client receives is stripped of `isCorrect` server-side.
 *  - Marking happens on the server on submit. Objective questions are graded
 *    immediately; essays are left unscored for the lecturer.
 */

export type ServedQuestion = {
  id: string;
  type: string;
  prompt: string;
  points: number;
  options: { id: string; text: string }[];
};

export async function startAttempt(userId: string, quizId: string) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: { include: { options: true }, orderBy: { position: 'asc' } },
      course: { select: { id: true, code: true } },
    },
  });

  if (!quiz || !quiz.published) throw notFound('Quiz');

  const registration = await prisma.registration.findFirst({
    where: { userId, courseId: quiz.course.id, status: 'APPROVED' },
    select: { id: true },
  });
  if (!registration) throw notFound('Quiz');

  const now = new Date();
  if (quiz.opensAt && quiz.opensAt > now) throw badRequest('This assessment has not opened yet.');
  if (quiz.closesAt && quiz.closesAt < now) throw badRequest('This assessment has closed.');

  // Resume an attempt that is still within its time limit rather than starting a new one.
  const inProgress = await prisma.quizAttempt.findFirst({
    where: { quizId, userId, status: 'IN_PROGRESS' },
  });
  if (inProgress) {
    const deadline = inProgress.startedAt.getTime() + quiz.durationMins * 60_000;
    if (Date.now() < deadline) return { attempt: inProgress, quiz };
    // Time expired while the student was away — mark it and let them see the result.
    await submitAttempt(userId, inProgress.id, { expired: true });
    throw badRequest('Your previous attempt ran out of time and has been submitted.');
  }

  const used = await prisma.quizAttempt.count({
    where: { quizId, userId, status: { in: ['SUBMITTED', 'GRADED', 'FLAGGED'] } },
  });
  if (used >= quiz.maxAttempts) {
    throw new HttpError(
      409,
      'attempts_exhausted',
      `You have used all ${quiz.maxAttempts} attempt${quiz.maxAttempts === 1 ? '' : 's'} for this assessment.`,
    );
  }

  const pool = quiz.shuffle ? shuffle(quiz.questions.map((q) => q.id)) : quiz.questions.map((q) => q.id);
  const servedOrder = quiz.questionsToServe > 0 ? pool.slice(0, quiz.questionsToServe) : pool;

  const attempt = await prisma.quizAttempt.create({
    data: { quizId, userId, attemptNo: used + 1, servedOrder, status: 'IN_PROGRESS' },
  });

  return { attempt, quiz };
}

/** The question payload safe to hand to the browser: no `isCorrect` anywhere. */
export async function getServedQuestions(attemptId: string, userId: string): Promise<ServedQuestion[]> {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: { quiz: { select: { shuffle: true } } },
  });
  if (!attempt || attempt.userId !== userId) throw notFound('Attempt');

  const questions = await prisma.question.findMany({
    where: { id: { in: attempt.servedOrder } },
    include: { options: { orderBy: { position: 'asc' } } },
  });

  const byId = new Map(questions.map((q) => [q.id, q]));

  return attempt.servedOrder
    .map((id) => byId.get(id))
    .filter((q): q is NonNullable<typeof q> => Boolean(q))
    .map((question) => ({
      id: question.id,
      type: question.type,
      prompt: question.prompt,
      points: question.points,
      options: (attempt.quiz.shuffle ? shuffle([...question.options]) : question.options).map((option) => ({
        id: option.id,
        text: option.text,
      })),
    }));
}

export async function saveAnswer(
  userId: string,
  attemptId: string,
  questionId: string,
  answer: { selected?: string[]; text?: string },
) {
  const attempt = await prisma.quizAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.userId !== userId) throw notFound('Attempt');
  if (attempt.status !== 'IN_PROGRESS') throw badRequest('This attempt has already been submitted.');
  if (!attempt.servedOrder.includes(questionId)) throw badRequest('That question is not part of this attempt.');

  return prisma.answer.upsert({
    where: { attemptId_questionId: { attemptId, questionId } },
    create: { attemptId, questionId, selected: answer.selected ?? [], text: answer.text },
    update: { selected: answer.selected ?? [], text: answer.text },
  });
}

export type MarkedResult = {
  score: number;
  maxScore: number;
  percent: number;
  passed: boolean;
  awaitingManualMarking: boolean;
  breakdown: {
    questionId: string;
    prompt: string;
    points: number;
    awarded: number | null;
    correct: boolean | null;
    explanation: string | null;
  }[];
};

/**
 * Mark and close an attempt.
 *
 * Multiple-select questions are all-or-nothing: partial credit on a "select all that
 * apply" question rewards guessing, since selecting everything would otherwise score.
 */
export async function submitAttempt(
  userId: string,
  attemptId: string,
  options: { expired?: boolean; proctorFlags?: unknown } = {},
): Promise<MarkedResult> {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: { answers: true, quiz: { select: { passMark: true, type: true, courseId: true, title: true } } },
  });
  if (!attempt || attempt.userId !== userId) throw notFound('Attempt');
  if (attempt.status !== 'IN_PROGRESS') throw badRequest('This attempt has already been submitted.');

  const questions = await prisma.question.findMany({
    where: { id: { in: attempt.servedOrder } },
    include: { options: true },
  });

  const answersByQuestion = new Map(attempt.answers.map((a) => [a.questionId, a]));
  let score = 0;
  let maxScore = 0;
  let awaitingManual = false;
  const breakdown: MarkedResult['breakdown'] = [];

  for (const question of questions) {
    maxScore += question.points;
    const answer = answersByQuestion.get(question.id);

    if (question.type === 'ESSAY' || question.type === 'SHORT_ANSWER') {
      awaitingManual = true;
      breakdown.push({
        questionId: question.id,
        prompt: question.prompt,
        points: question.points,
        awarded: null,
        correct: null,
        explanation: question.explanation,
      });
      continue;
    }

    const correctIds = question.options.filter((o) => o.isCorrect).map((o) => o.id).sort();
    const selected = [...(answer?.selected ?? [])].sort();
    const correct =
      correctIds.length > 0 &&
      correctIds.length === selected.length &&
      correctIds.every((id, index) => id === selected[index]);

    const awarded = correct ? question.points : 0;
    score += awarded;

    if (answer) {
      await prisma.answer.update({ where: { id: answer.id }, data: { score: awarded } });
    }

    breakdown.push({
      questionId: question.id,
      prompt: question.prompt,
      points: question.points,
      awarded,
      correct,
      explanation: question.explanation,
    });
  }

  const percent = maxScore === 0 ? 0 : Math.round((score / maxScore) * 100);

  await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: {
      status: awaitingManual ? 'SUBMITTED' : 'GRADED',
      score,
      maxScore,
      submittedAt: new Date(),
      ...(options.proctorFlags ? { proctorFlags: options.proctorFlags as never } : {}),
    },
  });

  await prisma.notification.create({
    data: {
      userId,
      title: options.expired ? 'Attempt auto-submitted' : 'Assessment submitted',
      body: awaitingManual
        ? `${attempt.quiz.title} was submitted. Written answers are marked by your lecturer.`
        : `${attempt.quiz.title}: you scored ${percent}%.`,
      link: '/portal/quizzes',
      category: 'assessment',
    },
  });

  return {
    score,
    maxScore,
    percent,
    passed: percent >= attempt.quiz.passMark,
    awaitingManualMarking: awaitingManual,
    breakdown,
  };
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
