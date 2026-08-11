import type { Metadata } from 'next';

import { Badge, Card, CardBody, PageHeader, StatCard, Table, Td, Th } from '@/components/ui';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Content' };
export const dynamic = 'force-dynamic';

export default async function AdminContentPage() {
  await requireRole('ADMIN', 'REGISTRAR');

  const [posts, enquiries, partners, faqs, jobs] = await Promise.all([
    prisma.post.findMany({ orderBy: { publishedAt: 'desc' }, take: 60 }),
    prisma.contactEnquiry.count({ where: { handled: false } }),
    prisma.partner.count(),
    prisma.faqEntry.count(),
    prisma.jobPosting.count({ where: { published: true } }),
  ]);

  return (
    <>
      <PageHeader
        title="Content management"
        description="News, blog, events and press. Everything published here appears on the public site immediately."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <StatCard label="Posts" value={posts.length} />
        <StatCard label="Unhandled enquiries" value={enquiries} />
        <StatCard label="Partners" value={partners} />
        <StatCard label="FAQs / job posts" value={`${faqs} / ${jobs}`} />
      </div>

      <Card>
        <CardBody className="p-0">
          <Table>
            <caption className="sr-only">Published content</caption>
            <thead>
              <tr>
                <Th>Title</Th>
                <Th>Category</Th>
                <Th>Tags</Th>
                <Th>Published</Th>
                <Th className="text-right">Status</Th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id}>
                  <Td>
                    <span className="block font-medium">{post.title}</span>
                    <span className="block font-mono text-xs text-muted">/{post.slug}</span>
                  </Td>
                  <Td className="text-xs capitalize">{post.category.toLowerCase()}</Td>
                  <Td className="text-xs text-muted">{post.tags.join(', ')}</Td>
                  <Td className="whitespace-nowrap text-xs">{formatDate(post.publishedAt)}</Td>
                  <Td className="text-right">
                    <Badge tone={post.published ? 'success' : 'warning'}>
                      {post.published ? 'Live' : 'Draft'}
                    </Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardBody>
      </Card>
    </>
  );
}
