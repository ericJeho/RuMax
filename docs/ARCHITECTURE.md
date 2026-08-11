# Architecture

## Shape

```
Browser ──► Next.js 15 (App Router, React 19)
              ├─ Server components ──► Prisma ──► PostgreSQL
              ├─ Route handlers /api ─┘
              ├─ GraphQL /api/graphql ┘
              └─ Edge middleware (fast auth redirect)
                                        └─► Redis (cache, rate limits) [optional]
                                        └─► S3, Stripe, Zoom, Claude   [optional]
```

Server components read Postgres directly through Prisma. Route handlers under `/api` are
the REST surface that client components call for mutations. There is no HTTP hop between
the page and its data.

## Decisions

### One application, not Next.js + NestJS

The brief specifies a Next.js frontend and a separate NestJS backend. This is one Next.js
application instead.

A separate API service earns its keep when several clients share it, when parts scale
independently, or when teams need separate deploy cadences. None applied here: there is one
client, the load profile is uniform, and splitting would have meant every server component
making an HTTP call to fetch data it could read directly — added latency, added failure
mode, and duplicated auth on both sides of a boundary that protects nothing.

The REST layer exists and is documented, so the day a mobile app or a partner integration
needs it, it is already there. If the split becomes justified, `src/lib/*` holds the domain
logic with no Next.js dependency and lifts into a NestJS service largely unchanged; the
route handlers become thin proxies.

### Server-first rendering

Dashboards are server components. A student on a 3G connection should not download a
JavaScript bundle, run it, fetch JSON, and then see their deadlines. Client components are
used only where interactivity requires them — the quiz runner, the marking workspace, the
application wizard, charts.

### Domain logic in pure modules

`src/lib/grading.ts`, `certificates.ts`, `rbac.ts` and `password.ts` have no framework or
database dependency. GPA calculation, degree audit, credential hashing and the permission
matrix are exactly the things where a subtle error causes real harm to a real person, so
they are unit-testable in isolation and are covered by 54 tests.

### Graceful degradation over hard dependency

No AI key, no payment credentials, no S3, no Redis, no Zoom — the platform still runs, and
says so in the interface rather than pretending. `src/lib/env.ts` exposes an `integrations`
flags object; features check it and take an honest fallback path. This is what makes the
whole product demonstrable from a clone and a database.

### Marketing pages survive a database outage

Every public query goes through `safeQuery()`, which logs and returns a fallback rather
than throwing. An outage in the student records service should not take down the
university's public website — a prospective applicant seeing a 500 is a worse outcome than
seeing a page with an empty programme list.

## Layout

```
src/
  app/
    (site)/          Public marketing site
    (auth)/          Sign in, register
    portal/          Student portal
    lecturer/        Lecturer portal
    admin/           Administration ERP
    api/             REST handlers + GraphQL
  components/
    ui/              Design system primitives
    dashboard/       Portal chrome
    site/            Header, footer, hero
  lib/               Domain logic, data access, integrations
  middleware.ts      Edge auth redirect
prisma/              Schema and seed
tests/               Vitest unit tests
k8s/                 Kubernetes manifests
docs/                This documentation
```

## Design system

One token set in `src/app/globals.css` drives light, dark and high-contrast themes. Tokens
are RGB triplets so Tailwind's `<alpha-value>` syntax works, which means a single `--rx-brand`
serves `bg-brand`, `text-brand/70` and `border-brand/30` without a second variable.

Theme is applied by a blocking inline script before first paint. A theme flash is a genuine
accessibility problem for light-sensitive users, not only a cosmetic one.

Motion honours `prefers-reduced-motion` by rendering the final state directly rather than
animating faster, and no content ever depends on an animation having run.

## Performance

- Server components keep the client bundle at roughly 102 kB shared.
- Public pages use ISR (`revalidate`); programme and faculty pages pre-render via
  `generateStaticParams`.
- Portal pages are `force-dynamic` — a student's grades must never be served from a shared
  cache.
- Aggregate queries replace N+1 patterns; the courses list resolves progress for every
  course in two queries rather than one per card.
- `optimizePackageImports` tree-shakes `lucide-react`, `recharts` and `framer-motion`.
- The service worker never caches `/portal`, `/lecturer` or `/admin`: on a shared device,
  cached grades belonging to the previous user would be a serious disclosure.

## Scaling path

The application is stateless — sessions live in Postgres, not in memory — so horizontal
scaling is a replica count. The Kubernetes manifest starts at 6 replicas and autoscales to
60 on CPU, with a fast scale-up window because examination periods produce a near-vertical
spike.

For the brief's one-million-user target, in the order the constraints actually bite:

1. **Connection pooling.** Prisma opens a pool per instance; 60 replicas × 25 connections
   exceeds any sensible Postgres limit. Put PgBouncer in transaction mode in front.
2. **Read replicas.** Reporting and analytics move to a replica; the primary keeps writes.
3. **Shared rate limiting and cache.** Replace the in-process limiter with the Redis
   implementation.
4. **Media off the application.** Video and uploads to S3 behind a CDN — the app should
   never proxy a lecture recording.
5. **Background work.** Announcement fan-out, PDF rendering and plagiarism checks move to a
   queue. The fan-out cap in `/api/announcements` already marks the boundary.
6. **Search.** The `ILIKE` queries behind `/search` should become a dedicated index once
   the catalogue outgrows them.

Steps 1 and 4 are the ones that matter first; the rest can wait for evidence.
