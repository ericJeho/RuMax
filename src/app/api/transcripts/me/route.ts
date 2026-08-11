import { handleError } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { getTranscript } from '@/lib/student';
import { classify } from '@/lib/grading';
import { SITE } from '@/lib/site';

export const dynamic = 'force-dynamic';

/**
 * GET /api/transcripts/me
 *
 * Returns the transcript as structured JSON rather than a rendered PDF. Rendering is
 * deliberately left to the caller: the registrar's document service produces the sealed,
 * watermarked PDF from exactly this payload, and having one canonical data shape means
 * the screen, the download and the official document can never disagree.
 */
export async function GET() {
  try {
    const user = await requireUser();
    const { terms, cgpa, totalCredits } = await getTranscript(user.id);

    const payload = {
      institution: {
        name: SITE.name,
        address: SITE.address,
        registration: SITE.registrationNumber,
      },
      student: {
        name: `${user.firstName} ${user.lastName}`,
        studentNumber: user.studentNumber,
        status: user.status,
        admittedAt: user.admittedAt,
        graduatedAt: user.graduatedAt,
      },
      terms: terms.map((term) => ({
        name: term.name,
        gpa: term.gpa,
        creditsPassed: term.credits,
        courses: term.entries.map((grade) => ({
          code: grade.course.code,
          title: grade.course.title,
          credits: grade.credits,
          mark: grade.score,
          letter: grade.letter,
          gradePoint: grade.gradePoint,
        })),
      })),
      summary: {
        cumulativeGpa: cgpa,
        creditsPassed: totalCredits,
        classification: classify(cgpa),
      },
      generatedAt: new Date().toISOString(),
      official: false,
      note: 'Unofficial copy generated from the live student record. Request a sealed transcript from the registrar for official use.',
    };

    return new Response(JSON.stringify(payload, null, 2), {
      headers: {
        'content-type': 'application/json',
        'content-disposition': `attachment; filename="transcript-${user.studentNumber ?? user.id}.json"`,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
