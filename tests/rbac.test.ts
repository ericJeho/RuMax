import { describe, expect, it } from 'vitest';
import type { Role } from '@prisma/client';

import { PERMISSIONS, ROLE_LABELS, can, canAny, homeFor, permissionsFor } from '@/lib/rbac';
import { passwordProblems } from '@/lib/password';

const ROLES: Role[] = ['APPLICANT', 'STUDENT', 'ALUMNI', 'LECTURER', 'REGISTRAR', 'FINANCE', 'ADMIN'];

describe('permission matrix', () => {
  it('gives an administrator every permission', () => {
    for (const permission of PERMISSIONS) {
      expect(can('ADMIN', permission)).toBe(true);
    }
  });

  it('never lets a student read another student’s grades or change settings', () => {
    expect(can('STUDENT', 'grade:read:self')).toBe(true);
    expect(can('STUDENT', 'grade:read:any')).toBe(false);
    expect(can('STUDENT', 'grade:publish')).toBe(false);
    expect(can('STUDENT', 'settings:write')).toBe(false);
    expect(can('STUDENT', 'student:write')).toBe(false);
    expect(can('STUDENT', 'finance:write')).toBe(false);
    expect(can('STUDENT', 'audit:read')).toBe(false);
  });

  it('does not let a lecturer touch finance or system settings', () => {
    expect(can('LECTURER', 'assignment:grade')).toBe(true);
    expect(can('LECTURER', 'finance:write')).toBe(false);
    expect(can('LECTURER', 'settings:write')).toBe(false);
    expect(can('LECTURER', 'audit:read')).toBe(false);
  });

  it('confines a finance officer to money and read-only student data', () => {
    expect(can('FINANCE', 'finance:write')).toBe(true);
    expect(can('FINANCE', 'student:read')).toBe(true);
    expect(can('FINANCE', 'student:write')).toBe(false);
    expect(can('FINANCE', 'grade:publish')).toBe(false);
    expect(can('FINANCE', 'course:write')).toBe(false);
  });

  it('gives an applicant nothing beyond applying', () => {
    expect(permissionsFor('APPLICANT')).toEqual(['application:create']);
  });

  it('leaves an alumnus able to read their own record but not to submit work', () => {
    expect(can('ALUMNI', 'grade:read:self')).toBe(true);
    expect(can('ALUMNI', 'submission:create')).toBe(false);
    expect(can('ALUMNI', 'registration:create')).toBe(false);
  });

  it('only ever grants permissions that exist in the catalogue', () => {
    for (const role of ROLES) {
      for (const permission of permissionsFor(role)) {
        expect(PERMISSIONS).toContain(permission);
      }
    }
  });

  it('canAny is true when at least one permission is held', () => {
    expect(canAny('LECTURER', 'finance:write', 'assignment:grade')).toBe(true);
    expect(canAny('STUDENT', 'finance:write', 'settings:write')).toBe(false);
  });
});

describe('homeFor', () => {
  it('routes every role to the portal it belongs in', () => {
    expect(homeFor('STUDENT')).toBe('/portal');
    expect(homeFor('ALUMNI')).toBe('/portal');
    expect(homeFor('LECTURER')).toBe('/lecturer');
    expect(homeFor('ADMIN')).toBe('/admin');
    expect(homeFor('REGISTRAR')).toBe('/admin');
    expect(homeFor('FINANCE')).toBe('/admin');
    expect(homeFor('APPLICANT')).toBe('/apply/status');
  });
});

describe('ROLE_LABELS', () => {
  it('has a human label for every role', () => {
    for (const role of ROLES) {
      expect(ROLE_LABELS[role]).toBeTruthy();
    }
  });
});

describe('passwordProblems', () => {
  it('accepts a password that meets every rule', () => {
    expect(passwordProblems('Str0ng#Passphrase')).toEqual([]);
  });

  it('reports every unmet rule at once rather than one per attempt', () => {
    const problems = passwordProblems('short');
    expect(problems.length).toBeGreaterThan(1);
    expect(problems).toContain('Use at least 10 characters');
    expect(problems).toContain('Include an uppercase letter');
    expect(problems).toContain('Include a number');
    expect(problems).toContain('Include a symbol');
  });

  it('rejects a long password that is missing a character class', () => {
    expect(passwordProblems('alllowercaseletters')).toContain('Include an uppercase letter');
    expect(passwordProblems('ALLUPPERCASE1!')).toContain('Include a lowercase letter');
  });
});
