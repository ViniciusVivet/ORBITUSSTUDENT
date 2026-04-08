FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

FROM base AS builder
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @orbitus/shared build
RUN pnpm --filter api exec prisma generate
RUN pnpm --filter api build

FROM base AS runner
ENV NODE_ENV=production
RUN apk add --no-cache openssl
# Copia node_modules completo do builder (inclui .prisma gerado pelo pnpm)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
# Copia shared compilado
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
# Copia API compilada
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
# Copia schema e migrations para o migrate deploy no startup
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
# Manifests necessarios para o pnpm resolver workspaces em runtime
COPY package.json pnpm-workspace.yaml ./
WORKDIR /app/apps/api
EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
