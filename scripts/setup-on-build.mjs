/**
 * Optional database setup during the build, for platforms where there is no shell.
 *
 * Runs between `prisma generate` and `next build`, and does nothing at all unless
 * `SETUP_DATABASE_ON_BUILD` is exactly "true".
 *
 * Why this exists
 * ---------------
 * `docs/SUPABASE.md` says to apply migrations as a separate step, and that is still the
 * right default: a build that migrates races itself across concurrent deployments, and
 * build environments are a poor place to hold database credentials. But it assumes you
 * have a terminal. Deploying straight from a Git host to Vercel, there is no step between
 * "import the repository" and "the site is live" in which to run anything — so the first
 * deployment comes up against an empty database and there is no obvious way out.
 *
 * This is the opt-in escape hatch for that case, built so that leaving it switched on is
 * not destructive:
 *
 *   - Migrations are applied with `migrate deploy`, which is safe to re-run. Prisma takes
 *     an advisory lock, so concurrent deployments serialise rather than corrupt.
 *   - The seed runs ONLY when the database has no users. The seed deletes everything
 *     before loading, so running it against a populated database would destroy real
 *     records on every deployment. Guarding on emptiness makes this a first-run action
 *     rather than a standing hazard.
 *
 * If `SEED_PASSWORD` is unset the seed generates a random password and prints it — look
 * for it in the build log, because it is not recoverable afterwards.
 */
import { execSync } from 'node:child_process';

const ENABLED = process.env.SETUP_DATABASE_ON_BUILD === 'true';

if (!ENABLED) {
  process.exit(0);
}

console.log('\nSETUP_DATABASE_ON_BUILD=true — preparing the database before the build.\n');

if (!process.env.DATABASE_URL) {
  console.error('SETUP_DATABASE_ON_BUILD is set but DATABASE_URL is not.');
  console.error('Set both, or unset SETUP_DATABASE_ON_BUILD. Failing rather than');
  console.error('deploying a site whose database was silently never prepared.');
  process.exit(1);
}

if (!process.env.DIRECT_URL) {
  // Prisma has no fallback for directUrl. Without a pooler the two are the same thing, so
  // fill it in rather than failing on a technicality.
  process.env.DIRECT_URL = process.env.DATABASE_URL;
  console.log('DIRECT_URL was unset; using DATABASE_URL for migrations.');
}

const run = (command) => execSync(command, { stdio: 'inherit', env: process.env });

run('npx prisma migrate deploy');

const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

try {
  const users = await prisma.user.count();

  if (users > 0) {
    console.log(`\nDatabase already has ${users} users — skipping the seed.`);
    console.log('The seed deletes everything before loading, so it only runs into an empty');
    console.log('database. To reload demonstration data deliberately, run `npm run db:seed`.\n');
  } else {
    console.log('\nDatabase is empty — loading demonstration data.\n');
    run('npx prisma db seed');
  }
} finally {
  await prisma.$disconnect();
}
