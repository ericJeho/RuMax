import { z } from 'zod';

import { audit, badRequest, created, handleError, notFound, parseBody } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';

const questionSchema = z.object({
  prompt: z.string().min(3).max(2000),
  explanation: z.string().max(2000).optional(),
  options: z
    .array(z.object({ text: z.string().min(1).max(600), isCorrect: z.boolean() }))
    .min(2)
    .max(10),
});

const schema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(3).max(200),
  description: z.string().max(4000).optional(),
  type: z.enum(['PRACTICE', 'QUIZ', 'MIDTERM', 'FINAL_EXAM']).default('QUIZ'),
  durationMins: z.number().int().min(5).max(300).default(30),
  maxAttempts: z.number().int().min(1).max(10).default(1),
  passMark: z.number().int().min(0).max(100).default(50),
  weight: z.number().min(0).max(1).default(0.1),
  questionsToServe: z.number().int().min(0).max(200).default(0),
  shuffle: z.boolean().default(true),
  proctored: z.boolean().default(false),
  lockdownBrowser: z.boolean().default(false),
  published: z.boolean().default(false),
  questions: z.array(questionSchema).min(1).max(200),
});

/**
 * POST /api/quizzes — create an assessment with its question bank.
 *
 * The whole quiz is written in one transaction: a half-created assessment that students
 * can start but not finish is worse than no assessment at all.
 */
export async function POST(request: Request) {
  try {
    const user = await requireRole('LECTURER', 'ADMIN');
    const body = await parseBody(request, schema);

    const course = await prisma.course.findUnique({
      where: { id: body.courseId },
      select: { id: true, code: true, lecturerId: true },
    });
    if (!course) throw notFound('Course');
    if (user.role === 'LECTURER' && course.lecturerId !== user.id) throw notFound('Course');

    for (const [index, question] of body.questions.entries()) {
      if (!question.options.some((option) => option.isCorrect)) {
        throw badRequest(`Question ${index + 1} has no correct answer marked.`);
      }
    }

    if (body.questionsToServe > body.questions.length) {
      throw badRequest(
        `You asked to serve ${body.questionsToServe} questions but the bank only has ${body.questions.length}.`,
      );
    }

    const quiz = await prisma.$transaction(async (tx) => {
      const record = await tx.quiz.create({
        data: {
          courseId: course.id,
          title: body.title.trim(),
          description: body.description?.trim(),
          type: body.type,
          durationMins: body.durationMins,
          maxAttempts: body.maxAttempts,
          passMark: body.passMark,
          weight: body.weight,
          questionsToServe: body.questionsToServe,
          shuffle: body.shuffle,
          proctored: body.proctored,
          lockdownBrowser: body.lockdownBrowser,
          published: body.published,
        },
      });

      for (const [position, question] of body.questions.entries()) {
        await tx.question.create({
          data: {
            quizId: record.id,
            prompt: question.prompt.trim(),
            explanation: question.explanation?.trim(),
            position,
            type: question.options.filter((o) => o.isCorrect).length > 1 ? 'MULTIPLE_SELECT' : 'MULTIPLE_CHOICE',
            options: {
              create: question.options.map((option, optionIndex) => ({
                text: option.text.trim(),
                isCorrect: option.isCorrect,
                position: optionIndex,
              })),
            },
          },
        });
      }

      return record;
    });

    await audit({
      userId: user.id,
      action: 'quiz.create',
      entityType: 'Quiz',
      entityId: quiz.id,
      metadata: { course: course.code, questions: body.questions.length, published: body.published },
    });

    return created({ id: quiz.id, questions: body.questions.length, published: quiz.published });
  } catch (error) {
    return handleError(error);
  }
}
