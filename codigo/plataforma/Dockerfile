# ==============================================================================
# Dockerfile optimizado para SiGIC (Next.js 16 + React 19 + Standalone Output)
# Instituto Tecnológico Beltrán - Tecnicatura Superior en Analista de Sistemas
# ==============================================================================

# --- Etapa 1: Dependencias base ---
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
RUN npm ci

# --- Etapa 2: Construcción (Build) ---
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat git
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Ejecutar compilación optimizada en modo standalone
RUN npm run build

# --- Etapa 3: Runner de Producción ultraligero ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Archivos estáticos y públicos
COPY --from=builder /app/public ./public

# Modo standalone de Next.js copia únicamente las dependencias estrictamente necesarias
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
