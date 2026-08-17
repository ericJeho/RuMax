# Sign in with Google and Microsoft

Third-party sign-in is optional. With no credentials configured, the buttons do not appear
and email/password sign-in is unaffected.

---

## 1. Google

**Google Cloud console → APIs & Services → Credentials → Create credentials → OAuth client ID**,
type **Web application**.

Authorised redirect URI — this must match exactly, including scheme and the absence of a
trailing slash:

```
https://your-site.example/api/auth/oauth/google/callback
```

Add `http://localhost:3000/api/auth/oauth/google/callback` as a second URI for development.

Then set:

```
GOOGLE_CLIENT_ID=…
GOOGLE_CLIENT_SECRET=…
```

## 2. Microsoft

**Entra ID → App registrations → New registration.** Supported account types decides who can
sign in; "Accounts in any organizational directory and personal Microsoft accounts" matches
the `common` endpoint this implementation uses.

Redirect URI, platform **Web**:

```
https://your-site.example/api/auth/oauth/microsoft/callback
```

Create a client secret under **Certificates & secrets**, then set:

```
MICROSOFT_CLIENT_ID=…
MICROSOFT_CLIENT_SECRET=…
```

## 3. Site URL

The redirect URI is derived from `NEXT_PUBLIC_SITE_URL`. If that does not match the URL the
provider was configured with, the provider rejects the request before your code runs — this
is the single most common cause of a failed setup.

```
NEXT_PUBLIC_SITE_URL=https://your-site.example
```

---

## What happens on first sign-in

A provider account that is not yet linked, whose email matches nobody here, creates a new
**applicant** account with no password. The holder can set one later through the password
reset flow if they want both routes in.

## Account linking, and why it is restrictive

The dangerous case in third-party sign-in is not the protocol. It is what happens when the
address a provider returns already belongs to an account.

Link on the strength of an unverified claim and sign-in becomes an account-takeover
mechanism: anyone who can persuade a provider to issue them a token for
`registrar@rumax.edu` inherits the registrar's account, no password required. Providers that
let a user type an address without proving control make this trivial.

So the rule is:

| Provider identity | Address already registered here | Result |
| --- | --- | --- |
| Already linked | — | Signed in |
| New | No | New applicant account |
| New | Yes, and provider confirms the address | Linked to the existing account |
| New | Yes, and provider does **not** confirm | **Refused** |

The refusal is not a dead end. Sign in with your password and link the provider from your
profile — proving you hold the account, which is what the provider declined to do.

### Which providers confirm an address

**Google** returns `email_verified`, and it is trusted only when exactly `true`.

**Microsoft** is treated as never confirming. A work or school account's address is verified
by its tenant, but a personal Microsoft account's `email` claim is self-asserted, and the
`common` endpoint serves both without distinguishing them in the userinfo response. Treating
that as verification would reintroduce exactly the takeover above. The consequence is that
Microsoft sign-in creates accounts freely but will not attach itself to an existing one.

If your deployment only admits a single tenant, change `authorizeUrl` and `tokenUrl` in
`src/lib/oauth.ts` from `common` to your tenant ID and the claim becomes trustworthy — at
which point `readProfile` can treat Microsoft as verified.

## Protocol notes

- **PKCE (S256)** on both providers, with the verifier held in a short-lived httpOnly
  cookie alongside the state. The cookie is deleted on the first callback whatever the
  outcome, so a captured callback URL cannot be replayed.
- **State** is compared, and so is the provider recorded at the start, so a callback for one
  provider cannot complete a flow begun with another.
- **`next`** is accepted only as a relative path. An absolute URL would make the callback an
  open redirect trading on this domain's credibility.
- Identities are keyed on `(provider, providerId)`, never on email. Subject identifiers are
  stable; addresses get reassigned, and keying on them would hand an account to whoever next
  holds the address.
- Every outcome is written to the audit log: `auth.oauth.register`, `auth.oauth.link`,
  `auth.oauth.login`.
