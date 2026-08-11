import { describe, expect, it } from 'vitest';

import {
  aggregateScore,
  auditDegree,
  calculateCgpa,
  classify,
  gradePointFor,
  isPass,
  letterFor,
  MAX_CREDITS_PER_TERM,
  onProbation,
  prerequisitesMet,
  validateRegistrationLoad,
} from '@/lib/grading';

describe('letterFor', () => {
  it('maps each band to its letter', () => {
    expect(letterFor(95)).toBe('A+');
    expect(letterFor(90)).toBe('A+');
    expect(letterFor(89)).toBe('A');
    expect(letterFor(80)).toBe('A-');
    expect(letterFor(70)).toBe('B');
    expect(letterFor(50)).toBe('C-');
    expect(letterFor(49)).toBe('D');
    expect(letterFor(44)).toBe('F');
    expect(letterFor(0)).toBe('F');
  });

  it('treats the boundary as inclusive of the higher band', () => {
    // A student on exactly 50 has passed; this boundary decides degree outcomes.
    expect(letterFor(50)).toBe('C-');
    expect(isPass(50)).toBe(true);
    expect(isPass(49.9)).toBe(false);
  });
});

describe('gradePointFor', () => {
  it('returns the 4.0-scale point for a mark', () => {
    expect(gradePointFor(92)).toBe(4.0);
    expect(gradePointFor(72)).toBe(3.0);
    expect(gradePointFor(30)).toBe(0);
  });
});

describe('calculateCgpa', () => {
  it('weights by credits rather than averaging grade points', () => {
    // 20 credits at 4.0 and 10 credits at 1.0 → (80 + 10) / 30 = 3.0, not 2.5.
    const cgpa = calculateCgpa([
      { credits: 20, score: 92 },
      { credits: 10, score: 46 },
    ]);
    expect(cgpa).toBe(3);
  });

  it('ignores zero-credit courses', () => {
    const withAudit = calculateCgpa([
      { credits: 15, score: 75 },
      { credits: 0, score: 10 },
    ]);
    expect(withAudit).toBe(gradePointFor(75));
  });

  it('returns 0 when there is nothing creditable', () => {
    expect(calculateCgpa([])).toBe(0);
    expect(calculateCgpa([{ credits: 0, score: 90 }])).toBe(0);
  });

  it('counts failed courses in the average', () => {
    // A fail must drag the CGPA down — otherwise failing and not taking a course
    // would be equivalent, which they are not.
    const withFail = calculateCgpa([
      { credits: 15, score: 80 },
      { credits: 15, score: 20 },
    ]);
    expect(withFail).toBeLessThan(gradePointFor(80));
  });
});

describe('classify', () => {
  it('maps CGPA to a degree classification', () => {
    expect(classify(3.9)).toBe('First Class');
    expect(classify(3.7)).toBe('First Class');
    expect(classify(3.4)).toBe('Second Class (Upper Division)');
    expect(classify(2.8)).toBe('Second Class (Lower Division)');
    expect(classify(2.1)).toBe('Third Class');
    expect(classify(1.8)).toBe('Pass');
    expect(classify(1.2)).toBe('Fail');
  });
});

describe('onProbation', () => {
  it('does not place a student on probation before a full term of results', () => {
    expect(onProbation(1.2, 6)).toBe(false);
    expect(onProbation(1.2, 12)).toBe(true);
  });

  it('leaves a student above the threshold alone', () => {
    expect(onProbation(2.0, 60)).toBe(false);
  });
});

describe('aggregateScore', () => {
  it('normalises by the weight actually assessed so far', () => {
    // Only 30% of the course has been assessed; a student at 80% on it should show 80,
    // not 24 — a mid-term running mark must be meaningful.
    expect(aggregateScore([{ score: 80, weight: 0.3 }])).toBe(80);
  });

  it('combines components proportionally', () => {
    expect(
      aggregateScore([
        { score: 90, weight: 0.5 },
        { score: 50, weight: 0.5 },
      ]),
    ).toBe(70);
  });

  it('returns 0 with no components rather than dividing by zero', () => {
    expect(aggregateScore([])).toBe(0);
  });
});

describe('prerequisitesMet', () => {
  it('reports exactly which prerequisites are missing', () => {
    const result = prerequisitesMet(['CS101', 'CS201'], ['CS101']);
    expect(result.met).toBe(false);
    expect(result.missing).toEqual(['CS201']);
  });

  it('passes when there are no prerequisites', () => {
    expect(prerequisitesMet([], []).met).toBe(true);
  });
});

describe('validateRegistrationLoad', () => {
  it('rejects an overload', () => {
    expect(validateRegistrationLoad(MAX_CREDITS_PER_TERM + 1)).toContain('maximum');
  });

  it('rejects an underload for a registering student', () => {
    expect(validateRegistrationLoad(6)).toContain('at least');
  });

  it('accepts a normal load and an empty basket', () => {
    expect(validateRegistrationLoad(15)).toBeNull();
    expect(validateRegistrationLoad(0)).toBeNull();
  });
});

describe('auditDegree', () => {
  const base = {
    requiredCredits: 60,
    completed: [
      { credits: 30, score: 75 },
      { credits: 30, score: 68 },
    ],
    inProgressCredits: 0,
    outstandingCoreCourses: [],
    feesCleared: true,
  };

  it('clears a student who has met every requirement', () => {
    const audit = auditDegree(base);
    expect(audit.earnedCredits).toBe(60);
    expect(audit.percentComplete).toBe(100);
    expect(audit.eligibleToGraduate).toBe(true);
    expect(audit.outstandingRequirements).toEqual([]);
  });

  it('blocks graduation on an outstanding fee balance', () => {
    const audit = auditDegree({ ...base, feesCleared: false });
    expect(audit.eligibleToGraduate).toBe(false);
    expect(audit.outstandingRequirements).toContain('Outstanding tuition balance');
  });

  it('blocks graduation on an unpassed core course and names it', () => {
    const audit = auditDegree({ ...base, outstandingCoreCourses: ['CS201 Data Structures'] });
    expect(audit.eligibleToGraduate).toBe(false);
    expect(audit.outstandingRequirements).toContain('Core course not passed: CS201 Data Structures');
  });

  it('excludes failed courses from earned credits but keeps them in the CGPA', () => {
    const audit = auditDegree({
      ...base,
      completed: [
        { credits: 30, score: 75 },
        { credits: 30, score: 40 },
      ],
    });
    expect(audit.earnedCredits).toBe(30);
    expect(audit.remainingCredits).toBe(30);
    expect(audit.cgpa).toBeLessThan(gradePointFor(75));
  });

  it('never reports more than 100% complete', () => {
    const audit = auditDegree({ ...base, requiredCredits: 30 });
    expect(audit.percentComplete).toBe(100);
  });
});
