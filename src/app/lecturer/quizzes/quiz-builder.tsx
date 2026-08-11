'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Sparkles, Trash2 } from 'lucide-react';

import { Badge, Button, Card, CardBody, CardFooter, CardHeader, CardTitle } from '@/components/ui';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/form';
import { useToast } from '@/components/ui/interactive';
import { cn } from '@/lib/cn';

type ExistingQuiz = {
  id: string;
  title: string;
  courseCode: string;
  type: string;
  questions: number;
  attempts: number;
  published: boolean;
  durationMins: number;
  proctored: boolean;
};

type DraftQuestion = {
  prompt: string;
  options: string[];
  correct: number;
  explanation: string;
};

const BLANK_QUESTION: DraftQuestion = { prompt: '', options: ['', '', '', ''], correct: 0, explanation: '' };

export function QuizBuilder({
  courses,
  existing,
}: {
  courses: { id: string; label: string }[];
  existing: ExistingQuiz[];
}) {
  const router = useRouter();
  const toast = useToast();

  const [meta, setMeta] = useState({
    courseId: courses[0]?.id ?? '',
    title: '',
    description: '',
    type: 'QUIZ',
    durationMins: 30,
    maxAttempts: 2,
    passMark: 50,
    weight: 10,
    questionsToServe: 0,
    shuffle: true,
    proctored: false,
    lockdownBrowser: false,
    published: false,
  });

  const [questions, setQuestions] = useState<DraftQuestion[]>([{ ...BLANK_QUESTION }]);
  const [pending, setPending] = useState(false);
  const [generating, setGenerating] = useState(false);

  function updateQuestion(index: number, patch: Partial<DraftQuestion>) {
    setQuestions((current) => current.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }

  async function generate() {
    if (!meta.title.trim()) {
      toast.push({ tone: 'danger', title: 'Give the quiz a title first', body: 'The topic comes from the title.' });
      return;
    }
    setGenerating(true);
    try {
      const response = await fetch('/api/ai/quiz-questions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ topic: meta.title, count: 5, courseId: meta.courseId }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.push({ tone: 'danger', title: 'Could not generate', body: data?.error?.message });
        return;
      }
      toast.push({
        tone: 'info',
        title: 'Draft questions ready',
        body: 'Review every one before publishing — generated questions are a starting point, not a question bank.',
      });
      // The draft arrives as prose; the lecturer pastes what they want to keep. Parsing it
      // into fields automatically has proved to silently mangle options in testing.
      setMeta((current) => ({ ...current, description: `${current.description}\n\n${data.text}`.trim() }));
    } catch {
      toast.push({ tone: 'danger', title: 'Offline' });
    } finally {
      setGenerating(false);
    }
  }

  async function save() {
    setPending(true);
    try {
      const response = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...meta,
          weight: meta.weight / 100,
          questions: questions
            .filter((q) => q.prompt.trim() && q.options.filter(Boolean).length >= 2)
            .map((q) => ({
              prompt: q.prompt,
              explanation: q.explanation || undefined,
              options: q.options
                .map((text, index) => ({ text, isCorrect: index === q.correct }))
                .filter((option) => option.text.trim()),
            })),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.push({ tone: 'danger', title: 'Not saved', body: data?.error?.message ?? 'Try again.' });
        return;
      }

      toast.push({
        tone: 'success',
        title: 'Quiz created',
        body: `${data.questions} questions saved${meta.published ? ' and published' : ' as a draft'}.`,
      });
      setQuestions([{ ...BLANK_QUESTION }]);
      setMeta((current) => ({ ...current, title: '', description: '' }));
      router.refresh();
    } catch {
      toast.push({ tone: 'danger', title: 'Offline', body: 'Could not reach the server.' });
    } finally {
      setPending(false);
    }
  }

  const validQuestions = questions.filter(
    (q) => q.prompt.trim() && q.options.filter((o) => o.trim()).length >= 2,
  ).length;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle as="h2">Questions ({validQuestions} valid)</CardTitle>
            <Button variant="ghost" size="sm" onClick={generate} disabled={generating}>
              {generating ? (
                <Loader2 size={13} className="animate-spin" aria-hidden />
              ) : (
                <Sparkles size={13} aria-hidden />
              )}
              AI suggestions
            </Button>
          </CardHeader>

          <CardBody className="space-y-5">
            {questions.map((question, index) => (
              <fieldset key={index} className="rounded-xl border border-border p-4">
                <legend className="flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted">
                  Question {index + 1}
                  {questions.length > 1 ? (
                    <button
                      onClick={() => setQuestions((c) => c.filter((_, i) => i !== index))}
                      aria-label={`Remove question ${index + 1}`}
                      className="text-danger hover:underline"
                    >
                      <Trash2 size={12} aria-hidden />
                    </button>
                  ) : null}
                </legend>

                <Field label="Prompt" htmlFor={`prompt-${index}`} required>
                  <Textarea
                    id={`prompt-${index}`}
                    rows={2}
                    value={question.prompt}
                    onChange={(event) => updateQuestion(index, { prompt: event.target.value })}
                    placeholder="What are you asking?"
                  />
                </Field>

                <p className="label">Options — select the correct one</p>
                <div className="mb-4 space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <label
                      key={optionIndex}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border p-2 transition',
                        question.correct === optionIndex ? 'border-success bg-success/5' : 'border-border',
                      )}
                    >
                      <input
                        type="radio"
                        name={`correct-${index}`}
                        checked={question.correct === optionIndex}
                        onChange={() => updateQuestion(index, { correct: optionIndex })}
                        className="h-4 w-4 shrink-0 border-border text-success"
                        aria-label={`Mark option ${optionIndex + 1} as correct`}
                      />
                      <Input
                        value={option}
                        onChange={(event) =>
                          updateQuestion(index, {
                            options: question.options.map((o, i) => (i === optionIndex ? event.target.value : o)),
                          })
                        }
                        placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                        className="border-0 bg-transparent px-1 py-1 focus:ring-0"
                      />
                    </label>
                  ))}
                </div>

                <Field
                  label="Explanation"
                  htmlFor={`explanation-${index}`}
                  hint="Shown to students after they submit. This is where most of the learning happens."
                >
                  <Input
                    id={`explanation-${index}`}
                    value={question.explanation}
                    onChange={(event) => updateQuestion(index, { explanation: event.target.value })}
                  />
                </Field>
              </fieldset>
            ))}

            <Button
              variant="secondary"
              onClick={() => setQuestions((current) => [...current, { ...BLANK_QUESTION }])}
            >
              <Plus size={15} aria-hidden />
              Add question
            </Button>
          </CardBody>
        </Card>

        {existing.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle as="h2">Existing assessments</CardTitle>
            </CardHeader>
            <CardBody className="space-y-2">
              {existing.map((quiz) => (
                <div
                  key={quiz.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{quiz.title}</p>
                    <p className="text-xs text-muted">
                      {quiz.courseCode} · {quiz.questions} questions · {quiz.attempts} attempts ·{' '}
                      {quiz.durationMins} min
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    {quiz.proctored ? <Badge tone="warning">Proctored</Badge> : null}
                    <Badge tone={quiz.published ? 'success' : 'neutral'}>
                      {quiz.published ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        ) : null}
      </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle as="h2">Settings</CardTitle>
        </CardHeader>
        <CardBody>
          <Field label="Course" htmlFor="course" required>
            <Select
              id="course"
              value={meta.courseId}
              onChange={(event) => setMeta({ ...meta, courseId: event.target.value })}
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Title" htmlFor="title" required>
            <Input
              id="title"
              value={meta.title}
              onChange={(event) => setMeta({ ...meta, title: event.target.value })}
              placeholder="Unit 1–2 quiz"
            />
          </Field>

          <Field label="Description" htmlFor="description">
            <Textarea
              id="description"
              rows={3}
              value={meta.description}
              onChange={(event) => setMeta({ ...meta, description: event.target.value })}
            />
          </Field>

          <div className="grid gap-x-4 sm:grid-cols-2">
            <Field label="Type" htmlFor="type">
              <Select
                id="type"
                value={meta.type}
                onChange={(event) => setMeta({ ...meta, type: event.target.value })}
              >
                <option value="PRACTICE">Practice (ungraded)</option>
                <option value="QUIZ">Quiz</option>
                <option value="MIDTERM">Mid-term</option>
                <option value="FINAL_EXAM">Final examination</option>
              </Select>
            </Field>

            <Field label="Duration (minutes)" htmlFor="duration">
              <Input
                id="duration"
                type="number"
                min={5}
                max={300}
                value={meta.durationMins}
                onChange={(event) => setMeta({ ...meta, durationMins: Number(event.target.value) })}
              />
            </Field>

            <Field label="Attempts allowed" htmlFor="attempts">
              <Input
                id="attempts"
                type="number"
                min={1}
                max={10}
                value={meta.maxAttempts}
                onChange={(event) => setMeta({ ...meta, maxAttempts: Number(event.target.value) })}
              />
            </Field>

            <Field label="Pass mark (%)" htmlFor="passmark">
              <Input
                id="passmark"
                type="number"
                min={0}
                max={100}
                value={meta.passMark}
                onChange={(event) => setMeta({ ...meta, passMark: Number(event.target.value) })}
              />
            </Field>

            <Field label="Weight (% of course)" htmlFor="weight">
              <Input
                id="weight"
                type="number"
                min={0}
                max={100}
                value={meta.weight}
                onChange={(event) => setMeta({ ...meta, weight: Number(event.target.value) })}
              />
            </Field>

            <Field
              label="Questions served"
              htmlFor="serve"
              hint="0 serves every question in the bank."
            >
              <Input
                id="serve"
                type="number"
                min={0}
                max={100}
                value={meta.questionsToServe}
                onChange={(event) => setMeta({ ...meta, questionsToServe: Number(event.target.value) })}
              />
            </Field>
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <Checkbox
              label="Shuffle questions and options"
              description="Different order per candidate, fixed once an attempt starts."
              checked={meta.shuffle}
              onChange={(event) => setMeta({ ...meta, shuffle: event.target.checked })}
            />
            <Checkbox
              label="Proctored"
              description="Camera monitoring and tab-switch recording."
              checked={meta.proctored}
              onChange={(event) => setMeta({ ...meta, proctored: event.target.checked })}
            />
            <Checkbox
              label="Lockdown browser"
              description="Disables copy, paste and the context menu."
              checked={meta.lockdownBrowser}
              onChange={(event) => setMeta({ ...meta, lockdownBrowser: event.target.checked })}
            />
            <Checkbox
              label="Publish immediately"
              description="Leave off to save as a draft students cannot see."
              checked={meta.published}
              onChange={(event) => setMeta({ ...meta, published: event.target.checked })}
            />
          </div>
        </CardBody>

        <CardFooter>
          <Button
            className="w-full"
            onClick={save}
            disabled={pending || !meta.title.trim() || validQuestions === 0}
          >
            {pending ? <Loader2 size={15} className="animate-spin" aria-hidden /> : null}
            Save quiz ({validQuestions} question{validQuestions === 1 ? '' : 's'})
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
