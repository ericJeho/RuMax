# RuMax Global Digital University

**Education Without Borders.**

A working online university platform: public site, admissions, learning management,
examinations, finance, credential verification, and three role-based portals — student,
lecturer and administrator — on one Next.js application with a PostgreSQL record system.

This is a **runnable product**, not a mockup. Sign in as any of six demo roles, register for
courses, sit a proctored quiz that marks itself, pay an invoice, get a mark released, and
verify the resulting certificate from a public URL with no account.

---

## Quick start

Two paths. Both end at `http://localhost:3000` with a fully populated university.

### With Supabase (hosted Postgres, free tier)

The quickest way to get this running somewhere real. Full walkthrough:
[`docs/SUPABASE.md`](docs/SUPABASE.md).

```bash
cp .env.example .env.local
# Set DATABASE_URL (transaction pooler, :6543, with ?pgbouncer=true&connection_limit=1)
#     DIRECT_URL   (session pooler, :5432 — migrations cannot use a pooler)
#     AUTH_SECRET  (openssl rand -base64 48)

npm install
npm run setup      # validates the config, applies migrations, seeds
npm run dev
```

### With local Postgres

```bash
cp .env.example .env.local          # defaults already point at Docker Compose
npm install
docker compose up -d db redis
npm run setup
npm run dev
```

`npm run setup` checks your connection strings *before* touching the database and names the
specific problem if something is wrong — most hosted-Postgres failures otherwise surface as
a hang or an unhelpful stack trace. Add `-- --no-seed` to apply the schema without loading
demonstration data.

> The seed **deletes all existing data** before loading the demonstration university. It is
> for demo databases only.

### Demo accounts

Every seeded account uses the password **`RuMax#Demo2025`**.

| Email | Role | What you can do |
| --- | --- | --- |
| `student@rumax.edu` | Student | Courses, assignments, quizzes, grades, transcript, fees, AI tutor |
| `lecturer@rumax.edu` | Lecturer | Course builder, marking queue, quiz builder, gradebook, analytics |
| `registrar@rumax.edu` | Registrar | Admissions decisions, registrations, student records, certificates |
| `finance@rumax.edu` | Finance | Revenue, arrears, payment reconciliation |
| `admin@rumax.edu` | Administrator | The full ERP, audit log, permissions, settings |
| `applicant@rumax.edu` | Applicant | Application tracking |

Verify a credential at **`/verify`** using serial **`RX-2025-DEMO-0001`** — no sign-in needed.

---

## What is actually built

### Public site
Home, about (history, mission, Vice-Chancellor, leadership, accreditation), faculties and
faculty pages, schools and institutes, the full programme catalogue with filtering and
per-programme pages, admissions, fees, the five-step online application, application
tracking, scholarships, research (projects, publications, funding), digital library with a
citation generator, news, blog, events, campus life, alumni, careers and vacancies,
international students, partners, gallery, contact, FAQs, help desk, global search,
credential verification, and the legal set (privacy, terms, cookies, accessibility,
sitemap).

### Student portal
Dashboard with live deadlines and GPA trend · my courses · the course player with lesson
completion · timetable · assignments with autosaving submission · quizzes and proctored
examinations · grades · printable transcript · attendance · graduation tracker (a real
degree audit) · certificates · course registration with prerequisite enforcement · finance
with multi-provider payment · messages · notifications · discussion forums · digital
library · AI tutor · academic advisor · digital student ID · profile with a GDPR data
export.

### Lecturer portal
Dashboard · my courses with per-student performance and at-risk flags · course builder ·
live sessions · office hours · marking queue with AI-drafted feedback · assignment
authoring · quiz builder with a question bank and proctoring settings · gradebook ·
attendance register · teaching analytics · discussion boards · research and publications ·
messages.

### Administration (ERP)
Institutional dashboard · admissions review with offer gating and atomic enrolment ·
registration approvals · student and staff registers · programmes and courses · academic
calendar · certificates · finance and arrears · scholarships · library · research ·
announcements with audience targeting · CMS · analytics · statutory reports · audit log ·
permission matrix · system settings.

### Platform
JWT auth with server-side revocable sessions, lockout and audit · seven-role RBAC ·
REST API · GraphQL endpoint · PWA with an offline-capable service worker · light, dark and
high-contrast themes · WCAG 2.2 AA accessibility with a per-site toolbar · eight interface
languages · SEO with schema.org, sitemap and robots · Docker, Kubernetes and CI.

---

## Commands

| Command | Purpose |
| --- | --- |
| `npm run setup` | Validate config, apply migrations, seed — start here |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and serve |
| `npm run typecheck` | TypeScript, no emit |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests |
| `npm run db:push` | Push the schema without a migration (development only) |
| `npm run db:deploy` | Apply committed migrations — what a deployment runs |
| `npm run db:migrate` | Create and apply a migration |
| `npm run db:seed` | Load demonstration data |
| `npm run db:reset` | Drop, recreate and reseed |

---

## Architecture in one paragraph

Next.js 15 App Router with React 19 serves both the pages and the API: server components
read Postgres through Prisma directly, and route handlers under `/api` provide the REST
surface the client components call. Authorisation happens three times on purpose — edge
middleware for a fast redirect, the layout for a database-backed session check, and
`requireRole()` inside every route handler, which is the one that actually decides. There
is no separate backend service, which is a deliberate deviation from the brief's
Next.js + NestJS split; the reasoning, and what would justify splitting it out later, is in
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Documentation

| Document | Contents |
| --- | --- |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Structure, decisions taken and rejected, scaling path |
| [`docs/DATA-MODEL.md`](docs/DATA-MODEL.md) | ER diagram and every table explained |
| [`docs/API.md`](docs/API.md) | REST and GraphQL reference |
| [`docs/SECURITY.md`](docs/SECURITY.md) | Authentication, RBAC, GDPR/FERPA, threat notes |
| [`docs/SUPABASE.md`](docs/SUPABASE.md) | Running the database on Supabase |
| [`docs/VERCEL.md`](docs/VERCEL.md) | Deploying to Vercel, including the Anthropic integration |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Docker, Kubernetes, scaling, pre-launch checklist |
| [`docs/USER-GUIDE.md`](docs/USER-GUIDE.md) | Manuals for students, lecturers and administrators |

---

## Honest scope

This platform covers the core spine of a university end to end and is genuinely usable, but
the brief it was built from lists several hundred features. Where something is scaffolded
rather than complete, it says so in the interface rather than pretending:

- **Payments** settle locally without provider credentials so the journey demonstrates; the
  Stripe adapter makes a real Checkout call when `STRIPE_SECRET_KEY` is set. Webhook
  reconciliation for each provider is specified but not implemented.
- **AI features** call the Claude API when `ANTHROPIC_API_KEY` is set and otherwise use a
  deterministic offline responder that is honest about being one.
- **File uploads** record declared documents; wiring S3 pre-signed uploads is a contained
  change described in the deployment doc.
- **Video conferencing** stores join links; creating meetings through the Zoom/Daily/Agora
  APIs is not implemented.
- **AI proctoring** captures tab-switch, blur and copy events and persists them with the
  attempt. Camera-based identity checking is not implemented.
- **Blockchain anchoring** stores the transaction reference; the certificate hash is real
  and verification recomputes it, but nothing is written to a chain.
- **Native mobile apps** are not built — the PWA is installable and works offline.

Everything else listed under "What is actually built" runs against the seeded database.
