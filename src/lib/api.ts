import 'server-only';

import { NextResponse } from 'next/server';
import { ZodError, type ZodTypeAny, type output } from 'zod';

import { AuthError } from './auth';
import { prisma } from './db';

export type ApiError = {
  error: { code: string; message: string; details?: unknown };
};

export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, { status: 200, ...init });
}

export function created<T>(data: T): NextResponse {
  return NextResponse.json(data, { status: 201 });
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export function fail(code: string, message: string, status: number, details?: unknown) {
  return NextResponse.json<ApiError>({ error: { code, message, details } }, { status });
}

/**
 * Converts anything thrown inside a route handler into a consistent JSON error.
 * Unexpected errors are logged server-side and reported to the caller without their
 * message, so internal details (SQL, file paths) never reach the client.
 */
export function handleError(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return fail(error.status === 401 ? 'unauthenticated' : 'forbidden', error.message, error.status);
  }
  if (error instanceof ZodError) {
    return fail('validation_failed', 'Some fields need attention.', 422, error.flatten().fieldErrors);
  }
  if (error instanceof HttpError) {
    return fail(error.code, error.message, error.status, error.details);
  }
  console.error('[api] unhandled error', error);
  return fail('internal_error', 'Something went wrong on our side.', 500);
}

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new HttpError(400, 'bad_request', message, details);
export const notFound = (what = 'Resource') => new HttpError(404, 'not_found', `${what} not found.`);
export const conflict = (message: string) => new HttpError(409, 'conflict', message);

/**
 * Parse and validate a JSON body, throwing a ZodError that `handleError` renders.
 *
 * The return type is the schema's *output*, so fields carrying `.default()` are
 * non-optional to callers — which is the whole point of declaring a default.
 */
export async function parseBody<S extends ZodTypeAny>(
  request: Request,
  schema: S,
): Promise<output<S>> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    throw badRequest('Request body must be valid JSON.');
  }
  return schema.parse(json);
}

export function parseQuery<S extends ZodTypeAny>(request: Request, schema: S): output<S> {
  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  return schema.parse(params);
}

/**
 * Fixed-window rate limiter.
 *
 * In-process by design: it protects a single instance and is enough for development
 * and small deployments. Behind more than one replica, point `REDIS_URL` at a Redis
 * instance and swap this for the shared implementation described in docs/SECURITY.md.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

export function rateLimitOrThrow(key: string, limit: number, windowMs: number): void {
  if (!rateLimit(key, limit, windowMs)) {
    throw new HttpError(429, 'rate_limited', 'Too many requests. Please slow down.');
  }
}

/** Append an audit trail entry. Never throws — auditing must not break the request. */
export async function audit(entry: {
  userId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ip?: string | null;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        metadata: entry.metadata as never,
        ip: entry.ip ?? null,
      },
    });
  } catch (error) {
    console.error('[audit] failed to record entry', entry.action, error);
  }
}

/** Standard pagination contract shared by every list endpoint. */
export function paginate(searchParams: URLSearchParams, defaultSize = 20) {
  const page = Math.max(1, Number(searchParams.get('page') ?? 1) || 1);
  const size = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') ?? defaultSize) || defaultSize));
  return { page, pageSize: size, skip: (page - 1) * size, take: size };
}

export function pageMeta(total: number, page: number, pageSize: number) {
  return { total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
}
