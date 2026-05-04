# ---- Stage 1: Build ----
FROM node:22-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- Stage 2: Production ----
FROM node:22-slim AS runner

WORKDIR /app

# Prisma precisa de OpenSSL para o query engine
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

# Diretório de uploads (imagens de capa e perfis)
RUN mkdir -p uploads/covers uploads/professionals

EXPOSE 3333

CMD ["node", "dist/server.js"]
