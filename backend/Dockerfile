# Multi-stage build for backend
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source files
COPY . .

# Install dev dependencies for building
RUN npm install --save-dev

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

# Install dependencies for sharp (image processing library)
# Sharp has pre-built binaries, but vips may be needed for some operations
RUN apk add --no-cache \
    vips-dev \
    vips \
    || true  # vips is optional, sharp can work without it

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

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

