import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHero } from '@/components/site/page-hero';
import { Card, CardBody, SectionHeading } from '@/components/ui';
import { Accordion } from '@/components/ui/interactive';

export const metadata: Metadata = {
  title: 'Help desk',
  description: 'Get help with your studies, your account, your fees or a technical problem.',
  alternates: { canonical: '/support' },
};

const COMMON = [
  {
    question: 'I cannot sign in',
    answer:
      'Use the forgotten-password link on the sign-in page. Accounts lock for 15 minutes after five failed attempts — wait it out rather than trying again, which resets the timer. If your account is suspended you will see a different message; that means contacting the registrar.',
  },
  {
    question: 'I am going to miss a deadline',
    answer:
      'Ask your lecturer for an extension before the deadline passes. Every course allows one extension of up to two weeks with no reason required. After a deadline has passed the only route is mitigating circumstances, which needs evidence.',
  },
  {
    question: 'My exam was interrupted by a connection failure',
    answer:
      'Reopen the assessment — your attempt resumes with your answers saved and the timer still running. If the timer expired while you were disconnected, report it through the help desk the same day; invigilation logs will show the disconnection and the attempt can be re-opened.',
  },
  {
    question: 'I cannot afford my next instalment',
    answer:
      'Contact the finance office before the due date. A revised plan is almost always possible; an overdue invoice is much harder to fix. Nothing about your access to teaching changes while a plan is being arranged.',
  },
  {
    question: 'Something on the platform is not accessible to me',
    answer:
      'Email access@rumax.edu. We acknowledge within one working day and either tell you a workaround or when it will be fixed. Known issues are published on the accessibility page.',
  },
];

export default function SupportPage() {
  return (
    <>
      <PageHero
        eyebrow="Support"
        title="Help desk"
        description="One working day for a first response, and a named person rather than a queue number."
      />

      <section className="rx-container py-14">
        <div className="mx-auto max-w-3xl">
          <SectionHeading title="Things people ask most" className="mb-5" />
          <Accordion items={COMMON} />

          <Card className="mt-8">
            <CardBody className="prose-rx">
              <h2 className="!mt-0">Raise a ticket</h2>
              <p>
                Signed-in students raise tickets from the portal, which attaches your student number
                and course context automatically — that alone usually saves a day of back and forth.
                Otherwise use the <Link href="/contact">contact form</Link> or email the relevant
                desk directly.
              </p>
              <h2>If we get it wrong</h2>
              <p>
                Complaints go through the help desk first, then the Registrar, then an independent
                adjudicator. Every stage has a published time limit, and we tell you the outcome in
                writing with reasons — including when we do not uphold the complaint.
              </p>
            </CardBody>
          </Card>
        </div>
      </section>
    </>
  );
}
