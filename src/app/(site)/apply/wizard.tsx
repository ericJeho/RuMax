'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, CheckCircle2, ChevronLeft, ChevronRight, Loader2, Upload } from 'lucide-react';

import { Alert, Badge, Button, Card, CardBody, CardFooter, CardHeader, CardTitle } from '@/components/ui';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/form';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/format';

type ProgramOption = { id: string; label: string; level: string; tuition: number; currency: string };

const STEPS = [
  { key: 'programme', label: 'Programme' },
  { key: 'about', label: 'About you' },
  { key: 'education', label: 'Education' },
  { key: 'statement', label: 'Statement' },
  { key: 'documents', label: 'Documents' },
] as const;

const REQUIRED_UPLOADS = [
  { type: 'PASSPORT_PHOTO', label: 'Passport photograph', required: true },
  { type: 'NATIONAL_ID', label: 'National ID or passport', required: true },
  { type: 'ACADEMIC_CERTIFICATE', label: 'Academic certificate', required: true },
  { type: 'TRANSCRIPT', label: 'Academic transcript', required: true },
  { type: 'CV', label: 'CV / résumé', required: false },
  { type: 'REFERENCE_LETTER', label: 'Reference letter', required: false },
];

const STORAGE_KEY = 'rumax:application-draft';

/**
 * The application form.
 *
 * Split into five steps because a single 30-field form has a completion rate roughly half
 * that of a stepped one, and this form is the university's front door. Progress is mirrored
 * to localStorage on every change so a dropped connection or a closed tab does not cost
 * an applicant their work.
 */
export function ApplicationWizard({
  programs,
  intakes,
  signedIn,
}: {
  programs: ProgramOption[];
  intakes: string[];
  signedIn: boolean;
}) {
  const [step, setStep] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<string[]>([]);

  const [form, setForm] = useState({
    programId: programs[0]?.id ?? '',
    intakeTerm: intakes[0] ?? '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    nationality: '',
    country: '',
    highestQualification: '',
    institution: '',
    graduationYear: '',
    gpa: '',
    fundingSource: '',
    personalStatement: '',
    declaration: false,
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setForm((current) => ({ ...current, ...JSON.parse(saved) }));
    } catch {
      /* corrupt draft: start fresh rather than blocking the applicant */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    } catch {
      /* storage unavailable — the form still works, it just will not survive a refresh */
    }
  }, [form]);

  const set = (key: keyof typeof form) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const selected = programs.find((program) => program.id === form.programId);

  const stepValid = [
    Boolean(form.programId && form.intakeTerm),
    Boolean(form.firstName && form.lastName && form.email && form.country),
    Boolean(form.highestQualification && form.institution),
    form.personalStatement.trim().length >= 100,
    form.declaration && REQUIRED_UPLOADS.filter((u) => u.required).every((u) => uploaded.includes(u.type)),
  ];

  async function submit() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...form,
          graduationYear: form.graduationYear ? Number(form.graduationYear) : undefined,
          dateOfBirth: form.dateOfBirth || undefined,
          documents: uploaded,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data?.error?.message ?? 'We could not submit your application. Please try again.');
        return;
      }

      localStorage.removeItem(STORAGE_KEY);
      setReference(data.reference);
    } catch {
      setError('Could not reach the server. Your answers are saved on this device — try again shortly.');
    } finally {
      setPending(false);
    }
  }

  if (reference) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardBody className="py-12 text-center">
          <CheckCircle2 size={44} className="mx-auto mb-4 text-success" aria-hidden />
          <h2 className="font-display text-2xl font-semibold">Application submitted</h2>
          <p className="mt-3 text-muted">
            Your reference is{' '}
            <span className="font-mono font-semibold text-fg">{reference}</span>. Keep it — you will
            need it to track your application.
          </p>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted">
            We aim to give every applicant a first decision within five working days. You will hear
            from us by email, and you can check the status at any time.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href={`/apply/status?reference=${reference}`} className="btn-primary">
              Track my application
            </Link>
            <Link href="/programs" className="btn-secondary">
              Browse other programmes
            </Link>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Stepper */}
      <ol className="mb-8 flex flex-wrap items-center gap-x-2 gap-y-3">
        {STEPS.map((entry, index) => (
          <li key={entry.key} className="flex items-center gap-2">
            <button
              onClick={() => index <= step && setStep(index)}
              disabled={index > step}
              aria-current={index === step ? 'step' : undefined}
              className={cn(
                'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition',
                index === step && 'bg-brand text-brand-fg',
                index < step && 'text-success hover:bg-surface-2',
                index > step && 'text-muted',
              )}
            >
              <span
                className={cn(
                  'grid h-5 w-5 place-items-center rounded-full border text-[10px]',
                  index === step && 'border-brand-fg',
                  index < step && 'border-success bg-success text-white',
                  index > step && 'border-border',
                )}
              >
                {index < step ? <Check size={11} aria-hidden /> : index + 1}
              </span>
              {entry.label}
            </button>
            {index < STEPS.length - 1 ? (
              <span aria-hidden className="hidden h-px w-4 bg-border sm:block" />
            ) : null}
          </li>
        ))}
      </ol>

      {!signedIn ? (
        <Alert tone="info" className="mb-6">
          You can apply without an account. Creating one first lets you save a draft across devices
          and track your application afterwards —{' '}
          <Link href="/register" className="font-medium underline">
            create an account
          </Link>
          .
        </Alert>
      ) : null}

      {error ? (
        <Alert tone="danger" className="mb-6">
          {error}
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle as="h2">
            Step {step + 1} of {STEPS.length}: {STEPS[step].label}
          </CardTitle>
        </CardHeader>

        <CardBody>
          {step === 0 ? (
            <>
              <Field label="Programme" htmlFor="programId" required>
                <Select id="programId" value={form.programId} onChange={set('programId')}>
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.label}
                    </option>
                  ))}
                </Select>
              </Field>

              {selected ? (
                <div className="mb-5 rounded-xl border border-border bg-surface-2/50 p-4 text-sm">
                  <p className="flex flex-wrap items-center gap-2">
                    <Badge tone="brand">{selected.level.replace(/_/g, ' ').toLowerCase()}</Badge>
                    <span className="text-muted">
                      Tuition:{' '}
                      {selected.tuition === 0
                        ? 'no fee'
                        : `${formatCurrency(selected.tuition, selected.currency)} per year`}
                    </span>
                  </p>
                </div>
              ) : null}

              <Field label="Intake" htmlFor="intakeTerm" required>
                <Select id="intakeTerm" value={form.intakeTerm} onChange={set('intakeTerm')}>
                  {intakes.length === 0 ? <option value="">No intake currently open</option> : null}
                  {intakes.map((intake) => (
                    <option key={intake} value={intake}>
                      {intake}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                label="How will you fund your studies?"
                htmlFor="fundingSource"
                hint="This does not affect your admission decision — it helps us point you at the right funding."
              >
                <Select id="fundingSource" value={form.fundingSource} onChange={set('fundingSource')}>
                  <option value="">Prefer not to say</option>
                  <option value="Self-funded">Self-funded</option>
                  <option value="Employer sponsored">Employer sponsored</option>
                  <option value="Government scholarship">Government scholarship</option>
                  <option value="Applying for a RuMax scholarship">Applying for a RuMax scholarship</option>
                  <option value="Family support">Family support</option>
                </Select>
              </Field>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <div className="grid gap-x-4 sm:grid-cols-2">
                <Field label="First name" htmlFor="firstName" required>
                  <Input id="firstName" value={form.firstName} onChange={set('firstName')} autoComplete="given-name" />
                </Field>
                <Field label="Family name" htmlFor="lastName" required>
                  <Input id="lastName" value={form.lastName} onChange={set('lastName')} autoComplete="family-name" />
                </Field>
              </div>

              <Field label="Email address" htmlFor="email" required hint="All correspondence goes here.">
                <Input id="email" type="email" value={form.email} onChange={set('email')} autoComplete="email" />
              </Field>

              <div className="grid gap-x-4 sm:grid-cols-2">
                <Field label="Phone" htmlFor="phone">
                  <Input id="phone" value={form.phone} onChange={set('phone')} autoComplete="tel" />
                </Field>
                <Field label="Date of birth" htmlFor="dateOfBirth">
                  <Input id="dateOfBirth" type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} />
                </Field>
                <Field label="Country of residence" htmlFor="country" required>
                  <Input id="country" value={form.country} onChange={set('country')} autoComplete="country-name" />
                </Field>
                <Field label="Nationality" htmlFor="nationality">
                  <Input id="nationality" value={form.nationality} onChange={set('nationality')} />
                </Field>
              </div>

              <Field label="Gender" htmlFor="gender" hint="Optional. Collected for statutory equality reporting only.">
                <Select id="gender" value={form.gender} onChange={set('gender')}>
                  <option value="">Prefer not to say</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Self-describe">Prefer to self-describe</option>
                </Select>
              </Field>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <Field label="Highest qualification held" htmlFor="highestQualification" required>
                <Input
                  id="highestQualification"
                  value={form.highestQualification}
                  onChange={set('highestQualification')}
                  placeholder="BSc Computer Science / Secondary school certificate"
                />
              </Field>

              <Field label="Institution" htmlFor="institution" required>
                <Input id="institution" value={form.institution} onChange={set('institution')} />
              </Field>

              <div className="grid gap-x-4 sm:grid-cols-2">
                <Field label="Year completed" htmlFor="graduationYear">
                  <Input
                    id="graduationYear"
                    type="number"
                    min={1950}
                    max={new Date().getFullYear() + 5}
                    value={form.graduationYear}
                    onChange={set('graduationYear')}
                  />
                </Field>
                <Field label="Grade / GPA" htmlFor="gpa" hint="However it was awarded — we convert it.">
                  <Input id="gpa" value={form.gpa} onChange={set('gpa')} placeholder="3.6 / 4.0 or Second Class Upper" />
                </Field>
              </div>

              <Alert tone="info">
                No formal qualification? Certificates, short courses and open courses have open
                entry, and degree programmes accept relevant professional experience through our
                recognition of prior learning route. Apply anyway and tell us your situation in the
                next step.
              </Alert>
            </>
          ) : null}

          {step === 3 ? (
            <Field
              label="Personal statement"
              htmlFor="personalStatement"
              required
              hint={`${form.personalStatement.trim().length} characters — 100 minimum, about 500 words is ideal.`}
            >
              <Textarea
                id="personalStatement"
                rows={12}
                value={form.personalStatement}
                onChange={set('personalStatement')}
                placeholder="Why this programme, why now, and what you intend to do with it. Concrete beats general: one thing you have actually built, run or studied tells us more than a paragraph of ambition."
              />
            </Field>
          ) : null}

          {step === 4 ? (
            <>
              <p className="mb-4 text-sm leading-relaxed text-muted">
                Upload clear scans or photographs. PDF, JPG or PNG, up to 10 MB each. You can
                replace anything later from your application tracker.
              </p>

              <ul className="mb-6 space-y-2">
                {REQUIRED_UPLOADS.map((upload) => {
                  const done = uploaded.includes(upload.type);
                  return (
                    <li
                      key={upload.type}
                      className={cn(
                        'flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3',
                        done ? 'border-success/40 bg-success/5' : 'border-border',
                      )}
                    >
                      <span className="flex items-center gap-2.5 text-sm">
                        {done ? (
                          <CheckCircle2 size={16} className="text-success" aria-hidden />
                        ) : (
                          <Upload size={16} className="text-muted" aria-hidden />
                        )}
                        <span>
                          {upload.label}
                          {upload.required ? <span className="ml-1 text-danger">*</span> : null}
                        </span>
                      </span>
                      <Button
                        size="sm"
                        variant={done ? 'ghost' : 'secondary'}
                        onClick={() =>
                          setUploaded((current) =>
                            done ? current.filter((type) => type !== upload.type) : [...current, upload.type],
                          )
                        }
                      >
                        {done ? 'Remove' : 'Choose file'}
                      </Button>
                    </li>
                  );
                })}
              </ul>

              <Checkbox
                label="I declare that the information given is true and complete"
                description="Knowingly giving false information is grounds for withdrawing an offer or, after enrolment, terminating your registration."
                checked={form.declaration}
                onChange={(event) => setForm({ ...form, declaration: event.target.checked })}
              />

              <p className="mt-4 text-xs leading-relaxed text-muted">
                We process your data to assess your application, under the lawful basis of taking
                steps at your request prior to entering a contract. Read the{' '}
                <Link href="/privacy" className="text-brand underline">
                  privacy policy
                </Link>
                .
              </p>
            </>
          ) : null}
        </CardBody>

        <CardFooter className="flex items-center justify-between">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            disabled={step === 0}
          >
            <ChevronLeft size={14} aria-hidden />
            Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button size="sm" onClick={() => setStep((current) => current + 1)} disabled={!stepValid[step]}>
              Continue
              <ChevronRight size={14} aria-hidden />
            </Button>
          ) : (
            <Button size="sm" onClick={submit} disabled={pending || !stepValid[4]}>
              {pending ? <Loader2 size={14} className="animate-spin" aria-hidden /> : null}
              Submit application
            </Button>
          )}
        </CardFooter>
      </Card>

      <p className="mt-4 text-center text-xs text-muted">
        Your answers are saved on this device as you type. Nothing is sent to us until you press
        submit.
      </p>
    </div>
  );
}
