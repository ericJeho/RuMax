'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { Button, Card, CardBody, CardFooter, CardHeader, CardTitle } from '@/components/ui';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/form';
import { useToast } from '@/components/ui/interactive';

export function AssignmentComposer({ courses }: { courses: { id: string; label: string }[] }) {
  const router = useRouter();
  const toast = useToast();

  // Computed inside the initialiser rather than in the component body: reading the clock
  // during render makes the render impure, and the default only needs to be decided once.
  const [form, setForm] = useState(() => ({
    courseId: courses[0]?.id ?? '',
    title: '',
    instructions: '',
    maxScore: 100,
    weight: 15,
    dueAt: new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 16),
    allowLate: true,
    published: true,
  }));
  const [pending, setPending] = useState(false);

  async function create() {
    setPending(true);
    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...form,
          weight: form.weight / 100,
          dueAt: new Date(form.dueAt).toISOString(),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.push({ tone: 'danger', title: 'Not created', body: data?.error?.message ?? 'Try again.' });
        return;
      }

      toast.push({
        tone: 'success',
        title: 'Assignment created',
        body: form.published ? `${data.notified} students notified.` : 'Saved as a draft.',
      });
      setForm({ ...form, title: '', instructions: '' });
      router.refresh();
    } catch {
      toast.push({ tone: 'danger', title: 'Offline', body: 'Could not reach the server.' });
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle as="h2">New assignment</CardTitle>
      </CardHeader>
      <CardBody>
        <Field label="Course" htmlFor="a-course" required>
          <Select
            id="a-course"
            value={form.courseId}
            onChange={(event) => setForm({ ...form, courseId: event.target.value })}
          >
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Title" htmlFor="a-title" required>
          <Input
            id="a-title"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            placeholder="Applied case study"
          />
        </Field>

        <Field
          label="Brief"
          htmlFor="a-instructions"
          required
          hint="State the task, the length, and how it will be marked. Ambiguity here becomes 40 emails later."
        >
          <Textarea
            id="a-instructions"
            rows={6}
            value={form.instructions}
            onChange={(event) => setForm({ ...form, instructions: event.target.value })}
          />
        </Field>

        <div className="grid gap-x-4 sm:grid-cols-2">
          <Field label="Maximum marks" htmlFor="a-max" required>
            <Input
              id="a-max"
              type="number"
              min={1}
              max={1000}
              value={form.maxScore}
              onChange={(event) => setForm({ ...form, maxScore: Number(event.target.value) })}
            />
          </Field>
          <Field label="Weight (% of course)" htmlFor="a-weight" required>
            <Input
              id="a-weight"
              type="number"
              min={0}
              max={100}
              value={form.weight}
              onChange={(event) => setForm({ ...form, weight: Number(event.target.value) })}
            />
          </Field>
        </div>

        <Field label="Deadline" htmlFor="a-due" required hint="Shown to students in their own timezone.">
          <Input
            id="a-due"
            type="datetime-local"
            value={form.dueAt}
            onChange={(event) => setForm({ ...form, dueAt: event.target.value })}
          />
        </Field>

        <div className="space-y-3">
          <Checkbox
            label="Accept late submissions"
            description="Late work is flagged so you can apply the published penalty."
            checked={form.allowLate}
            onChange={(event) => setForm({ ...form, allowLate: event.target.checked })}
          />
          <Checkbox
            label="Publish now"
            description="Students are notified immediately."
            checked={form.published}
            onChange={(event) => setForm({ ...form, published: event.target.checked })}
          />
        </div>
      </CardBody>

      <CardFooter>
        <Button
          className="w-full"
          onClick={create}
          disabled={pending || !form.title.trim() || form.instructions.trim().length < 20}
        >
          {pending ? <Loader2 size={15} className="animate-spin" aria-hidden /> : null}
          Create assignment
        </Button>
      </CardFooter>
    </Card>
  );
}
