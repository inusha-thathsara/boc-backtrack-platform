# Multi-stage production build for Feed API on Cloud Run (Zero-Cost Scale-to-Zero)
FROM node:20-slim AS builder

WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src/ ./src/
RUN npm run build

# Production Runner Stage
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY --from=builder /app/dist ./dist
COPY public/ ./public/

# Run as non-root user for container security
USER node

EXPOSE 8080
CMD ["node", "dist/server.js"]
