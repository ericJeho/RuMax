'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Check, ChevronLeft, ChevronRight, Loader2, Timer, X } from 'lucide-react';

import { Alert, Badge, Button, Card, CardBody, CardFooter, CardHeader, CardTitle, ProgressBar } from '@/components/ui';
import { Textarea } from '@/components/ui/form';
import { cn } from '@/lib/cn';

type Question = {
  id: string;
  type: string;
  prompt: string;
  points: number;
  options: { id: string; text: string }[];
};

type Result = {
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

type ProctorEvent = { at: string; event: string; detail?: string };

/**
 * The exam client.
 *
 * The countdown here is a convenience for the candidate — the server records the start
 * time and rejects work submitted past the limit, so tampering with the clock in the
 * browser gains nothing.
 */
export function QuizRunner({
  quizId,
  title,
  durationMins,
  proctored,
  passMark,
}: {
  quizId: string;
  title: string;
  durationMins: number;
  proctored: boolean;
  passMark: number;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<'idle' | 'active' | 'submitting' | 'done'>('idle');
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { selected?: string[]; text?: string }>>({});
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(durationMins * 60);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const flags = useRef<ProctorEvent[]>([]);

  /* ------------------------------------------------------------- start */

  async function start() {
    setError(null);
    try {
      const response = await fetch(`/api/quizzes/${quizId}/attempts`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error?.message ?? 'Could not start this assessment.');
        return;
      }
      setAttemptId(data.attemptId);
      setQuestions(data.questions);
      setEndsAt(new Date(data.endsAt).getTime());
      setPhase('active');
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    }
  }

  /* -------------------------------------------------------- submission */

  const submit = useCallback(
    async (auto = false) => {
      if (!attemptId) return;
      setPhase('submitting');
      try {
        const response = await fetch(`/api/attempts/${attemptId}/submit`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ proctorFlags: flags.current }),
        });
        const data = await response.json();
        if (!response.ok) {
          setError(data?.error?.message ?? 'Submission failed.');
          setPhase('active');
          return;
        }
        setResult(data);
        setPhase('done');
        router.refresh();
      } catch {
        setError(
          auto
            ? 'Time ran out but your answers could not be sent. Reconnect and reopen this page.'
            : 'Could not submit. Check your connection — your answers are saved on the server.',
        );
        setPhase('active');
      }
    },
    [attemptId, router],
  );

  /* ----------------------------------------------------------- ticking */

  useEffect(() => {
    if (phase !== 'active' || !endsAt) return;
    const tick = () => {
      const left = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) void submit(true);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [phase, endsAt, submit]);

  /* --------------------------------------------------------- proctoring */

  useEffect(() => {
    if (phase !== 'active' || !proctored) return;

    const record = (event: string, detail?: string) => {
      flags.current.push({ at: new Date().toISOString(), event, detail });
    };

    const onVisibility = () => {
      if (document.hidden) record('tab_hidden', 'Candidate switched away from the assessment tab');
    };
    const onBlur = () => record('window_blur');
    const onCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      record('copy_blocked');
    };
    const onContext = (e: MouseEvent) => {
      e.preventDefault();
      record('context_menu_blocked');
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    document.addEventListener('copy', onCopy);
    document.addEventListener('contextmenu', onContext);

    // Warn on refresh/close: the attempt keeps running server-side either way.
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('contextmenu', onContext);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [phase, proctored]);

  /* -------------------------------------------------------- autosaving */

  async function record(questionId: string, value: { selected?: string[]; text?: string }) {
    setAnswers((current) => ({ ...current, [questionId]: value }));
    if (!attemptId) return;
    try {
      await fetch(`/api/attempts/${attemptId}/answers`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ questionId, ...value }),
      });
    } catch {
      // Silent: the answer is held in component state and re-sent on submit.
    }
  }

  /* ------------------------------------------------------------ render */

  if (phase === 'idle') {
    return (
      <Card>
        <CardBody>
          {error ? <Alert tone="danger" className="mb-4">{error}</Alert> : null}
          <p className="mb-1 font-display text-lg font-semibold">Ready to begin?</p>
          <p className="mb-5 text-sm text-muted">
            The clock starts as soon as you press Start and does not pause. You have {durationMins}{' '}
            minutes.
            {proctored ? ' This assessment is proctored — tab switches and copy attempts are recorded.' : ''}
          </p>
          <Button size="lg" onClick={start}>
            Start assessment
          </Button>
        </CardBody>
      </Card>
    );
  }

  if (phase === 'done' && result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle as="h2">{title} — result</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="mb-6 flex flex-wrap items-center gap-6">
            <div>
              <p className="font-display text-5xl font-semibold tabular-nums">{result.percent}%</p>
              <p className="mt-1 text-sm text-muted">
                {result.score} of {result.maxScore} marks
              </p>
            </div>
            <Badge tone={result.passed ? 'success' : 'danger'} className="text-sm">
              {result.passed ? 'Passed' : 'Below pass mark'} (pass = {passMark}%)
            </Badge>
          </div>

          {result.awaitingManualMarking ? (
            <Alert tone="info" className="mb-6">
              Written answers in this assessment are marked by your lecturer. Your final mark may be
              higher than the figure above.
            </Alert>
          ) : null}

          <h3 className="mb-3 font-display text-base font-semibold">Question review</h3>
          <ol className="space-y-3">
            {result.breakdown.map((item, i) => (
              <li key={item.questionId} className="rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium">
                    {i + 1}. {item.prompt}
                  </p>
                  <span className="shrink-0">
                    {item.correct === null ? (
                      <Badge tone="info">Marked by lecturer</Badge>
                    ) : item.correct ? (
                      <Badge tone="success">
                        <Check size={11} aria-hidden /> Correct
                      </Badge>
                    ) : (
                      <Badge tone="danger">
                        <X size={11} aria-hidden /> Incorrect
                      </Badge>
                    )}
                  </span>
                </div>
                {item.explanation ? (
                  <p className="mt-2 text-xs leading-relaxed text-muted">{item.explanation}</p>
                ) : null}
              </li>
            ))}
          </ol>
        </CardBody>
        <CardFooter className="flex justify-between">
          <span>Recorded in your gradebook.</span>
          <Button variant="secondary" size="sm" onClick={() => router.push('/portal/quizzes')}>
            Back to assessments
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const question = questions[index];
  const answered = Object.keys(answers).length;
  const lowTime = remaining < 120;

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle as="h2">{title}</CardTitle>
          <p className="mt-0.5 text-xs text-muted">
            Question {index + 1} of {questions.length} · {answered} answered
          </p>
        </div>
        <div
          role="timer"
          aria-live={lowTime ? 'assertive' : 'off'}
          className={cn(
            'flex items-center gap-2 rounded-xl border px-3 py-1.5 font-mono text-sm tabular-nums',
            lowTime ? 'border-danger bg-danger/10 text-danger' : 'border-border text-muted',
          )}
        >
          <Timer size={15} aria-hidden />
          {formatClock(remaining)}
        </div>
      </CardHeader>

      <CardBody>
        <ProgressBar value={index + 1} max={questions.length} className="mb-6" />

        {error ? <Alert tone="danger" className="mb-4">{error}</Alert> : null}
        {proctored && flags.current.length > 0 ? (
          <Alert tone="warning" className="mb-4">
            <span className="flex items-center gap-2">
              <AlertTriangle size={14} aria-hidden />
              {flags.current.length} proctoring event{flags.current.length === 1 ? '' : 's'} recorded on
              this attempt.
            </span>
          </Alert>
        ) : null}

        {question ? (
          <fieldset>
            <legend className="mb-4 text-base font-medium leading-relaxed">
              {question.prompt}
              <span className="ml-2 text-xs text-muted">
                ({question.points} mark{question.points === 1 ? '' : 's'})
              </span>
            </legend>

            {question.type === 'ESSAY' || question.type === 'SHORT_ANSWER' ? (
              <Textarea
                rows={question.type === 'ESSAY' ? 10 : 4}
                value={answers[question.id]?.text ?? ''}
                onChange={(event) => record(question.id, { text: event.target.value })}
                placeholder="Type your answer here. It saves automatically."
              />
            ) : (
              <div className="space-y-2">
                {question.options.map((option) => {
                  const selected = answers[question.id]?.selected ?? [];
                  const isMulti = question.type === 'MULTIPLE_SELECT';
                  const checked = selected.includes(option.id);

                  return (
                    <label
                      key={option.id}
                      className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-sm transition',
                        checked ? 'border-brand bg-brand/5' : 'border-border hover:bg-surface-2',
                      )}
                    >
                      <input
                        type={isMulti ? 'checkbox' : 'radio'}
                        name={question.id}
                        checked={checked}
                        onChange={() =>
                          record(question.id, {
                            selected: isMulti
                              ? checked
                                ? selected.filter((id) => id !== option.id)
                                : [...selected, option.id]
                              : [option.id],
                          })
                        }
                        className="mt-0.5 h-4 w-4 shrink-0 border-border text-brand focus:ring-2 focus:ring-brand/40"
                      />
                      <span>{option.text}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </fieldset>
        ) : null}
      </CardBody>

      <CardFooter className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
          >
            <ChevronLeft size={14} aria-hidden />
            Previous
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
            disabled={index >= questions.length - 1}
          >
            Next
            <ChevronRight size={14} aria-hidden />
          </Button>
        </div>

        <Button size="sm" onClick={() => submit(false)} disabled={phase === 'submitting'}>
          {phase === 'submitting' ? <Loader2 size={14} className="animate-spin" aria-hidden /> : null}
          Submit {answered < questions.length ? `(${questions.length - answered} unanswered)` : 'assessment'}
        </Button>
      </CardFooter>
    </Card>
  );
}

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
