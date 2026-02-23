FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files first (better layer caching)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Production stage - use serve (battle-tested for Railway/Render/Heroku)
FROM node:22-alpine

WORKDIR /app

# Copy built files
COPY --from=builder /app/dist ./dist

# Install serve only (lightweight)
RUN npm install -g serve

# Railway injects PORT at runtime
EXPOSE 3000

# serve reads PORT from env automatically, -s for SPA fallback
CMD ["sh", "-c", "serve -s dist -l ${PORT:-3000}"]
