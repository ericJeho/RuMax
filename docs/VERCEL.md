# Deploying to Vercel

This is the hosted path: Vercel runs the Next.js app, Supabase (or any managed Postgres)
holds the data, and the Anthropic integration supplies the AI credential. For the
self-hosted paths — Docker and Kubernetes — see [DEPLOYMENT.md](DEPLOYMENT.md). For
setting the database up in the first place, see [SUPABASE.md](SUPABASE.md).

Nothing below needs the Vercel CLI. The whole flow is the dashboard plus one migration
command run from a machine that can reach the database.

## 1. Import the repository

**Add New → Project → Import Git Repository**, pick this repo, and leave the framework
preset on **Next.js**.

Do not press Deploy yet. The first build will fail without `DATABASE_URL` and
`AUTH_SECRET` — `src/lib/env.ts` substitutes placeholders during `next build` so the build
itself survives, but every request afterwards throws. Set the variables first.

The repository already carries what the platform reads:

| File | What it does |
| --- | --- |
| `vercel.json` | Pins the framework and the execution region |
| `.vercelignore` | Keeps the Docker/Kubernetes/docs files out of the upload |
| `package.json` `build` | `prisma generate && next build` — Prisma's client is generated on every build, which matters because Vercel restores a cached `node_modules` and so does not re-run `postinstall` |

## 2. Set the environment variables

**Project settings → Environment variables.** Two are genuinely required; the rest switch
on a feature and degrade cleanly when absent (`src/lib/env.ts` is the authority).

| Variable | Required | Value |
| --- | --- | --- |
| `DATABASE_URL` | **yes** | Transaction pooler string, port 6543, with `?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | **yes** | Session pooler string, port 5432 — migrations only |
| `AUTH_SECRET` | **yes** | A fresh value from `openssl rand -base64 48`, not the one on your laptop |
| `NEXT_PUBLIC_SITE_URL` | in production | `https://your-app.vercel.app`, or the custom domain once it resolves |
| `ANTHROPIC_API_KEY` | no | Supplied by the integration in step 3 |
| everything else | no | See [`.env.example`](../.env.example) |

`connection_limit=1` is not optional advice on Vercel. Every serverless invocation is its
own process with its own Prisma pool, so a traffic spike without it exhausts the database's
connection quota long before it exhausts anything on Vercel.

`NEXT_PUBLIC_SITE_URL` is inlined at build time, so preview deployments built before the
production domain existed will render canonical URLs pointing at production. That is
correct for SEO and wrong for clicking around a preview — set it per-environment if you
test payment redirects on previews, where the return URL has to match the deployment.

## 3. Connect Claude through the Anthropic integration

The AI features — tutor, advisor, quiz builder, feedback drafting — call the Claude
Messages API directly from `src/lib/ai.ts`. They need `ANTHROPIC_API_KEY`; without it every
capability falls back to a deterministic offline responder that labels itself as such in
the UI (`source: 'offline'`), so the platform still demonstrates end to end.

To wire the real thing, install the **Anthropic** integration from the Vercel Marketplace
(**Integrations → Browse Marketplace → Anthropic → Install**) and connect it to this
project. It provisions the key and injects `ANTHROPIC_API_KEY` into the project's
environment, which is the only variable `src/lib/ai.ts` looks for — no code change.

Two things to know:

- **Redeploy after connecting.** Environment variables are bound at build time; an existing
  deployment keeps running in offline mode until it is rebuilt.
- **`ANTHROPIC_MODEL` is yours to set.** It defaults to `claude-sonnet-5`. The integration
  does not set it, and an unrecognised model id fails the API call — which the code
  swallows into an offline reply, so a typo here looks like "the AI stopped working"
  rather than an error. Check the function logs for `[ai] request failed` if that happens.

Bringing your own key from the Anthropic Console works identically: set
`ANTHROPIC_API_KEY` by hand and skip the integration.

## 4. Apply migrations

Migrations do not run during the build, deliberately: concurrent deployments would race
each other, and a failed migration inside a build leaves a half-applied schema with no
clear owner. Run them as their own step, before promoting the deployment:

```bash
DIRECT_URL='postgresql://…:5432/postgres' npx prisma migrate deploy
```

Additive migrations are safe to apply before the new code is live. Destructive ones need
the expand/contract sequence described in [DEPLOYMENT.md](DEPLOYMENT.md#migrations).

Do **not** run `npm run db:seed` against a deployment you care about — it truncates first.

## 5. Deploy and verify

Trigger the deploy, then check, in order:

```bash
curl -s https://your-app.vercel.app/api/health        # {"status":"ok","database":"reachable"}
curl -sI https://your-app.vercel.app/portal           # 307 → /login
```

`/api/health` returning `503` with `"database":"unreachable"` means the app is up and the
database is not — nearly always `DATABASE_URL`. The redirect proves middleware is running
and `AUTH_SECRET` is set.

Then sign in and open the AI Tutor. A live answer is unlabelled; an offline one says so in
its first line.

## Region

`vercel.json` pins `regions: ["dub1"]` (Dublin), chosen to sit near a `eu-west-1` database.
**Change it to the region nearest your database.** This is the single largest latency lever
in the deployment: every page in the portal makes several Prisma round trips, so a function
placed one ocean away from Postgres multiplies that distance by the number of queries. The
region list is in Vercel's docs under Functions → Regions.

## What does not come across from the self-hosted setup

- **Redis.** `REDIS_URL` expects a long-lived connection; a serverless invocation cannot
  hold one usefully. Left unset, rate limiting falls back to an in-process limiter, which
  on Vercel means per-invocation rather than global — weaker than the Kubernetes
  deployment's. Use a HTTP-based store (Vercel KV, Upstash) if you need real distributed
  limits.
- **The health check's role.** On Kubernetes it drives readiness and takes pods out of
  rotation. Vercel has nothing to take out of rotation, so `/api/health` is a manual and
  monitoring probe only.
- **`output: 'standalone'`.** Still set for the container image, but skipped on Vercel
  (see `next.config.ts`) — the platform does its own tracing and discards the standalone
  server, so building it only lengthens the deploy.

## Before real students use it

The pre-launch checklist in [DEPLOYMENT.md](DEPLOYMENT.md#pre-launch-checklist) applies
here unchanged — the demo account panel on the login page and the seeded `admin@rumax.edu`
account are the two that matter most, and neither is hosting-specific.
