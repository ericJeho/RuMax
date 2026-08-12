# Running RuMax on Supabase

Supabase gives you a hosted Postgres on a free tier, which is the quickest way to get the
platform running somewhere you can actually use it. Roughly ten minutes start to finish.

Supabase is used here **as a Postgres database only**. The platform has its own
authentication (JWT with server-side revocable sessions) and its own authorisation model,
so Supabase Auth, RLS policies and the PostgREST API are not involved. That is a
deliberate choice — see [Why not Supabase Auth](#why-not-supabase-auth) below.

---

## 1. Create the project

1. Sign in at [supabase.com](https://supabase.com) → **New project**.
2. Give it a name, set a **database password** (save it — you cannot read it back later),
   and pick the region closest to you.
3. Wait for provisioning, about two minutes.

## 2. Get both connection strings

**Project settings → Database → Connection string.** You need two of them, and using the
wrong one for the wrong job is the single most common way this goes wrong.

| Variable | Which string | Port | Used by |
| --- | --- | --- | --- |
| `DATABASE_URL` | **Transaction pooler** | 6543 | The running application |
| `DIRECT_URL` | **Session pooler** | 5432 | `prisma migrate` only |

Replace `[YOUR-PASSWORD]` in both with the password you set, and **append the pooler flags
to `DATABASE_URL`**:

```bash
DATABASE_URL="postgresql://postgres.abcdefgh:PASSWORD@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.abcdefgh:PASSWORD@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"
```

### Why two, and why those flags

- **`?pgbouncer=true`** stops Prisma using prepared statements. A transaction pooler hands
  each query a different backend connection, so a prepared statement created on one is not
  there on the next. Without this flag the app works fine under light use and then fails
  under load with `prepared statement "s0" already exists` — an intermittent failure that
  is genuinely unpleasant to diagnose.
- **`connection_limit=1`** keeps each serverless instance to one connection. The pooler is
  doing the pooling; a second layer of it inside Prisma just exhausts the quota faster.
- **`DIRECT_URL` must not be pooled.** Migrations take a Postgres advisory lock and run DDL
  that a transaction pooler cannot carry. Point it at the pooler and `prisma migrate` will
  **hang** rather than error, which is why `npm run setup` explicitly checks for it.

> If you see a **direct connection** string offering port 5432 on `db.<ref>.supabase.co`,
> that works too — but it is IPv6-only on newer projects, so it will fail from an IPv4-only
> network or CI runner. The **Session pooler** is the IPv4-friendly equivalent and is the
> safer default.

## 3. Configure and run

```bash
cp .env.example .env.local
```

Set `DATABASE_URL`, `DIRECT_URL`, and generate an auth secret:

```bash
openssl rand -base64 48      # paste into AUTH_SECRET
```

Then:

```bash
npm install
npm run setup                # checks config, applies migrations, seeds
npm run dev                  # http://localhost:3000
```

`npm run setup` validates the connection strings *before* touching the database and names
the specific mistake if something is off, rather than letting Prisma fail obscurely.

To apply the schema without loading demonstration data, use `npm run setup -- --no-seed`.

> **The seed deletes everything first.** It is for demonstration databases. Never run it
> against a project holding real records.

## 4. Sign in

Every seeded account uses the password **`RuMax#Demo2025`**.

| Email | What you will see |
| --- | --- |
| `student@rumax.edu` | Courses, assignments, a quiz that marks itself, grades, transcript, fees |
| `lecturer@rumax.edu` | Course builder, marking queue, quiz builder, gradebook, analytics |
| `registrar@rumax.edu` | Admissions review, registrations, student records |
| `admin@rumax.edu` | The full administration ERP, audit log, permissions |

Verify a credential at `/verify` with serial **`RX-2025-DEMO-0001`** — no sign-in needed.

---

## The anon key, and why one migration exists only for Supabase

Read this once even if you skip the rest. It is the one place where Supabase's defaults and
Prisma's defaults compose into a hole.

Supabase grants the `anon` and `authenticated` roles full DML on every table in the
`public` schema, and sets matching default privileges so anything created later is granted
the same way. Prisma creates its tables in `public`, and PostgreSQL leaves row level
security off unless asked. Neither default is wrong on its own.

Together they mean the project's **anon key is a full read/write credential for the entire
university database** — password hashes, grades, invoices, applications, the audit log —
reachable over PostgREST at `https://<ref>.supabase.co/rest/v1/<Table>`. That key is public
by design: it ships in client bundles and is printed in your dashboard. PostgREST never
sees the application's session, its role matrix, or its audit trail, so every control in
`src/lib/rbac.ts` is bypassed by construction.

This was measured, not assumed. On a fresh Supabase project, a table created exactly the
way Prisma creates them granted `anon` SELECT, INSERT, UPDATE, DELETE and TRUNCATE, and the
project's own security advisor reported it as `EXTERNAL` facing.

`prisma/migrations/20260812035600_supabase_revoke_postgrest_access` closes it, and runs
automatically as part of `npm run setup` or `npx prisma migrate deploy`. It applies two
independent controls:

1. **No privileges.** `anon` and `authenticated` are revoked everything in `public`, and
   the default privileges for the `postgres` role are revoked too, so tables added by
   future migrations are not granted either.
2. **RLS on, with no policies.** If something ever re-grants table access — a later
   migration, a dashboard action — row level security still denies those roles every row.
   Prisma is unaffected: it connects as the table owner, and PostgreSQL exempts owners from
   RLS unless `FORCE ROW LEVEL SECURITY` is set.

The whole migration is guarded on the `anon` role existing, so on plain PostgreSQL — local
development, Docker Compose, CI — it is a no-op. That guard is also why RLS is enabled only
inside it: on a self-hosted database the application may legitimately connect as a role
that is *not* the table owner, and enabling RLS there would deny it everything.

The deliberate consequence is that **PostgREST, the Supabase client libraries and the
auto-generated GraphQL endpoint will not work against this schema.** That is the intent, not
a regression. The application talks to Postgres directly through Prisma; see
[Why not Supabase Auth](#why-not-supabase-auth) below.

A table added by a later migration inherits control 1 automatically but not control 2. That
is safe — with no grants the table is not exposed at all, and the security advisor reports
nothing for it — but if you want the backstop as well, add
`ALTER TABLE "YourTable" ENABLE ROW LEVEL SECURITY;` to that migration.

**What the advisor will say afterwards.** Expect `rls_enabled_no_policy` at INFO level for
every table, and no `rls_disabled_in_public` at all. That is the intended end state: RLS on
with no policies means those roles match no rows. Do not "fix" it by adding permissive
policies — that would undo the control.

---

## Deploying to Vercel

Set the same variables in **Project settings → Environment variables**:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Transaction pooler string with `?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | Session pooler string |
| `AUTH_SECRET` | A fresh 48-byte random value — not the one from your laptop |
| `NEXT_PUBLIC_SITE_URL` | `https://your-app.vercel.app` |

The build runs `prisma generate && next build`. Apply migrations as a separate step rather
than during the build — a build that migrates will race itself across concurrent
deployments:

```bash
npx prisma migrate deploy
```

`connection_limit=1` matters more on Vercel than anywhere else: every serverless invocation
is its own process, and without it a traffic spike will exhaust the Supabase connection
quota.

---

## Troubleshooting

**`prisma migrate` hangs and never completes.**
`DIRECT_URL` is pointing at the transaction pooler (port 6543). Use the port 5432 string.

**`prepared statement "s0" already exists`.**
`?pgbouncer=true` is missing from `DATABASE_URL`.

**`Can't reach database server` from CI but it works locally.**
You are using the IPv6-only direct connection (`db.<ref>.supabase.co`). Switch to the
Session pooler.

**`Environment variable not found: DIRECT_URL`.**
Prisma has no fallback for it. Set it — to `DATABASE_URL` if there is no pooler.

**`too many connections for role`.**
Add `connection_limit=1` to `DATABASE_URL`, and check that nothing else is holding
connections open against the project.

**The project is paused.**
Supabase pauses free-tier projects after a week of inactivity. Resume it from the
dashboard; no data is lost.

---

## Why not Supabase Auth

Supabase Auth is good, and using it would be reasonable for a greenfield application. It
was not adopted here because the platform's authorisation model does not fit it cleanly:

- **Seven roles with a permission matrix**, enforced per route handler and rendered at
  `/admin/permissions`. Mapping that onto RLS policies would split one comprehensible
  matrix across two systems that have to agree.
- **Server-side session revocation.** Suspending a student or changing their role must take
  effect immediately, not when a token expires. The `Session` table exists for that.
- **The audit trail** must record who did what against the same user record the academic
  data hangs off.

Splitting identity across two systems would make each of those harder to reason about, and
security controls you cannot reason about are the ones that fail. Supabase is therefore
used for what it is unambiguously excellent at here: a well-run Postgres.

Nothing prevents adopting Supabase Auth later — it would mean adding a provider to the auth
layer in `src/lib/auth.ts` rather than restructuring the application.
