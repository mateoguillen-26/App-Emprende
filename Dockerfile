# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build frontend
COPY . .
RUN npm run build

# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Copy package files and install only production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built frontend from Stage 1
COPY --from=builder /app/dist ./dist

# Copy server source
COPY server.ts ./
COPY tsconfig.json ./

# Install tsx to run TypeScript server directly
RUN npm install tsx --save-dev

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npx", "tsx", "server.ts"]
