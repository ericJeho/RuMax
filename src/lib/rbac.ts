import type { Role } from '@prisma/client';

/**
 * Role-based access control.
 *
 * Permissions are named `<resource>:<action>` and granted per role. Keeping the matrix
 * in one place means the API layer, the navigation and the admin "Role Permissions"
 * screen all read from the same source rather than re-implementing checks.
 */
export const PERMISSIONS = [
  'course:read',
  'course:write',
  'course:publish',
  'lesson:write',
  'assignment:write',
  'assignment:grade',
  'submission:create',
  'quiz:write',
  'quiz:attempt',
  'grade:read:self',
  'grade:read:any',
  'grade:publish',
  'attendance:write',
  'registration:create',
  'registration:approve',
  'application:create',
  'application:review',
  'student:read',
  'student:write',
  'staff:read',
  'staff:write',
  'program:write',
  'finance:read',
  'finance:write',
  'library:borrow',
  'library:manage',
  'research:write',
  'certificate:issue',
  'announcement:write',
  'analytics:read',
  'audit:read',
  'settings:write',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const STUDENT: Permission[] = [
  'course:read',
  'submission:create',
  'quiz:attempt',
  'grade:read:self',
  'registration:create',
  'library:borrow',
];

const LECTURER: Permission[] = [
  'course:read',
  'course:write',
  'course:publish',
  'lesson:write',
  'assignment:write',
  'assignment:grade',
  'quiz:write',
  'grade:read:any',
  'grade:publish',
  'attendance:write',
  'announcement:write',
  'analytics:read',
  'research:write',
  'library:borrow',
];

/**
 * The registrar runs the university's academic operation, so this is the full permission
 * set rather than a subset — records, admissions, curriculum, finance, library, research,
 * certificates and reporting.
 *
 * The boundary between REGISTRAR and ADMIN is therefore no longer a list of permissions.
 * It is enforced where it actually matters, in `canAssignRole` below: only an
 * administrator may create or promote another administrator. Without that, `staff:write`
 * would let a registrar mint themselves an ADMIN account, and the distinction between the
 * two roles would exist only in the labels.
 */
const REGISTRAR: Permission[] = [...PERMISSIONS];

const FINANCE: Permission[] = ['finance:read', 'finance:write', 'student:read', 'analytics:read'];

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  APPLICANT: ['application:create'],
  STUDENT: STUDENT,
  ALUMNI: ['grade:read:self', 'library:borrow'],
  LECTURER: LECTURER,
  REGISTRAR: REGISTRAR,
  FINANCE: FINANCE,
  ADMIN: PERMISSIONS as unknown as Permission[],
};

export function permissionsFor(role: Role): readonly Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function can(role: Role, permission: Permission): boolean {
  return permissionsFor(role).includes(permission);
}

export function canAny(role: Role, ...permissions: Permission[]): boolean {
  return permissions.some((p) => can(role, p));
}

/** Which portal a role lands in after signing in. */
export function homeFor(role: Role): string {
  switch (role) {
    case 'ADMIN':
    case 'REGISTRAR':
    case 'FINANCE':
      return '/admin';
    case 'LECTURER':
      return '/lecturer';
    case 'STUDENT':
    case 'ALUMNI':
      return '/portal';
    default:
      return '/apply/status';
  }
}

/** Roles that operate the institution rather than study at it. */
export const STAFF_ROLES: readonly Role[] = ['LECTURER', 'REGISTRAR', 'FINANCE', 'ADMIN'];

export function isStaff(role: Role): boolean {
  return STAFF_ROLES.includes(role);
}

/**
 * Whether `actor` may set someone's role to `target`.
 *
 * Administrators are the only role that can mint administrators. A registrar holds every
 * permission, including `staff:write`, so without this check the two roles would be
 * indistinguishable in practice — a registrar could create an ADMIN account, sign into it,
 * and the permission matrix at /admin/permissions would be describing a boundary that does
 * not exist.
 *
 * This is deliberately not expressed as a permission. Permissions answer "may this role
 * touch staff records"; this answers "may this role expand its own authority", which is a
 * different question and one that should not be grantable.
 */
export function canAssignRole(actor: Role, target: Role): boolean {
  if (target === 'ADMIN') return actor === 'ADMIN';
  return can(actor, 'staff:write');
}

export const ROLE_LABELS: Record<Role, string> = {
  APPLICANT: 'Applicant',
  STUDENT: 'Student',
  LECTURER: 'Lecturer',
  REGISTRAR: 'Registrar',
  FINANCE: 'Finance Officer',
  ADMIN: 'Administrator',
  ALUMNI: 'Alumnus',
};
