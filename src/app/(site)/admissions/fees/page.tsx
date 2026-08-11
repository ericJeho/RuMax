import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHero } from '@/components/site/page-hero';
import { Card, CardBody, Table, Td, Th } from '@/components/ui';
import { prisma } from '@/lib/db';
import { safeQuery } from '@/lib/queries';
import { formatCurrency } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Tuition & fees',
  description: 'Full tuition schedule, payment methods, instalment plans and the refund policy.',
  alternates: { canonical: '/admissions/fees' },
};

export const revalidate = 600;

const OTHER_FEES = [
  ['Application fee', 'US$25', 'Waived for open-entry courses and for applicants from least-developed countries'],
  ['Late registration', 'US$40', 'Only where Dean&rsquo;s approval is granted after the window closes'],
  ['Examination re-sit', 'US$60', 'Per paper'],
  ['Certified transcript', 'US$15', 'Digital copies are always free'],
  ['Replacement certificate', 'US$45', 'Verification is free and unlimited'],
];

export default async function FeesPage() {
  const programs = await safeQuery(
    'fees',
    () =>
      prisma.program.findMany({
        where: { published: true },
        select: { slug: true, code: true, title: true, level: true, tuitionPerYear: true, currency: true, durationMonths: true },
        orderBy: [{ level: 'asc' }, { title: 'asc' }],
      }),
    [],
  );

  return (
    <>
      <PageHero
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Admissions', href: '/admissions' }, { label: 'Fees' }]}
        eyebrow="Admissions"
        title="Tuition and fees"
        description="Every fee we charge, in one table. There are no hidden charges — if it is not listed here, we do not charge it."
      />

      <section className="rx-container py-14">
        <Card className="mb-8">
          <CardBody className="p-0">
            <Table>
              <caption className="sr-only">Tuition by programme</caption>
              <thead>
                <tr>
                  <Th>Programme</Th>
                  <Th>Level</Th>
                  <Th className="text-right">Duration</Th>
                  <Th className="text-right">Per year</Th>
                  <Th className="text-right">Total</Th>
                </tr>
              </thead>
              <tbody>
                {programs.map((program) => {
                  const years = program.durationMonths / 12;
                  const total = Number(program.tuitionPerYear) * years;
                  return (
                    <tr key={program.slug}>
                      <Td>
                        <Link href={`/programs/${program.slug}`} className="font-medium hover:text-brand">
                          {program.title}
                        </Link>
                        <span className="block font-mono text-xs text-muted">{program.code}</span>
                      </Td>
                      <Td className="text-xs capitalize">{program.level.replace(/_/g, ' ').toLowerCase()}</Td>
                      <Td className="text-right tabular-nums">{program.durationMonths} mo</Td>
                      <Td className="text-right tabular-nums">
                        {Number(program.tuitionPerYear) === 0
                          ? 'Free'
                          : formatCurrency(Number(program.tuitionPerYear), program.currency)}
                      </Td>
                      <Td className="text-right tabular-nums font-semibold">
                        {total === 0 ? 'Free' : formatCurrency(total, program.currency)}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </CardBody>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardBody>
              <h2 className="mb-4 font-display text-lg font-semibold">Other fees</h2>
              <ul className="space-y-3">
                {OTHER_FEES.map(([name, amount, note]) => (
                  <li key={name} className="border-b border-border/60 pb-3 last:border-0 last:pb-0">
                    <p className="flex items-baseline justify-between gap-3">
                      <span className="font-medium">{name}</span>
                      <span className="tabular-nums">{amount}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted" dangerouslySetInnerHTML={{ __html: note }} />
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardBody className="prose-rx">
                <h2 className="!mt-0">How to pay</h2>
                <p>
                  Card (Visa, MasterCard) via Stripe, PayPal, Flutterwave, Paystack, bank transfer,
                  and mobile money including Airtel Money and TNM Mpamba. Fees are quoted in US
                  dollars and charged in your local currency at the provider&rsquo;s rate.
                </p>
                <h2>Instalments</h2>
                <p>
                  Tuition can be split into three instalments per term at no extra cost: 40% at
                  registration, 30% at mid-term, 30% before examinations. Set this up before the
                  first due date — it cannot be applied to an already overdue invoice.
                </p>
                <h2>Refunds</h2>
                <p>
                  Full refund if you withdraw within 14 days of a term starting, 50% up to the end of
                  week four, none thereafter. Refunds go back to the original payment method within
                  10 working days.
                </p>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="text-sm leading-relaxed text-muted">
                <p className="mb-2 font-display text-base font-semibold text-fg">Cannot afford this?</p>
                Around one student in five holds an award. Check the{' '}
                <Link href="/scholarships" className="text-brand underline">
                  scholarships
                </Link>{' '}
                before deciding you cannot apply. If you are already studying and your circumstances
                change, contact the finance office before an invoice falls due — we would far rather
                arrange a plan than see someone withdraw.
              </CardBody>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}
