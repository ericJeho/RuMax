'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Check, Loader2 } from 'lucide-react';

import { Alert, Badge, Button, Card, CardBody, CardFooter, CardHeader, CardTitle } from '@/components/ui';
import { useToast } from '@/components/ui/interactive';
import { cn } from '@/lib/cn';
import { MAX_CREDITS_PER_TERM, validateRegistrationLoad } from '@/lib/grading';

type CourseOption = {
  id: string;
  code: string;
  title: string;
  credits: number;
  year: number;
  semester: number;
  isCore: boolean;
  lecturer: string | null;
  prerequisites: string[];
  missingPrerequisites: string[];
  alreadyPassed: boolean;
  alreadyRegistered: boolean;
};

export function RegistrationForm({
  courses,
  termName,
  disabled,
}: {
  courses: CourseOption[];
  termName: string;
  disabled: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, setPending] = useState(false);

  const credits = useMemo(
    () => courses.filter((c) => selected.includes(c.id)).reduce((sum, c) => sum + c.credits, 0),
    [courses, selected],
  );

  const loadError = validateRegistrationLoad(credits);

  function toggle(course: CourseOption) {
    if (course.alreadyRegistered || course.alreadyPassed || course.missingPrerequisites.length > 0) return;
    setSelected((current) =>
      current.includes(course.id) ? current.filter((id) => id !== course.id) : [...current, course.id],
    );
  }

  async function submit() {
    setPending(true);
    try {
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ courseIds: selected }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.push({
          tone: 'danger',
          title: 'Registration failed',
          body: data?.error?.message ?? 'Please review your selection and try again.',
        });
        return;
      }

      toast.push({
        tone: 'success',
        title: 'Registration submitted',
        body: `${data.created} course${data.created === 1 ? '' : 's'} sent to the registrar for approval.`,
      });
      setSelected([]);
      router.refresh();
    } catch {
      toast.push({ tone: 'danger', title: 'Offline', body: 'Could not reach the server.' });
    } finally {
      setPending(false);
    }
  }

  const byYear = new Map<number, CourseOption[]>();
  for (const course of courses) {
    byYear.set(course.year, [...(byYear.get(course.year) ?? []), course]);
  }

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <CardTitle as="h2">Available courses — {termName}</CardTitle>
        <Badge tone={loadError ? 'danger' : credits > 0 ? 'brand' : 'neutral'}>
          {credits} / {MAX_CREDITS_PER_TERM} credits selected
        </Badge>
      </CardHeader>

      <CardBody className="space-y-6">
        {loadError ? <Alert tone="warning">{loadError}</Alert> : null}

        {[...byYear.entries()]
          .sort(([a], [b]) => a - b)
          .map(([year, list]) => (
            <section key={year}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
                Year {year}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {list.map((course) => {
                  const blocked = course.missingPrerequisites.length > 0;
                  const done = course.alreadyPassed;
                  const registered = course.alreadyRegistered;
                  const active = selected.includes(course.id);

                  return (
                    <button
                      key={course.id}
                      type="button"
                      onClick={() => toggle(course)}
                      disabled={disabled || blocked || done || registered}
                      aria-pressed={active}
                      className={cn(
                        'rounded-xl border p-4 text-left transition',
                        active && 'border-brand bg-brand/5',
                        !active && !blocked && !done && !registered && 'border-border hover:border-brand/50 hover:bg-surface-2',
                        (blocked || done || registered) && 'border-border bg-surface-2/50 opacity-70',
                        !disabled && !blocked && !done && !registered && 'cursor-pointer',
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-xs text-muted">{course.code}</span>
                        <span className="flex shrink-0 gap-1">
                          {course.isCore ? <Badge tone="brand">Core</Badge> : <Badge>Elective</Badge>}
                          {active ? (
                            <span className="grid h-5 w-5 place-items-center rounded-full bg-brand text-brand-fg">
                              <Check size={11} aria-hidden />
                            </span>
                          ) : null}
                        </span>
                      </div>

                      <p className="mt-1 text-sm font-medium leading-snug">{course.title}</p>
                      <p className="mt-1 text-xs text-muted">
                        {course.credits} credits
                        {course.lecturer ? ` · ${course.lecturer}` : ''}
                      </p>

                      {done ? (
                        <p className="mt-2 text-xs font-medium text-success">Already passed</p>
                      ) : registered ? (
                        <p className="mt-2 text-xs font-medium text-info">Already registered this term</p>
                      ) : blocked ? (
                        <p className="mt-2 flex items-start gap-1.5 text-xs font-medium text-danger">
                          <AlertCircle size={12} className="mt-0.5 shrink-0" aria-hidden />
                          Requires {course.missingPrerequisites.join(', ')} first
                        </p>
                      ) : course.prerequisites.length > 0 ? (
                        <p className="mt-2 text-xs text-muted">
                          Prerequisites met: {course.prerequisites.join(', ')}
                        </p>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
      </CardBody>

      <CardFooter className="flex flex-wrap items-center justify-between gap-3">
        <span>
          {selected.length} course{selected.length === 1 ? '' : 's'} selected · {credits} credits
        </span>
        <Button onClick={submit} disabled={disabled || pending || selected.length === 0 || Boolean(loadError)}>
          {pending ? <Loader2 size={15} className="animate-spin" aria-hidden /> : null}
          Submit registration
        </Button>
      </CardFooter>
    </Card>
  );
}
