# API reference

Two surfaces, deliberately: **REST** for the mutations the portals perform (each needs its
own rate limit and audit semantics) and **GraphQL** for read-heavy, shape-varying queries
from reporting and the mobile app. Both go through the same authorisation helpers — a
GraphQL field is never a way around a REST permission check.

## Conventions

- JSON in, JSON out. `content-type: application/json`.
- Authentication is the `rumax_session` httpOnly cookie, set by `POST /api/auth/login`.
- Errors are uniform:

  ```json
  { "error": { "code": "forbidden", "message": "You do not have permission…", "details": {} } }
  ```

| Code | HTTP | Meaning |
| --- | --- | --- |
| `unauthenticated` | 401 | No valid session |
| `forbidden` | 403 | Signed in, wrong role |
| `not_found` | 404 | Absent, **or** present but not yours |
| `conflict` | 409 | Already exists / already used |
| `validation_failed` | 422 | Field errors in `details` |
| `rate_limited` | 429 | Slow down |
| `internal_error` | 500 | Logged server-side; no detail returned |

`not_found` is returned rather than `forbidden` when a resource exists but belongs to
someone else — otherwise the API confirms the existence of records the caller may not see.

## Authentication

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `POST` | `/api/auth/login` | — | 10/min per IP. Uniform failure message; five failures lock the account for 15 minutes. |
| `POST` | `/api/auth/register` | — | 5/hour per IP. Creates an `APPLICANT` only. |
| `POST` | `/api/auth/logout` | session | Revokes the session row and clears the cookie. |
| `GET` | `/api/auth/me` | session | The caller plus their effective permissions. |

```bash
curl -c jar -X POST localhost:3000/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"student@rumax.edu","password":"RuMax#Demo2025"}'
```

## Learning

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `POST` | `/api/lessons/:id/progress` | student | Idempotent. Rejects lessons on courses you are not registered for. |
| `POST` | `/api/assignments/:id/submissions` | student | Draft or submit. A graded submission is immutable. Past the deadline it is recorded as `LATE`, or refused if late work is disallowed. |
| `POST` | `/api/assignments` | lecturer | Create and optionally publish; publishing notifies the cohort. |
| `POST` | `/api/submissions/:id/grade` | lecturer | Score is validated against the assignment maximum. Notifies the student. |
| `POST` | `/api/registrations` | student | Re-checks the registration window, prerequisites, credit cap and programme membership. |
| `GET` | `/api/registrations` | student | Your registrations. |
| `POST` | `/api/registrations/decision` | registrar | Bulk approve or decline. Already-decided rows are left alone. |
| `POST` | `/api/attendance` | lecturer | Upserts on (student, course, date), so retaking a register corrects it. |

## Examinations

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `POST` | `/api/quizzes/:id/attempts` | student | Starts or resumes. Response **never contains `isCorrect`**. Returns the server-authoritative `endsAt`. |
| `PUT` | `/api/attempts/:id/answers` | student | Autosave one answer. |
| `POST` | `/api/attempts/:id/submit` | student | Marks server-side and returns a per-question breakdown. Second call returns `bad_request`. |
| `POST` | `/api/quizzes` | lecturer | Creates the quiz and its bank in one transaction. Rejects a question with no correct option. |

The countdown in the browser is a courtesy. The server records `startedAt` and enforces the
limit, so editing the clock client-side gains nothing.

## Admissions

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `POST` | `/api/applications` | — | 5/hour per IP. Rejects a duplicate live application to the same programme. |
| `POST` | `/api/applications/:id/decision` | registrar | Moves the application. `OFFER_MADE` requires the mandatory documents; `ENROLLED` requires a prior offer and runs the enrolment transaction. |

## Finance

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `POST` | `/api/payments` | student | Invoice is re-read server-side; the amount is validated against the real balance; paying someone else's invoice returns `not_found`. |
| `GET` | `/api/payments/:id/receipt` | owner or finance | Accepts the id or the public reference. |

A payment is only `SUCCEEDED` on a verified webhook or a verified server-side capture —
never because the browser said so. Without provider credentials the payment settles locally
and the response says so explicitly.

## Credentials — public

```http
GET /api/certificates/:serial
```

Unauthenticated by design: the point of a verifiable credential is that anyone can check
it. Rate limited to 30/min per IP. Discloses only what appears on the certificate face.

```json
{
  "valid": true,
  "serial": "RX-2025-DEMO-0001",
  "holder": "Chikondi Banda",
  "award": "Certificate in Educational Technology",
  "classification": "Distinction",
  "issuedAt": "2025-07-01T00:00:00.000Z",
  "documentHash": "e6648a89…",
  "issuer": { "name": "RuMax Global Digital University", "registration": "HEA/UNI/0142" }
}
```

Failure carries a `reason`: `malformed_serial`, `not_found`, `revoked`, or
`integrity_failure` — the last meaning the serial exists but its stored hash does not match
a hash recomputed from the live record.

## Personal data and reports

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `PATCH` | `/api/me` | session | Presentation fields only. Name, email, role and student number are registrar-controlled. |
| `GET` | `/api/me/export` | session | GDPR Article 15 export. Excludes credentials. |
| `GET` | `/api/transcripts/me` | student | Structured transcript; the same payload the registrar's document service renders. |
| `GET` | `/api/reports/:type` | admin/registrar/finance | `enrolment`, `attainment`, `finance`, `admissions`, `retention`, `research`. Aggregates only — no report identifies an individual. |
| `GET` | `/api/health` | — | 200 when the database is reachable, 503 when not. |

## Communication

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `POST` | `/api/messages` | session | Students may only write to staff who teach or administer them. |
| `POST` | `/api/forums/:id/posts` | enrolled | Reply to a course thread. |
| `POST` | `/api/announcements` | registrar/lecturer | Audience-targeted; fan-out above 5,000 recipients is queued rather than written inline. |
| `POST` | `/api/notifications/read-all` | session | Clears the unread badge. |
| `POST` | `/api/contact` | — | Public enquiry form, 5/hour per IP, with a honeypot field. |

## AI

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `POST` | `/api/ai/chat` | session | 30/min **per user**, not per IP — students share networks. Grounded in the named course's syllabus when supplied. |
| `POST` | `/api/ai/feedback` | lecturer | Drafts feedback for a human to edit. Never returns a mark, never reaches the student directly. |
| `POST` | `/api/ai/quiz-questions` | lecturer | Draft questions for review. |

Every response carries `source: "claude" | "offline"` so the interface can be honest about
which produced it.

## GraphQL

Endpoint: `POST /api/graphql`. GraphiQL is served at the same URL in development.

Public: `programs`, `program`, `faculties`, `faculty`, `courses`, `posts`, `scholarships`,
`stats`, `verifyCertificate`.
Session required: `me`, `myEnrolments`, `myGrades`.

```graphql
{
  stats { students programs countries }
  programs(level: "MASTERS", limit: 5) {
    title
    tuitionPerYear
    faculty { name }
  }
  verifyCertificate(serial: "RX-2025-DEMO-0001") { valid holder award }
}
```

Resolver errors are masked in production so an internal message never reaches a client that
is allowed to query anonymously.

## Rate limits

| Endpoint | Limit |
| --- | --- |
| Login | 10 / minute / IP |
| Register, apply, contact | 5 / hour / IP |
| Certificate verification | 30 / minute / IP |
| AI chat | 30 / minute / **user** |
| Payments | 12 / minute / user |
| Messages | 20 / hour / user |
| Forum posts | 30 / hour / user |

The limiter is in-process and therefore per-instance. Behind more than one replica, point
`REDIS_URL` at Redis and swap the implementation in `src/lib/api.ts` — the call sites do not
change.
