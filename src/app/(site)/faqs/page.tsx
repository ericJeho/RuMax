import type { Metadata } from 'next';

import { PageHero } from '@/components/site/page-hero';
import { Accordion } from '@/components/ui/interactive';
import { EmptyState, SectionHeading } from '@/components/ui';
import { getFaqs } from '@/lib/queries';
import { env } from '@/lib/env';

export const metadata: Metadata = {
  title: 'FAQs',
  description: 'Answers to the questions prospective and current RuMax students ask most.',
  alternates: { canonical: '/faqs' },
};

export const revalidate = 600;

export default async function FaqsPage() {
  const faqs = await getFaqs();

  const byCategory = new Map<string, typeof faqs>();
  for (const faq of faqs) {
    byCategory.set(faq.category, [...(byCategory.get(faq.category) ?? []), faq]);
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    url: `${env.NEXT_PUBLIC_SITE_URL}/faqs`,
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };

  return (
    <>
      {faqs.length > 0 ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      ) : null}

      <PageHero eyebrow="Help" title="Frequently asked questions" description="If the answer you need is not here, the help desk replies within one working day." />

      <section className="rx-container py-14">
        {faqs.length === 0 ? (
          <EmptyState title="No FAQs published" description="Run the seed to load demonstration content." />
        ) : (
          <div className="mx-auto max-w-3xl space-y-10">
            {[...byCategory.entries()].map(([category, entries]) => (
              <div key={category}>
                <SectionHeading title={category} className="mb-4" />
                <Accordion items={entries.map((entry) => ({ question: entry.question, answer: entry.answer }))} />
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
