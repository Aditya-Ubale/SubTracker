# SubTracker - Docker Documentation

## Docker Images

| Image | Description | Docker Hub |
|-------|-------------|------------|
| `adityaubale08/subtracker:latest` | **Complete** (Frontend + Backend + PostgreSQL) | [Link](https://hub.docker.com/r/adityaubale08/subtracker) |
| `adityaubale08/subtracker-db:latest` | PostgreSQL Database | [Link](https://hub.docker.com/r/adityaubale08/subtracker-db) |
| `adityaubale08/subtracker-backend:latest` | Spring Boot Backend | [Link](https://hub.docker.com/r/adityaubale08/subtracker-backend) |
| `adityaubale08/subtracker-frontend:latest` | React + Nginx Frontend | [Link](https://hub.docker.com/r/adityaubale08/subtracker-frontend) |

---

## Quick Start

### Option 1: Complete Image (Easiest)

Everything in one container - just pull and run:

```bash
docker run -d -p 80:80 adityaubale08/subtracker:latest
```

Open: **http://localhost**

With persistent data:
```bash
docker run -d -p 80:80 -v subtracker-data:/var/lib/postgresql/data adityaubale08/subtracker:latest
```

### Option 2: Individual Services (Recommended for Production)

Using Docker Compose with separate containers:

```bash
docker compose up -d
```

---

## Docker Files Structure

```
SubTracker/
├── Dockerfile.merged          # Complete image (Frontend + Backend + DB)
├── Dockerfile.db              # PostgreSQL database only
├── docker-compose.yml         # Development compose (builds locally)
├── docker-compose.prod.yml    # Production compose (uses Docker Hub images)
├── .env.template              # Environment variables template
├── subscription-tracker-backend/
│   └── Dockerfile             # Backend only
└── subscription-tracker-frontend/
    ├── Dockerfile             # Frontend only
    └── nginx.conf             # Nginx configuration
```

---

## Building Images Locally

### Build All Individual Images
```bash
# Build database image
docker build -f Dockerfile.db -t subtracker-db:latest .

# Build backend image
docker build -t subtracker-backend:latest ./subscription-tracker-backend

# Build frontend image
docker build -t subtracker-frontend:latest ./subscription-tracker-frontend

# Build complete merged image
docker build -f Dockerfile.merged -t subtracker:latest .
```

### Build Using Docker Compose
```bash
docker compose build
```

---

## Pushing to Docker Hub

### Login
```bash
docker login -u adityaubale08
```

### Tag and Push
```bash
# Complete image
docker tag subtracker:latest adityaubale08/subtracker:latest
docker push adityaubale08/subtracker:latest

# Database image
docker tag subtracker-db:latest adityaubale08/subtracker-db:latest
docker push adityaubale08/subtracker-db:latest

# Backend image
docker tag subtracker-backend:latest adityaubale08/subtracker-backend:latest
docker push adityaubale08/subtracker-backend:latest

# Frontend image
docker tag subtracker-frontend:latest adityaubale08/subtracker-frontend:latest
docker push adityaubale08/subtracker-frontend:latest
```

---

## Running Options

### 1. Complete Image (All-in-One)

```bash
docker run -d -p 80:80 adityaubale08/subtracker:latest
```

### 2. Individual Containers (Manual)

```bash
# Create network
docker network create subtracker-net

# Run database
docker run -d \
  --name subtracker-db \
  --network subtracker-net \
  -e POSTGRES_DB=subscription_tracker \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -v postgres_data:/var/lib/postgresql/data \
  adityaubale08/subtracker-db:latest

# Wait 10s for DB to start, then run backend
docker run -d \
  --name subtracker-backend \
  --network subtracker-net \
  -e DB_URL=jdbc:postgresql://subtracker-db:5432/subscription_tracker \
  -e DB_USERNAME=postgres \
  -e DB_PASSWORD=postgres \
  -e JWT_SECRET=YourSecretKey123 \
  adityaubale08/subtracker-backend:latest

# Run frontend
docker run -d \
  --name subtracker-frontend \
  --network subtracker-net \
  -p 80:80 \
  adityaubale08/subtracker-frontend:latest
```

### 3. Docker Compose (Recommended)

Development:
```bash
docker compose up -d
```

Production:
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_DB` | subscription_tracker | Database name |
| `POSTGRES_USER` | postgres | Database user |
| `POSTGRES_PASSWORD` | postgres | Database password |
| `JWT_SECRET` | (required) | JWT signing key |
| `JWT_EXPIRATION` | 86400000 | JWT expiry (24h) |
| `MAIL_HOST` | smtp.gmail.com | SMTP server |
| `MAIL_PORT` | 587 | SMTP port |
| `MAIL_USERNAME` | - | Email address |
| `MAIL_PASSWORD` | - | Email app password |
| `STRIPE_SECRET_KEY` | - | Stripe API key |
| `FRONTEND_URL` | http://localhost:3000 | Frontend URL |
| `CORS_ORIGINS` | localhost origins | CORS allowed origins |

---

## Ports

| Service | Internal Port | External Port |
|---------|---------------|---------------|
| PostgreSQL | 5432 | 5432 (dev only) |
| Backend API | 8084 | 8084 (dev only) |
| Frontend (Nginx) | 80 | 80 |

---

## Health Checks

| Endpoint | Description |
|----------|-------------|
| `http://localhost/health` | Frontend health |
| `http://localhost:8084/api/health` | Backend health |

---

## Kubernetes & Jenkins

For Kubernetes deployment, use the individual images:
- `adityaubale08/subtracker-db:latest`
- `adityaubale08/subtracker-backend:latest`
- `adityaubale08/subtracker-frontend:latest`

This allows:
- Independent scaling of services
- Separate resource allocation
- Rolling updates per service
- Database persistence with PersistentVolumeClaims

---

## Cleanup

```bash
# Stop and remove containers
docker compose down

# Remove volumes (deletes data!)
docker compose down -v

# Remove all SubTracker images
docker rmi adityaubale08/subtracker:latest
docker rmi adityaubale08/subtracker-db:latest
docker rmi adityaubale08/subtracker-backend:latest
docker rmi adityaubale08/subtracker-frontend:latest
```
