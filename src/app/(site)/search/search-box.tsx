'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

import { Button } from '@/components/ui';
import { Input } from '@/components/ui/form';

export function SearchBox({ initialQuery }: { initialQuery?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery ?? '');

  function submit(event: FormEvent) {
    event.preventDefault();
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <form onSubmit={submit} role="search" className="flex max-w-xl flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Search
          size={16}
          aria-hidden
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
        />
        <label htmlFor="q" className="sr-only">
          Search the site
        </label>
        <Input
          id="q"
          name="q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Machine learning, MPH, CS201, climate…"
          className="pl-10"
          autoComplete="off"
        />
      </div>
      <Button type="submit" size="lg" className="shrink-0" disabled={!query.trim()}>
        Search
      </Button>
    </form>
  );
}
