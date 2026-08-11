import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health — liveness and readiness in one endpoint.
 *
 * The database round trip is the point: a process that is running but cannot reach
 * Postgres cannot serve a single student page, and reporting it healthy just means the
 * load balancer keeps sending traffic to an instance that will 500. Returns 503 in that
 * case so orchestration takes it out of rotation.
 */
export async function GET() {
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return Response.json(
      {
        status: 'ok',
        database: 'reachable',
        latencyMs: Date.now() - startedAt,
        uptimeSeconds: Math.round(process.uptime()),
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers: { 'cache-control': 'no-store' } },
    );
  } catch (error) {
    console.error('[health] database unreachable', error);

    return Response.json(
      {
        status: 'degraded',
        database: 'unreachable',
        latencyMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      { status: 503, headers: { 'cache-control': 'no-store' } },
    );
  }
}
