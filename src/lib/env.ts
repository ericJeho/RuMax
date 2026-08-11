/**
 * Typed, validated environment access.
 *
 * Validation is deliberately lenient at import time: the marketing site must render
 * on a machine that has no payment or AI credentials. Anything genuinely required to
 * boot (database URL, auth secret) throws loudly; optional integrations expose an
 * `isConfigured` flag so features can degrade instead of crashing.
 */
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  AUTH_SECRET: z.string().min(16, 'AUTH_SECRET must be at least 16 characters'),
  AUTH_TOKEN_TTL_HOURS: z.coerce.number().int().positive().default(12),
  AUTH_COOKIE_NAME: z.string().default('rumax_session'),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_SITE_NAME: z.string().default('RuMax Global Digital University'),
  REDIS_URL: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default('claude-sonnet-5'),
  STRIPE_SECRET_KEY: z.string().optional(),
  PAYPAL_CLIENT_ID: z.string().optional(),
  FLUTTERWAVE_SECRET_KEY: z.string().optional(),
  PAYSTACK_SECRET_KEY: z.string().optional(),
  AIRTEL_MONEY_CLIENT_ID: z.string().optional(),
  TNM_MPAMBA_API_KEY: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_PUBLIC_BASE_URL: z.string().optional(),
  ZOOM_CLIENT_ID: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SEED_PASSWORD: z.string().default('RuMax#Demo2025'),
});

type Env = z.infer<typeof schema>;

function load(): Env {
  const parsed = schema.safeParse(process.env);
  if (parsed.success) return parsed.data;

  // During `next build` the page-data collection step imports server modules without
  // a full environment. Fail loudly at runtime instead of breaking the build.
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.SKIP_ENV_VALIDATION) {
    console.warn(`[env] using fallback values, some variables are missing:\n${issues}`);
    return schema.parse({
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://localhost:5432/placeholder',
      AUTH_SECRET: process.env.AUTH_SECRET ?? 'build-time-placeholder-secret-value',
    });
  }
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = load();

export const integrations = {
  ai: Boolean(env.ANTHROPIC_API_KEY),
  stripe: Boolean(env.STRIPE_SECRET_KEY),
  paypal: Boolean(env.PAYPAL_CLIENT_ID),
  flutterwave: Boolean(env.FLUTTERWAVE_SECRET_KEY),
  paystack: Boolean(env.PAYSTACK_SECRET_KEY),
  airtelMoney: Boolean(env.AIRTEL_MONEY_CLIENT_ID),
  tnmMpamba: Boolean(env.TNM_MPAMBA_API_KEY),
  s3: Boolean(env.S3_BUCKET),
  zoom: Boolean(env.ZOOM_CLIENT_ID),
  email: Boolean(env.SMTP_HOST),
  redis: Boolean(env.REDIS_URL),
} as const;

export const isProduction = env.NODE_ENV === 'production';
