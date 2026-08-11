import type { Metadata } from 'next';
import Link from 'next/link';

import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  PageHeader,
  StatCard,
  Table,
  Td,
  Th,
} from '@/components/ui';
import { ColumnChart } from '@/components/charts';
import { requireUser } from '@/lib/auth';
import { getTranscript } from '@/lib/student';
import { classify, onProbation, PROBATION_THRESHOLD } from '@/lib/grading';
import { Alert } from '@/components/ui';

export const metadata: Metadata = { title: 'Grades' };
export const dynamic = 'force-dynamic';

export default async function GradesPage() {
  const user = await requireUser();
  const { terms, cgpa, totalCredits } = await getTranscript(user.id);

  const chartData = terms.map((term) => ({
    term: term.name.replace(/^\d{4}\/\d{2}\s/, ''),
    gpa: term.gpa,
  }));

  return (
    <>
      <PageHeader
        title="Grades"
        description="Published results only. Marks appear here once your lecturer and the registrar have released them."
        actions={
          <Link href="/portal/transcript" className="btn-secondary text-sm">
            Official transcript
          </Link>
        }
      />

      {onProbation(cgpa, totalCredits) ? (
        <Alert tone="danger" title="Academic probation" className="mb-6">
          Your CGPA is below the minimum of {PROBATION_THRESHOLD.toFixed(1)}. Speak to your academic
          advisor — a reduced course load or additional support is usually available, and acting
          early is what makes the difference.
        </Alert>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Cumulative GPA" value={cgpa.toFixed(2)} hint={classify(cgpa)} />
        <StatCard label="Credits passed" value={totalCredits} />
        <StatCard label="Terms completed" value={terms.length} />
      </div>

      {terms.length === 0 ? (
        <EmptyState
          title="No published results yet"
          description="Your first results appear after the end of your first term."
        />
      ) : (
        <>
          {chartData.length > 1 ? (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle as="h2">GPA by term</CardTitle>
              </CardHeader>
              <CardBody>
                <ColumnChart data={chartData} xKey="term" series={[{ key: 'gpa', label: 'Term GPA' }]} />
              </CardBody>
            </Card>
          ) : null}

          <div className="space-y-6">
            {terms.map((term) => (
              <Card key={term.name}>
                <CardHeader className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle as="h2">{term.name}</CardTitle>
                  <div className="flex gap-2">
                    <Badge tone="brand">GPA {term.gpa.toFixed(2)}</Badge>
                    <Badge>{term.credits} credits</Badge>
                  </div>
                </CardHeader>
                <CardBody className="p-0">
                  <Table>
                    <caption className="sr-only">Results for {term.name}</caption>
                    <thead>
                      <tr>
                        <Th>Code</Th>
                        <Th>Course</Th>
                        <Th className="text-right">Credits</Th>
                        <Th className="text-right">Mark</Th>
                        <Th className="text-right">Grade</Th>
                        <Th className="text-right">Points</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {term.entries.map((grade) => (
                        <tr key={grade.id}>
                          <Td className="font-mono text-xs">{grade.course.code}</Td>
                          <Td>{grade.course.title}</Td>
                          <Td className="text-right tabular-nums">{grade.credits}</Td>
                          <Td className="text-right tabular-nums">{grade.score.toFixed(1)}%</Td>
                          <Td className="text-right">
                            <Badge tone={grade.score >= 50 ? 'success' : 'danger'}>{grade.letter}</Badge>
                          </Td>
                          <Td className="text-right tabular-nums">{grade.gradePoint.toFixed(1)}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </CardBody>
              </Card>
            ))}
          </div>

          <Card className="mt-6">
            <CardBody>
              <h2 className="mb-2 font-display text-base font-semibold">Appealing a mark</h2>
              <p className="text-sm leading-relaxed text-muted">
                If you believe a mark is wrong, raise it with your lecturer within 14 days of
                publication. If that does not resolve it, submit a formal appeal to the registrar
                through the help desk. Appeals are considered on procedural grounds — that the
                regulations were not followed — not on academic judgement.
              </p>
            </CardBody>
          </Card>
        </>
      )}
    </>
  );
}
