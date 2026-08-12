-- Take PostgREST out of the picture for the application schema.
--
-- Why this exists
-- ---------------
-- Supabase grants the `anon` and `authenticated` roles full DML on every table in the
-- `public` schema, and hands out matching default privileges so that anything created
-- later is granted the same way. Prisma creates its tables in `public`, with row level
-- security off, as Postgres does by default.
--
-- Those two defaults compose badly. The project's anon key is public by design — it ships
-- in client bundles and is printed in the Supabase dashboard — so without this migration
-- that key is a full read/write credential for every row in the university database:
-- password hashes, grades, invoices, applications, audit log. It reaches them over
-- PostgREST, which never sees the application's JWT session, its role matrix, or its audit
-- trail. Every access control in `src/lib/rbac.ts` is bypassed by construction.
--
-- Verified against a real Supabase project before writing this: on a freshly created table
-- `anon` held SELECT, INSERT, UPDATE, DELETE and TRUNCATE, and the security advisor
-- reported the table as EXTERNAL facing.
--
-- Why revoke rather than add policies
-- -----------------------------------
-- This application does not use PostgREST or Supabase Auth. It connects straight to
-- Postgres as the table owner through Prisma. Writing RLS policies would mean maintaining
-- a second, parallel authorisation model that has to agree with the first one forever —
-- and the two disagreeing silently is exactly the failure this is meant to prevent. So the
-- exposure is removed instead of being policed.
--
-- Two independent controls, deliberately:
--   1. No privileges. `anon` and `authenticated` are granted nothing, now or in future.
--   2. RLS on, with no policies. If a future migration or a dashboard action re-grants
--      table access, RLS still denies every row to those roles. The owner is unaffected —
--      Postgres exempts table owners from RLS unless FORCE ROW LEVEL SECURITY is set — so
--      Prisma continues to work untouched.
--
-- Everything is guarded on the Supabase roles existing, so on plain PostgreSQL (local
-- development, Docker Compose, CI) the whole migration is a no-op. That guard is also why
-- RLS is only enabled inside it: on a self-hosted database the application may legitimately
-- connect as a role that is not the table owner, and enabling RLS there would deny it
-- everything.

DO $$
DECLARE
  target record;
  leftover integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    RAISE NOTICE 'Not a Supabase database (no `anon` role) — nothing to revoke.';
    RETURN;
  END IF;

  -- 1. Remove every existing privilege, and stop new objects inheriting one.
  EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated';
  EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated';
  EXECUTE 'REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated';

  -- Prisma runs migrations as `postgres`, so it is that role's default privileges that
  -- decide what a table created by a future migration is granted.
  EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public '
          'REVOKE ALL ON TABLES FROM anon, authenticated';
  EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public '
          'REVOKE ALL ON SEQUENCES FROM anon, authenticated';
  EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public '
          'REVOKE ALL ON FUNCTIONS FROM anon, authenticated';

  -- 2. The backstop. No policies are created, so the roles match no rows at all.
  FOR target IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND NOT c.relrowsecurity
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', target.relname);
  END LOOP;

  -- 3. Assert the result, rather than trusting that the statements above did what they
  -- say. A revoke that silently failed to apply leaves the anon key as a full read/write
  -- credential while every log line still reads "migration applied". Failing here fails
  -- `prisma migrate deploy`, which fails the deployment — the correct outcome.
  SELECT count(*) INTO leftover
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated');

  IF leftover > 0 THEN
    RAISE EXCEPTION
      'PostgREST access was not revoked: % table grants remain for anon/authenticated. '
      'The anon key would be a full read/write credential for the whole schema. '
      'See docs/SUPABASE.md.', leftover;
  END IF;
END
$$;
