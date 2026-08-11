# Deployment

## Requirements

- Node.js 22+, PostgreSQL 16+
- Redis 7+ (optional — enables shared rate limiting across replicas)
- S3-compatible object storage (optional — file uploads and media)

## Environment

Copy `.env.example`. Two variables are genuinely required; everything else enables a
feature and degrades cleanly when absent.

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | **yes** | Include `connection_limit` when running many replicas |
| `AUTH_SECRET` | **yes** | `openssl rand -base64 48`. Rotating it signs out everyone. |
| `NEXT_PUBLIC_SITE_URL` | yes in production | Canonical URLs, sitemap, payment return URLs |
| `REDIS_URL` | no | Shared cache and rate limits |
| `ANTHROPIC_API_KEY` | no | Without it, AI features use the offline responder |
| `STRIPE_SECRET_KEY` etc. | no | Without them, payments settle locally |
| `S3_*` | no | Without them, uploads are declared rather than stored |
| `SMTP_*` | no | Without them, notifications are in-app only |

`src/lib/env.ts` validates at boot and fails loudly on a missing required variable, except
during `next build`, where it falls back so the build does not need production credentials.

## Docker

```bash
docker compose up -d db redis
docker compose --profile tools run --rm migrate    # migrate + seed
AUTH_SECRET="$(openssl rand -base64 48)" docker compose up --build app
```

The image is multi-stage and runs as an unprivileged user with a read-only root filesystem.
`output: 'standalone'` traces only the modules the server needs, taking the runtime image
from roughly 1.2 GB to about 200 MB.

## Kubernetes

```bash
kubectl -n rumax create secret generic rumax-secrets \
  --from-literal=DATABASE_URL='postgresql://…' \
  --from-literal=AUTH_SECRET="$(openssl rand -base64 48)" \
  --from-literal=REDIS_URL='redis://…'

kubectl apply -f k8s/
```

`k8s/deployment.yaml` provides the namespace, config, deployment, service, HPA, pod
disruption budget, migration job and ingress.

Two probe decisions are worth knowing:

- **Startup probe before liveness.** A cold start loading the Prisma engine can exceed a
  liveness threshold; killing a pod that is merely slow to boot produces a restart loop
  that looks like a crash.
- **Liveness hits a static asset, readiness hits `/api/health`.** A database outage should
  drain traffic from every pod (readiness fails) but must not restart the entire fleet — a
  recoverable outage would become a fleet-wide cold start at exactly the wrong moment.

`maxUnavailable: 0` means a deploy never reduces capacity.

## Migrations

Development uses `prisma db push`. Any deployment uses migrations:

```bash
npx prisma migrate dev --name descriptive_change   # author
npx prisma migrate deploy                          # release step
```

The `rumax-migrate` Job runs before new pods take traffic. Additive migrations are safe
during a rolling deploy; destructive ones need the expand/contract pattern — add the new
column, deploy code writing both, backfill, deploy code reading the new one, then drop.

## Pre-launch checklist

Do not skip these. Each corresponds to something that is deliberately convenient in the
demonstration build.

- [ ] **Remove the demo account panel** from `src/app/(auth)/login/login-form.tsx`.
- [ ] **Do not run `db:seed`** against production — it deletes everything first.
- [ ] Generate a fresh `AUTH_SECRET`; never reuse one across environments.
- [ ] Change or delete every seeded account, including `admin@rumax.edu`.
- [ ] Set real values in `k8s/deployment.yaml`'s Secret, or create it out of band.
- [ ] Put PgBouncer in front of Postgres in transaction mode.
- [ ] Configure S3 and wire pre-signed uploads before accepting real documents; virus-scan
      on the way in.
- [ ] Implement payment webhooks before taking real money — without them, redirect-based
      payments stay `PENDING`.
- [ ] Swap the in-process rate limiter for the Redis implementation.
- [ ] Set up automated backups with a **tested** restore, not just a scheduled dump.
- [ ] Point error reporting at a real service; `console.error` is not monitoring.
- [ ] Tighten `script-src` to a nonce-based CSP.
- [ ] Run the accessibility audit and publish the result on `/accessibility`.

## Backups and recovery

Academic records must survive 40 years. Nightly full plus continuous WAL archiving to
object storage in a different region; monthly restore drill into a scratch database with
row-count verification. A backup nobody has restored is a hypothesis, not a backup.

Recovery targets: RPO 5 minutes (WAL shipping), RTO 1 hour (restore plus replica promotion).

## Monitoring

Watch, in order of how much they tell you:

1. `/api/health` latency and status across replicas.
2. Postgres connection-pool saturation — the first thing to break under load.
3. 5xx rate by route.
4. Auth failure rate — a spike is credential stuffing.
5. Queue depth once background work exists.
6. Certificate verification volume — a spike is either good publicity or scraping.

## CI/CD

`.github/workflows/ci.yml` runs on every push and pull request: install, Prisma generate,
schema push against a Postgres service, typecheck, lint, unit tests, seed, production
build, then a smoke test that starts the server and asserts the home page renders, the
seeded certificate verifies, the portals redirect anonymous visitors, and GraphQL responds.
A separate job builds the container image and asserts it reports **503** when the database
is unreachable — proving the health check is meaningful rather than always green.
