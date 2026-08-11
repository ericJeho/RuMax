/* eslint-disable no-console */
/**
 * One-command setup: check the environment, apply migrations, seed, and report.
 *
 * The point of this script is that the failure modes of connecting Prisma to a hosted
 * Postgres — especially Supabase — are individually obscure and collectively the reason
 * people give up. Each check below corresponds to a mistake that otherwise surfaces as a
 * hang or an unhelpful stack trace.
 *
 *   npm run setup
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

const ok = (message: string) => console.log(`${GREEN}✓${RESET} ${message}`);
const warn = (message: string) => console.log(`${YELLOW}!${RESET} ${message}`);
const fail = (message: string) => console.log(`${RED}✗${RESET} ${message}`);
const hint = (message: string) => console.log(`  ${DIM}${message}${RESET}`);

function die(message: string, ...hints: string[]): never {
  fail(message);
  for (const line of hints) hint(line);
  process.exit(1);
}

console.log('\nRuMax Global Digital University — setup\n');

/* ------------------------------------------------------------------ env file */

if (!existsSync('.env') && !existsSync('.env.local')) {
  die(
    'No .env or .env.local found.',
    'Copy the template first:  cp .env.example .env.local',
    'Then set DATABASE_URL and AUTH_SECRET in it.',
  );
}

// Prisma's CLI reads .env; Next reads .env.local. Load whichever exists so this script
// sees the same values both of them will.
for (const file of ['.env', '.env.local']) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    if (value && !process.env[match[1]]) process.env[match[1]] = value;
  }
}

/* ------------------------------------------------------------- required vars */

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  die(
    'DATABASE_URL is not set.',
    'Supabase: Project settings → Database → Connection string → "Transaction pooler".',
    'Local:    postgresql://rumax:rumax@localhost:5432/rumax?schema=public',
  );
}
ok('DATABASE_URL is set');

const authSecret = process.env.AUTH_SECRET;
if (!authSecret || authSecret.length < 16) {
  fail('AUTH_SECRET is missing or too short (needs 16+ characters).');
  hint('Generate one with:  openssl rand -base64 48');
  hint(`Or use this freshly generated value:\n  AUTH_SECRET="${randomBytes(48).toString('base64')}"`);
  process.exit(1);
}
if (authSecret.startsWith('change-me') || authSecret.includes('placeholder')) {
  die('AUTH_SECRET is still the placeholder from .env.example.', 'Generate one: openssl rand -base64 48');
}
ok('AUTH_SECRET is set');

/* ------------------------------------------- Supabase-specific sanity checks */

const isSupabase = /supabase\.(co|com)/.test(databaseUrl);
const directUrl = process.env.DIRECT_URL;

if (isSupabase) {
  ok('Supabase connection detected');

  // Port 6543 is the transaction pooler; 5432 is a direct connection. Prisma needs the
  // pooler for the app and a direct connection for migrations.
  const pooled = databaseUrl.includes(':6543');

  if (pooled && !databaseUrl.includes('pgbouncer=true')) {
    warn('DATABASE_URL uses the pooler (:6543) but is missing ?pgbouncer=true');
    hint('Without it Prisma prepares statements the transaction pooler cannot reuse,');
    hint('and queries fail intermittently under load with "prepared statement already exists".');
    hint('Append:  ?pgbouncer=true&connection_limit=1');
  } else if (pooled) {
    ok('Pooler flags look right (pgbouncer=true)');
  } else {
    warn('DATABASE_URL points at a direct connection (:5432), not the pooler (:6543)');
    hint('That works, but it will exhaust Supabase connection limits under any real load.');
    hint('Prefer the transaction pooler for DATABASE_URL and keep :5432 for DIRECT_URL.');
  }

  if (!directUrl) {
    die(
      'DIRECT_URL is not set, and migrations cannot run through the pooler.',
      'Set it to the Session pooler or direct connection string (port 5432).',
      'Project settings → Database → Connection string → "Session pooler".',
    );
  }
  if (directUrl.includes(':6543')) {
    die(
      'DIRECT_URL points at the transaction pooler (:6543).',
      'Migrations need advisory locks the transaction pooler cannot provide — this hangs',
      'rather than erroring, which is why it is worth catching here.',
      'Use the port 5432 connection string instead.',
    );
  }
  ok('DIRECT_URL is set to an unpooled connection');
} else if (!directUrl) {
  // Prisma has no fallback for directUrl, so set it here rather than failing later with
  // "Environment variable not found: DIRECT_URL".
  process.env.DIRECT_URL = databaseUrl;
  warn('DIRECT_URL was unset; using DATABASE_URL for migrations (correct without a pooler)');
  hint('Add DIRECT_URL to your env file to silence this.');
} else {
  ok('DIRECT_URL is set');
}

/* ------------------------------------------------------------------- run it */

function run(label: string, command: string) {
  process.stdout.write(`\n${DIM}› ${command}${RESET}\n`);
  try {
    execSync(command, { stdio: 'inherit', env: process.env });
    ok(label);
  } catch {
    die(
      `${label} failed.`,
      isSupabase
        ? 'If this hung rather than errored, DIRECT_URL is probably still the pooler.'
        : 'Is the database running?  docker compose up -d db',
    );
  }
}

run('Prisma client generated', 'npx prisma generate');
run('Migrations applied', 'npx prisma migrate deploy');

const skipSeed = process.argv.includes('--no-seed');
if (skipSeed) {
  warn('Skipping seed (--no-seed)');
} else {
  console.log(
    `\n${YELLOW}The seed deletes all existing data before loading the demonstration university.${RESET}`,
  );
  run('Demonstration data loaded', 'npx prisma db seed');
}

/* ------------------------------------------------------------------ summary */

console.log(`\n${GREEN}Setup complete.${RESET}\n`);
console.log('  Start the app:   npm run dev');
console.log('  Then open:       http://localhost:3000\n');

if (!skipSeed) {
  console.log('  Sign in with any of these — password for all is RuMax#Demo2025:\n');
  console.log('    student@rumax.edu     the student portal');
  console.log('    lecturer@rumax.edu    course builder, marking, gradebook');
  console.log('    registrar@rumax.edu   admissions and student records');
  console.log('    admin@rumax.edu       the full administration ERP\n');
  console.log('  Verify a credential at /verify with serial RX-2025-DEMO-0001 — no sign-in needed.\n');
}
