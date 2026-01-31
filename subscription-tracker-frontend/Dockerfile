# ============================================
# SubTracker Frontend - Docker Multi-Stage Build
# ============================================

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for dependency caching
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build arguments for API URL configuration
ARG VITE_API_URL=http://localhost:8084/api
ENV VITE_API_URL=$VITE_API_URL

# Build the application
RUN npm run build

# ============================================
# Stage 2: Production with Nginx
# ============================================
FROM nginx:alpine

LABEL maintainer="SubTracker Team"
LABEL description="SubTracker Frontend - Subscription Tracking Dashboard"

# Remove default nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create non-root user for security
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup && \
    chown -R appuser:appgroup /var/cache/nginx && \
    chown -R appuser:appgroup /var/log/nginx && \
    chown -R appuser:appgroup /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R appuser:appgroup /var/run/nginx.pid

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
