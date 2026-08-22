-- Third-party identities (Google, Microsoft) linked to an account.
--
-- Keyed on (provider, providerId), not on email. A provider's subject identifier is stable
-- for the life of the account; an email address is not — people change them, and
-- organisations reassign them when staff leave. Looking a returning user up by email would
-- mean whoever next holds that address inherits the account.
CREATE TYPE "AuthProvider" AS ENUM ('GOOGLE', 'MICROSOFT');

CREATE TABLE "LinkedAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "AuthProvider" NOT NULL,
    "providerId" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    CONSTRAINT "LinkedAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LinkedAccount_provider_providerId_key" ON "LinkedAccount"("provider", "providerId");
CREATE INDEX "LinkedAccount_userId_idx" ON "LinkedAccount"("userId");

ALTER TABLE "LinkedAccount" ADD CONSTRAINT "LinkedAccount_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
