# ============================================
# SubTracker - Complete Docker (Frontend + Backend + PostgreSQL)
# All-in-one container for simplified deployment
# ============================================

# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend

COPY subscription-tracker-frontend/package.json subscription-tracker-frontend/package-lock.json* ./
RUN npm ci --legacy-peer-deps

COPY subscription-tracker-frontend/ ./

# Build with API pointing to localhost (same container)
ENV VITE_API_URL=http://localhost:8084/api
RUN npm run build

# Stage 2: Build Backend
FROM maven:3.9-eclipse-temurin-17 AS backend-builder

WORKDIR /backend

COPY subscription-tracker-backend/pom.xml ./
RUN mvn dependency:go-offline -B

COPY subscription-tracker-backend/src ./src
RUN mvn package -DskipTests -B

# ============================================
# Stage 3: Runtime - Complete Container
# ============================================
FROM eclipse-temurin:17-jre-alpine

LABEL maintainer="SubTracker Team"
LABEL description="SubTracker - Complete Application (Frontend + Backend + PostgreSQL)"
LABEL version="2.0.0"

# Install nginx, supervisord, postgresql, and utilities
RUN apk add --no-cache nginx supervisor curl postgresql postgresql-contrib

# Create necessary directories
RUN mkdir -p /run/postgresql /var/lib/postgresql/data /var/log/postgresql \
    && chown -R postgres:postgres /run/postgresql /var/lib/postgresql /var/log/postgresql

WORKDIR /app

# Copy backend JAR
COPY --from=backend-builder /backend/target/*.jar app.jar

# Copy frontend build to nginx
COPY --from=frontend-builder /frontend/dist /usr/share/nginx/html

# Create nginx config for frontend + API proxy
RUN mkdir -p /etc/nginx/http.d
COPY <<EOF /etc/nginx/http.d/default.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # API proxy to backend
    location /api/ {
        proxy_pass http://127.0.0.1:8084/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_connect_timeout 60s;
        proxy_read_timeout 60s;
    }

    # SPA fallback
    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

# Create supervisord config to run all three services
RUN mkdir -p /etc/supervisor.d
COPY <<EOF /etc/supervisor.d/subtracker.ini
[supervisord]
nodaemon=true
user=root
logfile=/var/log/supervisord.log
pidfile=/var/run/supervisord.pid

[program:postgresql]
command=/usr/bin/postgres -D /var/lib/postgresql/data
user=postgres
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
priority=1

[program:backend]
command=java -XX:+UseContainerSupport -XX:MaxRAMPercentage=50.0 -jar /app/app.jar
directory=/app
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
environment=PORT="8084",DB_URL="jdbc:postgresql://localhost:5432/subscription_tracker",DB_USERNAME="postgres",DB_PASSWORD="postgres"
priority=10
startsecs=10

[program:nginx]
command=nginx -g "daemon off;"
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
priority=20
EOF

# Create initialization script for PostgreSQL and startup
COPY <<EOF /app/init-db.sh
#!/bin/sh
set -e

# Initialize PostgreSQL if not already done
if [ ! -f /var/lib/postgresql/data/PG_VERSION ]; then
    echo "Initializing PostgreSQL database..."
    su postgres -c "initdb -D /var/lib/postgresql/data"
    
    # Configure PostgreSQL to accept local connections
    echo "host all all 127.0.0.1/32 trust" >> /var/lib/postgresql/data/pg_hba.conf
    echo "local all all trust" >> /var/lib/postgresql/data/pg_hba.conf
    
    # Start PostgreSQL temporarily to create database
    su postgres -c "pg_ctl -D /var/lib/postgresql/data -o '-c listen_addresses=localhost' -w start"
    
    # Create the database
    su postgres -c "createdb subscription_tracker"
    echo "Database 'subscription_tracker' created successfully!"
    
    # Stop PostgreSQL (supervisord will start it properly)
    su postgres -c "pg_ctl -D /var/lib/postgresql/data -w stop"
fi
EOF
RUN chmod +x /app/init-db.sh

# Create main startup script
COPY <<EOF /app/start.sh
#!/bin/sh
echo "============================================="
echo "  SubTracker - Complete Application Stack"
echo "============================================="
echo ""
echo "Initializing database..."
/app/init-db.sh

echo ""
echo "Starting all services..."
echo "  - PostgreSQL: localhost:5432"
echo "  - Backend API: http://localhost:8084/api"
echo "  - Frontend: http://localhost:80"
echo "============================================="
echo ""

exec supervisord -c /etc/supervisord.conf
EOF
RUN chmod +x /app/start.sh

# Environment variables with defaults
ENV DB_URL=jdbc:postgresql://localhost:5432/subscription_tracker
ENV DB_USERNAME=postgres
ENV DB_PASSWORD=postgres
ENV JWT_SECRET=YourSuperSecretKeyForJWTTokenGeneration123456789
ENV JWT_EXPIRATION=86400000
ENV PORT=8084

# Expose ports
EXPOSE 80 8084 5432

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
    CMD curl -f http://localhost:80/health && curl -f http://localhost:8084/api/health || exit 1

# Persistent volume for database
VOLUME ["/var/lib/postgresql/data"]

# Start all services
ENTRYPOINT ["/app/start.sh"]
