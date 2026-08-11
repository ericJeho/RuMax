'use client';

import { useMemo, useState } from 'react';
import { BookOpen, Download, Quote, Search } from 'lucide-react';

import { Badge, Card, EmptyState } from '@/components/ui';
import { Input, Select } from '@/components/ui/form';
import { Modal } from '@/components/ui/interactive';
import { cn } from '@/lib/cn';

export type LibraryRecord = {
  id: string;
  slug: string;
  title: string;
  authors: string[];
  type: string;
  year: number | null;
  publisher: string | null;
  subjects: string[];
  abstract: string | null;
  available: number;
  copies: number;
  downloadable: boolean;
  doi: string | null;
};

const TYPES = [
  'ALL',
  'BOOK',
  'EBOOK',
  'JOURNAL',
  'RESEARCH_PAPER',
  'PAST_PAPER',
  'MAGAZINE',
  'VIDEO',
  'AUDIOBOOK',
] as const;

/**
 * Digital library search with an inline citation generator.
 *
 * Filtering happens client-side over the catalogue the server already sent: the whole
 * collection view is a few hundred records, and keeping it local means search stays
 * instant on a slow connection instead of a round trip per keystroke. The full 2.4m-item
 * catalogue is served through the paginated `/api/library` endpoint.
 */
export function LibraryBrowser({ items, canBorrow }: { items: LibraryRecord[]; canBorrow: boolean }) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<string>('ALL');
  const [citing, setCiting] = useState<LibraryRecord | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (type !== 'ALL' && item.type !== type) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.authors.some((author) => author.toLowerCase().includes(q)) ||
        item.subjects.some((subject) => subject.toLowerCase().includes(q)) ||
        (item.abstract ?? '').toLowerCase().includes(q)
      );
    });
  }, [items, query, type]);

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={16}
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <label htmlFor="library-search" className="sr-only">
            Search the library
          </label>
          <Input
            id="library-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title, author, subject or abstract"
            className="pl-10"
          />
        </div>
        <div className="sm:w-56">
          <label htmlFor="library-type" className="sr-only">
            Filter by type
          </label>
          <Select id="library-type" value={type} onChange={(event) => setType(event.target.value)}>
            {TYPES.map((option) => (
              <option key={option} value={option}>
                {option === 'ALL' ? 'All formats' : option.replace(/_/g, ' ').toLowerCase()}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <p className="mb-4 text-sm text-muted" aria-live="polite">
        {results.length} of {items.length} items
      </p>

      {results.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={30} aria-hidden />}
          title="Nothing matched"
          description="Try a broader term, or switch the format filter back to all."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {results.map((item) => (
            <Card key={item.id} hover className="flex h-full flex-col p-5">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge tone="brand">{item.type.replace(/_/g, ' ').toLowerCase()}</Badge>
                {item.year ? <Badge>{item.year}</Badge> : null}
                <Badge tone={item.available > 0 ? 'success' : 'warning'}>
                  {item.available > 0 ? `${item.available} available` : 'All copies out'}
                </Badge>
              </div>

              <h3 className="font-display text-base font-semibold leading-snug">{item.title}</h3>
              <p className="mt-1 text-xs text-muted">
                {item.authors.join(', ')}
                {item.publisher ? ` · ${item.publisher}` : ''}
              </p>

              {item.abstract ? (
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{item.abstract}</p>
              ) : (
                <div className="flex-1" />
              )}

              {item.subjects.length > 0 ? (
                <p className="mt-3 flex flex-wrap gap-1.5">
                  {item.subjects.map((subject) => (
                    <span
                      key={subject}
                      className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-muted"
                    >
                      {subject}
                    </span>
                  ))}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                <button
                  onClick={() => setCiting(item)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs transition hover:border-brand hover:text-brand"
                >
                  <Quote size={12} aria-hidden />
                  Cite
                </button>
                {item.downloadable ? (
                  <button
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs transition',
                      canBorrow ? 'hover:border-brand hover:text-brand' : 'opacity-50',
                    )}
                    disabled={!canBorrow}
                    title={canBorrow ? undefined : 'Sign in as a student to download'}
                  >
                    <Download size={12} aria-hidden />
                    Download
                  </button>
                ) : null}
                {canBorrow && item.available > 0 ? (
                  <button className="rounded-lg bg-brand px-2.5 py-1 text-xs font-medium text-brand-fg transition hover:brightness-110">
                    Borrow
                  </button>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(citing)}
        onClose={() => setCiting(null)}
        title="Citation"
        description={citing?.title}
      >
        {citing ? <Citations item={citing} /> : null}
      </Modal>
    </>
  );
}

/**
 * Citation generator.
 *
 * Formats are built from the catalogue record rather than free text, so a student cannot
 * accidentally cite a source that does not exist — the single most common way AI-assisted
 * writing goes wrong.
 */
function Citations({ item }: { item: LibraryRecord }) {
  const authors = item.authors.length > 0 ? item.authors : ['Anon.'];
  const year = item.year ?? 'n.d.';
  const publisher = item.publisher ?? 'RuMax University Press';

  const surnameFirst = authors
    .map((author) => {
      const parts = author.trim().split(' ');
      const surname = parts.pop() ?? author;
      return parts.length > 0 ? `${surname}, ${parts.map((p) => `${p[0]}.`).join(' ')}` : surname;
    })
    .join(', ');

  const formats = [
    {
      name: 'APA 7th',
      text: `${surnameFirst} (${year}). ${item.title}. ${publisher}.${item.doi ? ` https://doi.org/${item.doi}` : ''}`,
    },
    {
      name: 'Harvard',
      text: `${surnameFirst} ${year}, ${item.title}, ${publisher}.`,
    },
    {
      name: 'MLA 9th',
      text: `${authors[0]}${authors.length > 1 ? ', et al' : ''}. ${item.title}. ${publisher}, ${year}.`,
    },
    {
      name: 'BibTeX',
      text: `@book{${item.slug.replace(/-/g, '')},\n  title  = {${item.title}},\n  author = {${authors.join(' and ')}},\n  year   = {${year}},\n  publisher = {${publisher}}${item.doi ? `,\n  doi    = {${item.doi}}` : ''}\n}`,
    },
  ];

  return (
    <div className="space-y-4">
      {formats.map((format) => (
        <div key={format.name}>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
            {format.name}
          </p>
          <pre className="scrollbar-thin overflow-x-auto whitespace-pre-wrap rounded-xl border border-border bg-surface-2 p-3 text-xs leading-relaxed text-fg">
            {format.text}
          </pre>
        </div>
      ))}
      <p className="text-xs leading-relaxed text-muted">
        Check every generated citation against your department&rsquo;s style guide before
        submitting — automated formatting gets edge cases wrong, and the responsibility for a
        reference list is yours.
      </p>
    </div>
  );
}
