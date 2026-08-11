'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

import { Badge, Card, EmptyState } from '@/components/ui';
import { Input, Select } from '@/components/ui/form';
import { formatCurrency, truncate } from '@/lib/format';
import { cn } from '@/lib/cn';

type ProgramCard = {
  id: string;
  slug: string;
  code: string;
  title: string;
  level: string;
  mode: string;
  summary: string;
  durationMonths: number;
  totalCredits: number;
  tuition: number;
  currency: string;
  faculty: string;
  featured: boolean;
};

const LEVELS = [
  { value: 'ALL', label: 'All levels' },
  { value: 'UNDERGRADUATE', label: 'Undergraduate' },
  { value: 'MASTERS', label: 'Masters' },
  { value: 'PHD', label: 'Doctorate' },
  { value: 'DIPLOMA', label: 'Diploma' },
  { value: 'CERTIFICATE', label: 'Certificate' },
  { value: 'PROFESSIONAL', label: 'Professional' },
  { value: 'EXECUTIVE', label: 'Executive' },
  { value: 'SHORT_COURSE', label: 'Short course' },
  { value: 'MOOC', label: 'Free open course' },
];

const SORTS = [
  { value: 'title', label: 'A–Z' },
  { value: 'tuition-asc', label: 'Tuition: low to high' },
  { value: 'tuition-desc', label: 'Tuition: high to low' },
  { value: 'duration', label: 'Shortest first' },
];

/**
 * The programme catalogue.
 *
 * Filtering runs in the browser over the full published catalogue, which is a few hundred
 * records: a prospective student comparing programmes changes filters constantly, and a
 * server round trip per change makes that feel broken on a slow connection.
 */
export function ProgramCatalogue({ programs }: { programs: ProgramCard[] }) {
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('ALL');
  const [faculty, setFaculty] = useState('ALL');
  const [sort, setSort] = useState('title');

  const faculties = useMemo(
    () => ['ALL', ...new Set(programs.map((program) => program.faculty))],
    [programs],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();

    const filtered = programs.filter((program) => {
      if (level !== 'ALL' && program.level !== level) return false;
      if (faculty !== 'ALL' && program.faculty !== faculty) return false;
      if (!q) return true;
      return (
        program.title.toLowerCase().includes(q) ||
        program.summary.toLowerCase().includes(q) ||
        program.code.toLowerCase().includes(q) ||
        program.faculty.toLowerCase().includes(q)
      );
    });

    return [...filtered].sort((a, b) => {
      switch (sort) {
        case 'tuition-asc':
          return a.tuition - b.tuition;
        case 'tuition-desc':
          return b.tuition - a.tuition;
        case 'duration':
          return a.durationMonths - b.durationMonths;
        default:
          return a.title.localeCompare(b.title);
      }
    });
  }, [programs, query, level, faculty, sort]);

  return (
    <>
      <div className="mb-8 grid gap-3 lg:grid-cols-[2fr_1fr_1fr_1fr]">
        <div className="relative">
          <Search
            size={16}
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <label htmlFor="program-search" className="sr-only">
            Search programmes
          </label>
          <Input
            id="program-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search programmes"
            className="pl-10"
          />
        </div>

        <div>
          <label htmlFor="level" className="sr-only">
            Filter by level
          </label>
          <Select id="level" value={level} onChange={(event) => setLevel(event.target.value)}>
            {LEVELS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label htmlFor="faculty" className="sr-only">
            Filter by faculty
          </label>
          <Select id="faculty" value={faculty} onChange={(event) => setFaculty(event.target.value)}>
            {faculties.map((option) => (
              <option key={option} value={option}>
                {option === 'ALL' ? 'All faculties' : option}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label htmlFor="sort" className="sr-only">
            Sort
          </label>
          <Select id="sort" value={sort} onChange={(event) => setSort(event.target.value)}>
            {SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <p className="mb-5 text-sm text-muted" aria-live="polite">
        Showing {results.length} of {programs.length} programmes
      </p>

      {results.length === 0 ? (
        <EmptyState
          title="No programmes matched"
          description="Try a broader search, or clear the level and faculty filters."
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {results.map((program) => (
            <Card key={program.id} hover className={cn('flex h-full flex-col p-6', program.featured && 'border-brand/40')}>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge tone="brand">{program.level.replace(/_/g, ' ').toLowerCase()}</Badge>
                <Badge>{program.durationMonths} months</Badge>
                {program.mode === 'SELF_PACED' ? <Badge tone="accent">Self-paced</Badge> : null}
                {program.tuition === 0 ? <Badge tone="success">Free</Badge> : null}
              </div>

              <h2 className="font-display text-lg font-semibold leading-snug">
                <Link href={`/programs/${program.slug}`} className="hover:text-brand">
                  {program.title}
                </Link>
              </h2>
              <p className="mt-1 font-mono text-xs text-muted">{program.code}</p>

              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
                {truncate(program.summary, 140)}
              </p>

              <div className="mt-5 border-t border-border pt-4">
                <p className="text-xs text-muted">{program.faculty}</p>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="font-display text-lg font-semibold">
                    {program.tuition === 0
                      ? 'No fee'
                      : formatCurrency(program.tuition, program.currency)}
                    {program.tuition > 0 ? (
                      <span className="text-xs font-normal text-muted">/year</span>
                    ) : null}
                  </span>
                  <span className="text-xs text-muted">{program.totalCredits} credits</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
