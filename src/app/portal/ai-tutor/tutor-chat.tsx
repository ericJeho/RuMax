'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Bot, Loader2, Send, Sparkles, User } from 'lucide-react';

import { Alert, Badge, Button, Card, CardBody, CardFooter, CardHeader, CardTitle } from '@/components/ui';
import { Select, Textarea } from '@/components/ui/form';
import { cn } from '@/lib/cn';

type Message = { role: 'user' | 'assistant'; content: string; source?: 'claude' | 'offline' };

const PERSONAS = [
  { value: 'tutor', label: 'Tutor — explain a concept' },
  { value: 'advisor', label: 'Advisor — course and degree planning' },
  { value: 'writing', label: 'Writing assistant — improve my draft' },
  { value: 'research', label: 'Research assistant — literature and method' },
  { value: 'career', label: 'Career advisor — CV and interviews' },
];

const STARTERS = [
  'Explain time complexity as if I have never seen it before.',
  'I have an exam in two weeks. Help me build a revision plan.',
  'Why did I get this wrong: I said normalisation speeds up queries.',
  'What should I read before starting my dissertation proposal?',
];

export function TutorChat({
  courses,
  live,
  studentName,
}: {
  courses: { id: string; label: string }[];
  live: boolean;
  studentName: string;
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello ${studentName}. Tell me what you are working on and where it stops making sense — I will take it from there. I explain and I ask questions back; I will not write assessed work for you.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [persona, setPersona] = useState('tutor');
  const [courseId, setCourseId] = useState('');
  const [pending, setPending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  async function send(event?: FormEvent, preset?: string) {
    event?.preventDefault();
    const content = (preset ?? input).trim();
    if (!content || pending) return;

    const next: Message[] = [...messages, { role: 'user', content }];
    setMessages(next);
    setInput('');
    setPending(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          persona,
          courseId: courseId || undefined,
          messages: next.map(({ role, content: text }) => ({ role, content: text })),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessages((current) => [
          ...current,
          {
            role: 'assistant',
            content: data?.error?.message ?? 'I could not answer that just now. Try again in a moment.',
          },
        ]);
        return;
      }

      setMessages((current) => [
        ...current,
        { role: 'assistant', content: data.text, source: data.source },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: 'I lost the connection. Your question is still in the box above — send it again when you are back online.',
        },
      ]);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
      <Card className="flex h-[calc(100dvh-16rem)] min-h-[32rem] flex-col">
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle as="h2">
            <span className="flex items-center gap-2">
              <Sparkles size={16} className="text-brand" aria-hidden />
              Conversation
            </span>
          </CardTitle>
          <Badge tone={live ? 'success' : 'warning'}>{live ? 'Live model' : 'Offline mode'}</Badge>
        </CardHeader>

        <CardBody className="flex-1 space-y-4 overflow-y-auto" aria-live="polite">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn('flex gap-3', message.role === 'user' && 'flex-row-reverse')}
            >
              <span
                className={cn(
                  'grid h-8 w-8 shrink-0 place-items-center rounded-full',
                  message.role === 'user' ? 'bg-surface-2 text-muted' : 'bg-brand-gradient text-white',
                )}
              >
                {message.role === 'user' ? <User size={15} aria-hidden /> : <Bot size={15} aria-hidden />}
              </span>
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                  message.role === 'user'
                    ? 'bg-brand text-brand-fg'
                    : 'border border-border bg-surface-2/60 text-fg',
                )}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.source === 'offline' ? (
                  <p className="mt-2 border-t border-border/60 pt-2 text-[11px] text-muted">
                    Offline responder — no AI key configured on this deployment.
                  </p>
                ) : null}
              </div>
            </div>
          ))}

          {pending ? (
            <div className="flex gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-gradient text-white">
                <Bot size={15} aria-hidden />
              </span>
              <div className="rounded-2xl border border-border bg-surface-2/60 px-4 py-3">
                <Loader2 size={15} className="animate-spin text-muted" aria-hidden />
                <span className="sr-only">Thinking</span>
              </div>
            </div>
          ) : null}

          <div ref={endRef} />
        </CardBody>

        <CardFooter>
          <form onSubmit={send} className="flex w-full gap-2">
            <label htmlFor="tutor-input" className="sr-only">
              Your question
            </label>
            <Textarea
              id="tutor-input"
              rows={2}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void send();
                }
              }}
              placeholder="Ask a question. Enter to send, Shift+Enter for a new line."
              className="min-h-0 resize-none"
            />
            <Button type="submit" disabled={pending || !input.trim()} className="shrink-0 self-end">
              <Send size={15} aria-hidden />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </CardFooter>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle as="h2">Mode</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <label htmlFor="persona" className="label">
                What kind of help?
              </label>
              <Select id="persona" value={persona} onChange={(event) => setPersona(event.target.value)}>
                {PERSONAS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            {courses.length > 0 ? (
              <div>
                <label htmlFor="course" className="label">
                  Course context (optional)
                </label>
                <Select id="course" value={courseId} onChange={(event) => setCourseId(event.target.value)}>
                  <option value="">No specific course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.label}
                    </option>
                  ))}
                </Select>
                <p className="hint">
                  Giving a course lets the tutor use your syllabus and unit titles in its answer.
                </p>
              </div>
            ) : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h2">Try asking</CardTitle>
          </CardHeader>
          <CardBody className="space-y-2">
            {STARTERS.map((starter) => (
              <button
                key={starter}
                onClick={() => void send(undefined, starter)}
                disabled={pending}
                className="w-full rounded-xl border border-border p-3 text-left text-sm text-muted transition hover:border-brand/50 hover:text-fg"
              >
                {starter}
              </button>
            ))}
          </CardBody>
        </Card>

        <Alert tone="info" title="Academic integrity">
          Conversations are stored against your account. Using AI to produce work you submit as your
          own is a disciplinary offence — using it to understand material is exactly what it is for.
        </Alert>
      </div>
    </div>
  );
}
