FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files first (better layer caching)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

# Copy built files and server from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.cjs ./

# Use Railway's PORT
ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.cjs"]
