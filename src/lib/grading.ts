/**
 * Academic grading rules for RuMax Global Digital University.
 *
 * The scale is a 4.0 grade-point system on a 100-point percentage mark, which is what
 * the Senate-approved regulations in docs/ACADEMIC-REGULATIONS.md describe. Everything
 * here is pure so it can be unit tested and reused on both client and server.
 */

export type LetterGrade = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';

const SCALE: { min: number; letter: LetterGrade; point: number }[] = [
  { min: 90, letter: 'A+', point: 4.0 },
  { min: 85, letter: 'A', point: 4.0 },
  { min: 80, letter: 'A-', point: 3.7 },
  { min: 75, letter: 'B+', point: 3.3 },
  { min: 70, letter: 'B', point: 3.0 },
  { min: 65, letter: 'B-', point: 2.7 },
  { min: 60, letter: 'C+', point: 2.3 },
  { min: 55, letter: 'C', point: 2.0 },
  { min: 50, letter: 'C-', point: 1.7 },
  { min: 45, letter: 'D', point: 1.0 },
  { min: 0, letter: 'F', point: 0.0 },
];

export const PASS_MARK = 50;

export function letterFor(score: number): LetterGrade {
  return SCALE.find((band) => score >= band.min)?.letter ?? 'F';
}

export function gradePointFor(score: number): number {
  return SCALE.find((band) => score >= band.min)?.point ?? 0;
}

export function isPass(score: number): boolean {
  return score >= PASS_MARK;
}

export type GradedCourse = {
  credits: number;
  /** Percentage mark, 0–100. */
  score: number;
};

/**
 * Credit-weighted grade point average.
 *
 * Courses with zero credits (audited, non-credit-bearing seminars) do not influence
 * the average. Returns 0 when there is nothing creditable to average.
 */
export function calculateGpa(courses: GradedCourse[]): number {
  const creditable = courses.filter((c) => c.credits > 0);
  const totalCredits = creditable.reduce((sum, c) => sum + c.credits, 0);
  if (totalCredits === 0) return 0;

  const points = creditable.reduce((sum, c) => sum + gradePointFor(c.score) * c.credits, 0);
  return round2(points / totalCredits);
}

/** Cumulative GPA across every term. Identical maths, named for how registrars use it. */
export const calculateCgpa = calculateGpa;

export type Classification =
  | 'First Class'
  | 'Second Class (Upper Division)'
  | 'Second Class (Lower Division)'
  | 'Third Class'
  | 'Pass'
  | 'Fail';

export function classify(cgpa: number): Classification {
  if (cgpa >= 3.7) return 'First Class';
  if (cgpa >= 3.3) return 'Second Class (Upper Division)';
  if (cgpa >= 2.7) return 'Second Class (Lower Division)';
  if (cgpa >= 2.0) return 'Third Class';
  if (cgpa >= 1.7) return 'Pass';
  return 'Fail';
}

/** A CGPA below this triggers academic probation at the end of a term. */
export const PROBATION_THRESHOLD = 2.0;

export function onProbation(cgpa: number, completedCredits: number): boolean {
  // First-term students are not placed on probation before a full term of results.
  return completedCredits >= 12 && cgpa < PROBATION_THRESHOLD;
}

export type WeightedComponent = {
  /** Score expressed as a percentage of that component's maximum. */
  score: number;
  /** Contribution to the final mark, 0–1. Weights across a course should sum to 1. */
  weight: number;
};

/**
 * Aggregate a course's continuous assessment into a final percentage.
 *
 * Weights are normalised by the total weight actually present, so a mid-term view of a
 * course that is only 60% assessed still reports a meaningful running mark instead of
 * dragging the student toward zero.
 */
export function aggregateScore(components: WeightedComponent[]): number {
  const totalWeight = components.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight === 0) return 0;
  const weighted = components.reduce((sum, c) => sum + c.score * c.weight, 0);
  return round2(weighted / totalWeight);
}

export type DegreeAudit = {
  requiredCredits: number;
  earnedCredits: number;
  inProgressCredits: number;
  remainingCredits: number;
  percentComplete: number;
  cgpa: number;
  classification: Classification;
  eligibleToGraduate: boolean;
  outstandingRequirements: string[];
};

/**
 * Degree audit: can this student graduate, and if not, what is missing?
 */
export function auditDegree(input: {
  requiredCredits: number;
  completed: GradedCourse[];
  inProgressCredits: number;
  outstandingCoreCourses: string[];
  feesCleared: boolean;
}): DegreeAudit {
  const passed = input.completed.filter((c) => isPass(c.score));
  const earnedCredits = passed.reduce((sum, c) => sum + c.credits, 0);
  const cgpa = calculateCgpa(input.completed);
  const remainingCredits = Math.max(0, input.requiredCredits - earnedCredits);

  const outstanding: string[] = [];
  if (remainingCredits > 0) outstanding.push(`${remainingCredits} credits outstanding`);
  for (const course of input.outstandingCoreCourses) {
    outstanding.push(`Core course not passed: ${course}`);
  }
  if (cgpa < PROBATION_THRESHOLD) outstanding.push(`CGPA below the ${PROBATION_THRESHOLD.toFixed(1)} minimum`);
  if (!input.feesCleared) outstanding.push('Outstanding tuition balance');

  return {
    requiredCredits: input.requiredCredits,
    earnedCredits,
    inProgressCredits: input.inProgressCredits,
    remainingCredits,
    percentComplete:
      input.requiredCredits === 0
        ? 0
        : Math.min(100, round2((earnedCredits / input.requiredCredits) * 100)),
    cgpa,
    classification: classify(cgpa),
    eligibleToGraduate: outstanding.length === 0,
    outstandingRequirements: outstanding,
  };
}

/** Have every prerequisite for a course been passed? */
export function prerequisitesMet(
  prerequisiteCodes: string[],
  passedCourseCodes: string[],
): { met: boolean; missing: string[] } {
  const passed = new Set(passedCourseCodes);
  const missing = prerequisiteCodes.filter((code) => !passed.has(code));
  return { met: missing.length === 0, missing };
}

/** Maximum credits a student may register for in one term without a Dean's waiver. */
export const MAX_CREDITS_PER_TERM = 21;
export const MIN_CREDITS_PER_TERM = 9;

export function validateRegistrationLoad(credits: number): string | null {
  if (credits > MAX_CREDITS_PER_TERM) {
    return `A maximum of ${MAX_CREDITS_PER_TERM} credits may be taken per term without Dean's approval.`;
  }
  if (credits > 0 && credits < MIN_CREDITS_PER_TERM) {
    return `Full-time students must register for at least ${MIN_CREDITS_PER_TERM} credits.`;
  }
  return null;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
