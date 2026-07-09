# Production image — built by Dokploy on deploy.
# Local development uses Dockerfile.dev (hot-reload via volume mount).

# ─── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# The Turnstile site key is a plain server-only env var (TURNSTILE_SITE_KEY),
# read at request time and passed to the client as a prop. It is NOT needed at
# build time, so no build arg is required — set it as a runtime env in Dokploy.

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ─── Runtime stage ────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Standalone output: server.js + minimal node_modules, plus static assets.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
