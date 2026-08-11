'use client';

import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Button, Card, CardBody, CardFooter, CardHeader, CardTitle } from '@/components/ui';
import { Field, Input, Select } from '@/components/ui/form';
import { useToast } from '@/components/ui/interactive';
import { cn } from '@/lib/cn';

type Course = {
  id: string;
  label: string;
  students: { id: string; name: string; studentNumber: string | null }[];
};

const STATUSES = ['PRESENT', 'LATE', 'EXCUSED', 'ABSENT'] as const;
type Status = (typeof STATUSES)[number];

const TONES: Record<Status, string> = {
  PRESENT: 'border-success bg-success/10 text-success',
  LATE: 'border-warning bg-warning/10 text-warning',
  EXCUSED: 'border-info bg-info/10 text-info',
  ABSENT: 'border-danger bg-danger/10 text-danger',
};

export function AttendanceRegister({ courses }: { courses: Course[] }) {
  const toast = useToast();
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [marks, setMarks] = useState<Record<string, Status>>({});
  const [pending, setPending] = useState(false);

  const course = courses.find((c) => c.id === courseId);

  const counts = useMemo(() => {
    const summary: Record<Status, number> = { PRESENT: 0, LATE: 0, EXCUSED: 0, ABSENT: 0 };
    for (const student of course?.students ?? []) {
      summary[marks[student.id] ?? 'PRESENT'] += 1;
    }
    return summary;
  }, [course, marks]);

  async function save() {
    if (!course) return;
    setPending(true);
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          courseId,
          date,
          records: course.students.map((student) => ({
            userId: student.id,
            status: marks[student.id] ?? 'PRESENT',
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
        title: 'Register saved',
        body: `${data.recorded} students recorded for ${date}.`,
      });
    } catch {
      toast.push({ tone: 'danger', title: 'Offline', body: 'Could not reach the server.' });
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Take the register</CardTitle>
      </CardHeader>

      <CardBody>
        <div className="mb-6 grid gap-x-4 sm:grid-cols-2">
          <Field label="Course" htmlFor="course" required>
            <Select id="course" value={courseId} onChange={(event) => setCourseId(event.target.value)}>
              {courses.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Session date" htmlFor="date" required>
            <Input id="date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </Field>
        </div>

        <p className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          {STATUSES.map((status) => (
            <span key={status}>
              {status.toLowerCase()}: <strong className="text-fg">{counts[status]}</strong>
            </span>
          ))}
        </p>

        <ul className="divide-y divide-border rounded-xl border border-border">
          {course?.students.map((student) => {
            const current = marks[student.id] ?? 'PRESENT';
            return (
              <li key={student.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{student.name}</span>
                  <span className="block font-mono text-xs text-muted">{student.studentNumber}</span>
                </span>

                <div
                  role="radiogroup"
                  aria-label={`Attendance for ${student.name}`}
                  className="flex flex-wrap gap-1.5"
                >
                  {STATUSES.map((status) => (
                    <button
                      key={status}
                      role="radio"
                      aria-checked={current === status}
                      onClick={() => setMarks((c) => ({ ...c, [student.id]: status }))}
                      className={cn(
                        'rounded-lg border px-2.5 py-1 text-xs font-medium capitalize transition',
                        current === status ? TONES[status] : 'border-border text-muted hover:bg-surface-2',
                      )}
                    >
                      {status.toLowerCase()}
                    </button>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      </CardBody>

      <CardFooter className="flex items-center justify-between">
        <span>{course?.students.length ?? 0} students on this register</span>
        <Button onClick={save} disabled={pending || !course}>
          {pending ? <Loader2 size={15} className="animate-spin" aria-hidden /> : null}
          Save register
        </Button>
      </CardFooter>
    </Card>
  );
}
