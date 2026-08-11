import type { Metadata } from 'next';

import { PageHeader } from '@/components/ui';
import { TutorChat } from './tutor-chat';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { integrations } from '@/lib/env';

export const metadata: Metadata = { title: 'AI tutor' };
export const dynamic = 'force-dynamic';

export default async function AiTutorPage() {
  const user = await requireUser();

  const registrations = await prisma.registration.findMany({
    where: { userId: user.id, status: 'APPROVED' },
    include: { course: { select: { id: true, code: true, title: true } } },
  });

  return (
    <>
      <PageHeader
        title="AI tutor"
        description="Ask about anything you are studying. The tutor explains and questions you — it will not write your graded work."
      />

      <TutorChat
        courses={registrations.map((r) => ({
          id: r.course.id,
          label: `${r.course.code} — ${r.course.title}`,
        }))}
        live={integrations.ai}
        studentName={user.firstName}
      />
    </>
  );
}
