# Multi-stage build for backend
FROM node:20-alpine AS builder

# Install build dependencies for native modules (bcrypt, sharp, etc.)
RUN apk add --no-cache \
    python3 \
    py3-setuptools \
    make \
    g++ \
    vips-dev \
    vips

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for building)
RUN npm ci && npm cache clean --force

# Copy source files
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

# Install runtime dependencies for native modules
# - vips: Required for sharp (image processing library)
# - libc6-compat: Compatibility layer for some native modules
RUN apk add --no-cache \
    vips \
    libc6-compat

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy built files from builder (includes dist with templates already copied by postbuild script)
COPY --from=builder /app/dist ./dist

# Also copy source templates as fallback (EmailTemplateService can use either location)
COPY --from=builder /app/src/services/email/templates ./src/services/email/templates

# Change ownership to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/server.js"]

