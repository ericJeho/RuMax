import type { Metadata } from 'next';

import { PageHero } from '@/components/site/page-hero';
import { Badge, Card, EmptyState } from '@/components/ui';
import { getPartners } from '@/lib/queries';

export const metadata: Metadata = {
  title: 'Partners',
  description: 'Academic, industry, government and research-infrastructure partners of RuMax Global Digital University.',
  alternates: { canonical: '/partners' },
};

export const revalidate = 3600;

export default async function PartnersPage() {
  const partners = await getPartners();

  const byCategory = new Map<string, typeof partners>();
  for (const partner of partners) {
    byCategory.set(partner.category, [...(byCategory.get(partner.category) ?? []), partner]);
  }

  return (
    <>
      <PageHero
        eyebrow="Collaboration"
        title="Partners"
        description="Credit transfer, joint research, employer pipelines and the infrastructure that makes open publishing possible."
      />

      <section className="rx-container py-14">
        {partners.length === 0 ? (
          <EmptyState title="No partners listed" description="Partner organisations will appear here." />
        ) : (
          <div className="space-y-10">
            {[...byCategory.entries()].map(([category, entries]) => (
              <div key={category}>
                <h2 className="mb-4 font-display text-xl font-semibold">{category}</h2>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {entries.map((partner) => (
                    <Card key={partner.id} className="p-5">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <h3 className="font-medium">{partner.name}</h3>
                        {partner.country ? <Badge>{partner.country}</Badge> : null}
                      </div>
                      <p className="text-sm leading-relaxed text-muted">{partner.summary}</p>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
