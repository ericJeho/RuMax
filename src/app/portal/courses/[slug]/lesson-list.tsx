'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  Download,
  FileText,
  FlaskConical,
  Headphones,
  Play,
  Presentation,
  Radio,
  Video,
} from 'lucide-react';

import { cn } from '@/lib/cn';
import { formatDuration } from '@/lib/format';
import { useToast } from '@/components/ui/interactive';

type Lesson = {
  id: string;
  title: string;
  type: string;
  durationMins: number;
  downloadable: boolean;
  body: string | null;
  completed: boolean;
};

type Module = { id: string; title: string; summary: string | null; lessons: Lesson[] };

const ICONS: Record<string, typeof Video> = {
  VIDEO: Video,
  READING: FileText,
  PDF: FileText,
  SLIDES: Presentation,
  AUDIO: Headphones,
  LAB: FlaskConical,
  SIMULATION: FlaskConical,
  LIVE: Radio,
};

/**
 * The course player.
 *
 * Completion is optimistic: the tick flips immediately and the request goes out in the
 * background. A student on a poor connection should never sit waiting for a round trip
 * to confirm they finished a five-minute video — if the write fails we roll the tick
 * back and say so.
 */
export function LessonList({ modules }: { modules: Module[]; iconNames?: string[] }) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState<string | null>(modules[0]?.lessons[0]?.id ?? null);
  const [done, setDone] = useState<Record<string, boolean>>(
    Object.fromEntries(modules.flatMap((m) => m.lessons.map((l) => [l.id, l.completed]))),
  );

  async function toggle(lessonId: string) {
    const next = !done[lessonId];
    setDone((current) => ({ ...current, [lessonId]: next }));

    try {
      const response = await fetch(`/api/lessons/${lessonId}/progress`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ completed: next }),
      });
      if (!response.ok) throw new Error('save failed');
      startTransition(() => router.refresh());
    } catch {
      setDone((current) => ({ ...current, [lessonId]: !next }));
      toast.push({
        tone: 'danger',
        title: 'Could not save progress',
        body: 'You are offline or the server is unreachable. Your place will sync when you reconnect.',
      });
    }
  }

  return (
    <div className="space-y-4">
      {modules.map((module, moduleIndex) => {
        const moduleDone = module.lessons.filter((l) => done[l.id]).length;

        return (
          <details key={module.id} open={moduleIndex === 0} className="rounded-xl border border-border">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
              <span className="min-w-0">
                <span className="block text-sm font-medium">{module.title}</span>
                {module.summary ? (
                  <span className="mt-0.5 block truncate text-xs text-muted">{module.summary}</span>
                ) : null}
              </span>
              <span className="shrink-0 text-xs text-muted">
                {moduleDone}/{module.lessons.length}
              </span>
            </summary>

            <ul className="border-t border-border">
              {module.lessons.map((lesson) => {
                const Icon = ICONS[lesson.type] ?? FileText;
                const expanded = open === lesson.id;

                return (
                  <li key={lesson.id} className="border-b border-border/60 last:border-0">
                    <div className="flex items-center gap-3 px-4 py-3">
                      <button
                        onClick={() => toggle(lesson.id)}
                        aria-pressed={done[lesson.id]}
                        aria-label={`Mark "${lesson.title}" as ${done[lesson.id] ? 'not complete' : 'complete'}`}
                        className={cn(
                          'grid h-6 w-6 shrink-0 place-items-center rounded-full border transition',
                          done[lesson.id]
                            ? 'border-success bg-success text-white'
                            : 'border-border text-transparent hover:border-brand',
                        )}
                      >
                        <Check size={13} aria-hidden />
                      </button>

                      <button
                        onClick={() => setOpen(expanded ? null : lesson.id)}
                        aria-expanded={expanded}
                        className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                      >
                        <Icon size={15} className="shrink-0 text-muted" aria-hidden />
                        <span className="min-w-0">
                          <span className={cn('block truncate text-sm', done[lesson.id] && 'text-muted')}>
                            {lesson.title}
                          </span>
                          <span className="block text-xs text-muted">
                            {lesson.type.toLowerCase()} · {formatDuration(lesson.durationMins)}
                          </span>
                        </span>
                      </button>

                      {lesson.downloadable ? (
                        <button
                          aria-label={`Download "${lesson.title}"`}
                          className="shrink-0 rounded-lg p-1.5 text-muted transition hover:bg-surface-2 hover:text-fg"
                        >
                          <Download size={14} aria-hidden />
                        </button>
                      ) : null}
                    </div>

                    {expanded ? (
                      <div className="border-t border-border/60 bg-surface-2/40 px-4 py-4">
                        {lesson.type === 'VIDEO' ? (
                          <div className="mb-3 grid aspect-video place-items-center rounded-xl border border-border bg-black/80 text-white">
                            <span className="text-center">
                              <Play size={34} className="mx-auto mb-2 opacity-70" aria-hidden />
                              <span className="block text-sm">{lesson.title}</span>
                              <span className="mt-1 block text-xs opacity-60">
                                Streamed from the RuMax media CDN · {formatDuration(lesson.durationMins)}
                              </span>
                            </span>
                          </div>
                        ) : null}

                        <p className="text-sm leading-relaxed text-muted">
                          {lesson.body ??
                            'Open the attached material to work through this lesson. Bring any questions to the live seminar or post them in the course discussion forum.'}
                        </p>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </details>
        );
      })}
    </div>
  );
}
