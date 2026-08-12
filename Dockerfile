# syntax=docker/dockerfile:1.7
# ---------------------------------------------------------------------------
# RuMax Global Digital University — production image
#
# Multi-stage so the runtime image carries neither the toolchain nor the source.
# Next.js `output: 'standalone'` traces exactly the node_modules the server needs,
# which takes the final image from ~1.2 GB to roughly 200 MB.
# ---------------------------------------------------------------------------

FROM node:22-alpine AS base
# Prisma's query engine needs OpenSSL; Alpine does not ship it by default.
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# --------------------------------------------------------------- dependencies
FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma
# `npm ci` is reproducible; the postinstall generates the Prisma client.
RUN npm ci --ignore-scripts && npx prisma generate

# --------------------------------------------------------------------- build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# The build must not require real credentials — env.ts falls back during the build
# phase and validates for real at runtime.
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=1
# Opt this build into `output: 'standalone'` — see next.config.ts.
ENV BUILD_STANDALONE=1
RUN npx prisma generate && npm run build

# ------------------------------------------------------------------- runtime
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Never run the server as root.
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Migrations and the seed script are needed by the release job, which runs this same
# image with a different command.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma

USER nextjs
EXPOSE 3000

# The health endpoint checks the database too, so an instance that cannot serve a
# student is taken out of the load balancer rather than left accepting traffic.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
