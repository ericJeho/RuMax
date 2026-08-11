'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import { useToast } from '@/components/ui/interactive';

type Profile = {
  phone: string;
  country: string;
  city: string;
  bio: string;
  locale: string;
  timezone: string;
};

// A short list covering where most of our students actually are; the full IANA list is
// fetched from the browser when available.
const TIMEZONES = [
  'UTC',
  'Africa/Blantyre',
  'Africa/Nairobi',
  'Africa/Lagos',
  'Africa/Johannesburg',
  'Africa/Cairo',
  'Europe/London',
  'Europe/Lisbon',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Manila',
  'America/Sao_Paulo',
  'America/New_York',
];

export function ProfileForm({
  initial,
  languages,
}: {
  initial: Profile;
  languages: { code: string; label: string }[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState(initial);
  const [pending, setPending] = useState(false);

  const set = (key: keyof Profile) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  async function save() {
    setPending(true);
    try {
      const response = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.push({ tone: 'danger', title: 'Not saved', body: data?.error?.message ?? 'Try again.' });
        return;
      }

      toast.push({ tone: 'success', title: 'Profile updated' });
      router.refresh();
    } catch {
      toast.push({ tone: 'danger', title: 'Offline', body: 'Could not reach the server.' });
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <div className="grid gap-x-4 sm:grid-cols-2">
        <Field label="Phone" htmlFor="phone">
          <Input id="phone" value={form.phone} onChange={set('phone')} autoComplete="tel" />
        </Field>
        <Field label="Country" htmlFor="country">
          <Input id="country" value={form.country} onChange={set('country')} autoComplete="country-name" />
        </Field>
        <Field label="City" htmlFor="city">
          <Input id="city" value={form.city} onChange={set('city')} autoComplete="address-level2" />
        </Field>
        <Field label="Preferred language" htmlFor="locale">
          <Select id="locale" value={form.locale} onChange={set('locale')}>
            {languages.map((language) => (
              <option key={language.code} value={language.code}>
                {language.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field
        label="Timezone"
        htmlFor="timezone"
        hint="Deadlines and live sessions are shown in this timezone."
      >
        <Select id="timezone" value={form.timezone} onChange={set('timezone')}>
          {[...new Set([form.timezone, ...TIMEZONES])].map((zone) => (
            <option key={zone} value={zone}>
              {zone.replace(/_/g, ' ')}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="About you" htmlFor="bio" hint="Visible to your lecturers and cohort.">
        <Textarea id="bio" rows={4} value={form.bio} onChange={set('bio')} maxLength={1000} />
      </Field>

      <Button onClick={save} disabled={pending}>
        {pending ? <Loader2 size={15} className="animate-spin" aria-hidden /> : null}
        Save changes
      </Button>
    </div>
  );
}
