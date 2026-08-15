import { z } from 'zod';

import { audit, badRequest, conflict, handleError, notFound, ok, parseBody } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { can, canAssignRole, isStaff } from '@/lib/rbac';

/**
 * Fields a registrar may correct on a student record.
 *
 * Deliberately narrow. Names, contact details and demographics are the things that are
 * routinely wrong — a misspelling at application time follows a student onto their degree
 * certificate — and correcting them is ordinary registry work.
 *
 * `role` is here because staff records are managed through the same screen, and it is the
 * one field whose change is an authority decision rather than a clerical one. It is
 * checked separately below.
 */
const schema = z.object({
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  country: z.string().trim().max(80).nullable().optional(),
  gender: z.string().trim().max(40).nullable().optional(),
  dateOfBirth: z.string().datetime().nullable().optional(),
  studentNumber: z.string().trim().max(20).nullable().optional(),
  programId: z.string().trim().nullable().optional(),
  yearOfStudy: z.coerce.number().int().min(1).max(8).nullable().optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED', 'GRADUATED', 'WITHDRAWN']).optional(),
  role: z.enum(['APPLICANT', 'STUDENT', 'ALUMNI', 'LECTURER', 'REGISTRAR', 'FINANCE', 'ADMIN']).optional(),
  /** Why the record was changed. Required — see below. */
  reason: z.string().trim().min(3).max(500),
});

/**
 * PATCH /api/students/:id — correct a student or staff record.
 *
 * A reason is mandatory. Changing someone's legal name, programme or status is exactly the
 * kind of edit that gets questioned months later, and an audit entry saying only "record
 * updated" cannot answer the question. The reason is stored on the audit entry alongside
 * the before and after values of every field that actually changed.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireUser();
    const { id } = await params;
    const body = await parseBody(request, schema);

    const subject = await prisma.user.findUnique({ where: { id } });
    if (!subject) throw notFound('User');

    // Editing a staff record needs staff:write; editing a student needs student:write.
    const needed = isStaff(subject.role) ? 'staff:write' : 'student:write';
    if (!can(actor.role, needed)) {
      throw badRequest(`Your role cannot edit ${isStaff(subject.role) ? 'staff' : 'student'} records.`);
    }

    const { reason, role: nextRole, dateOfBirth, ...rest } = body;

    if (nextRole && nextRole !== subject.role) {
      if (!canAssignRole(actor.role, nextRole)) {
        throw badRequest('Only an administrator may assign the administrator role.');
      }

      // Losing the last administrator locks everyone out of the settings and permissions
      // screens with no way back in through the application. It has happened once already
      // on this deployment, via admissions rather than this endpoint.
      if (subject.role === 'ADMIN' && nextRole !== 'ADMIN') {
        const admins = await prisma.user.count({ where: { role: 'ADMIN' } });
        if (admins <= 1) {
          throw conflict('This is the only administrator account. Promote another before changing this one.');
        }
      }
    }

    if (rest.email && rest.email !== subject.email) {
      const taken = await prisma.user.findUnique({ where: { email: rest.email }, select: { id: true } });
      if (taken) throw conflict('Another account already uses that email address.');
    }

    if (rest.studentNumber) {
      const taken = await prisma.user.findFirst({
        where: { studentNumber: rest.studentNumber, NOT: { id } },
        select: { id: true },
      });
      if (taken) throw conflict('Another student already has that student number.');
    }

    if (rest.programId) {
      const program = await prisma.program.findUnique({ where: { id: rest.programId }, select: { id: true } });
      if (!program) throw badRequest('That programme does not exist.');
    }

    const data = {
      ...rest,
      ...(nextRole ? { role: nextRole } : {}),
      ...(dateOfBirth !== undefined
        ? { dateOfBirth: dateOfBirth === null ? null : new Date(dateOfBirth) }
        : {}),
    };

    // Record only what actually changed. An audit entry listing every field on the form,
    // most of them unchanged, is noise that hides the one edit someone is looking for.
    const changes: Record<string, { from: unknown; to: unknown }> = {};
    for (const [field, value] of Object.entries(data)) {
      const before = subject[field as keyof typeof subject];
      const normalise = (v: unknown) => (v instanceof Date ? v.toISOString() : v);
      if (normalise(before) !== normalise(value)) {
        changes[field] = { from: normalise(before) ?? null, to: normalise(value) ?? null };
      }
    }

    if (Object.keys(changes).length === 0) {
      return ok({ id: subject.id, changed: [] });
    }

    const updated = await prisma.user.update({ where: { id }, data });

    await audit({
      userId: actor.id,
      action: 'user.update',
      entityType: 'User',
      entityId: id,
      metadata: { reason, changes, subjectEmail: subject.email },
    });

    return ok({
      id: updated.id,
      changed: Object.keys(changes),
      firstName: updated.firstName,
      lastName: updated.lastName,
      email: updated.email,
      role: updated.role,
      status: updated.status,
    });
  } catch (error) {
    return handleError(error);
  }
}
