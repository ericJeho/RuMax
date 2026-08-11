# Security and compliance

## Authentication

Passwords are hashed with bcrypt at cost 12. The policy (10 characters, mixed case, digit,
symbol) lives in `src/lib/password.ts` so the register form and the server apply the
identical rules — a client policy that has drifted from the server's is how weak passwords
get through.

Sign-in returns the **same message** for an unknown address and a wrong password, and the
unknown-address path still runs a bcrypt comparison so response time does not leak whether
an account exists. Five consecutive failures lock the account for 15 minutes.

Sessions are JWTs (HS256, issuer and audience pinned, 12-hour default) in an httpOnly,
SameSite=Lax, Secure-in-production cookie — **and** a `Session` row. The row is what makes
revocation possible: sign out everywhere, a role change, or a suspension takes effect
immediately rather than when the token happens to expire.

## Authorisation

Three layers, on purpose:

1. **Edge middleware** checks that a structurally valid, unexpired JWT carries a role
   allowed in this area. It does no database work, because it runs on every request. Treat
   it as a fast redirect, never as the decision.
2. **Layouts** call `getCurrentUser()`, which hits the database and catches revoked or
   suspended sessions.
3. **Route handlers** call `requireRole()` / `requirePermission()`. **This is the
   authorisation decision.** Hiding a navigation link is presentation, not security.

The permission matrix is in `src/lib/rbac.ts` and is rendered read-only at
`/admin/permissions`. It is deliberately not editable through the interface: an
administrator who could grant themselves `settings:write` from a web form would make the
audit log meaningless. Changing a grant is a code change, reviewed and deployed like any
other security control. Unit tests assert the boundaries that matter — a student cannot
read another student's grades, a lecturer cannot touch finance, a finance officer cannot
publish marks.

## Ownership checks

Role alone is never sufficient. Every handler that touches a record also checks ownership:
a lecturer may only mark submissions on courses they teach; a student may only pay their
own invoices; progress can only be recorded against a course they are registered for. When
a record exists but belongs to someone else the API returns `not_found`, not `forbidden`,
so it does not confirm the record's existence.

## Input handling

Every request body and query string is parsed with a Zod schema before it reaches business
logic. Prisma's parameterised queries mean no string-built SQL anywhere. React escapes
output by default, and the two places using `dangerouslySetInnerHTML` inject
application-controlled JSON-LD and the theme bootstrap script, never user content.

## Transport and headers

Set in `next.config.ts` for every response: HSTS with preload, `X-Frame-Options:
SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy:
strict-origin-when-cross-origin`, a `Permissions-Policy` allowing camera and microphone
only same-origin (proctoring and live sessions) and denying geolocation outright, and a
Content-Security-Policy restricting `default-src`, `connect-src`, `frame-ancestors`,
`base-uri` and `form-action` to `'self'`.

`script-src` currently allows `'unsafe-inline'` and `'unsafe-eval'`, which Next.js requires
for its bootstrap. Tightening this to a nonce-based policy is the highest-value remaining
hardening item.

## Examination integrity

Correct answers are stripped server-side and **never sent to the browser** during an
attempt. The paper's order is fixed when the attempt starts, so reloading cannot reshuffle
it. Marking happens on the server on submit; the client cannot report a score. Proctoring
records tab-blur, window-blur and copy events with the attempt. Submitting an attempt twice
is refused.

The countdown in the browser is a courtesy — the server stores `startedAt` and enforces the
limit.

## Data protection

**GDPR.** Article 15 access is self-service: `/api/me/export` returns everything held about
the caller, immediately, without anyone having to approve it. Credentials (password hash,
2FA secret) are excluded — they are not personal data and exporting them creates risk with
no benefit. Retention periods are published in the privacy policy and are real: academic
records 40 years (required by the awarding regulations), financial records 7 years,
unsuccessful applications 2 years, proctoring recordings 90 days.

**FERPA.** Access to a student record is role-based and every consequential access or
change is written to `AuditLog`. Reports return aggregates only, so committee papers never
contain an identifiable student.

**Audit log.** Append-only. No code path updates or deletes a row. A log that can be
quietly rewritten cannot answer "who changed this mark".

## Rate limiting

Applied to every unauthenticated or expensive endpoint (see `docs/API.md` for the table).
AI chat is limited **per user rather than per IP** — students share networks, and a per-IP
limit would penalise a whole computer lab for one heavy user.

The current limiter is in-process, which protects a single instance and is honest about it.
Behind more than one replica, point `REDIS_URL` at Redis and replace the implementation in
`src/lib/api.ts`; no call site changes.

## Secrets

Everything sensitive comes from the environment, validated by `src/lib/env.ts`. Nothing
sensitive is stored in the database, and `SystemSetting` holds feature flags only. The
Kubernetes manifest contains placeholder values with a comment showing how to create the
real secret out of band — never commit one.

## Known gaps

Stated plainly rather than left for someone to discover:

- **CSP allows inline and eval scripts.** Next.js requires it today; a nonce-based policy
  is the intended fix.
- **Two-factor authentication** has schema support and is surfaced in the profile, but the
  TOTP enrolment and challenge flow is not implemented.
- **Payment webhooks** are specified but not implemented; without them, redirect-based
  providers leave the payment `PENDING` until reconciled.
- **Uploads** record declared documents rather than accepting files. Wire S3 pre-signed
  uploads before accepting real documents, and virus-scan on the way in.
- **Biometric and face-recognition login**, listed in the brief, are not implemented.
- **CSRF** relies on `SameSite=Lax` plus the fact that every mutation is a JSON `fetch`
  requiring a `content-type` a cross-site form cannot set. Adding an explicit
  double-submit token would be belt and braces.

## Reporting a vulnerability

`security@rumax.edu`. Acknowledged within one working day; we do not pursue researchers who
report in good faith.
