# ============================================
# SubTracker - Kubernetes Deployment Guide
# ============================================

## Prerequisites

1. **Kubernetes Cluster** - Minikube, Docker Desktop K8s, or cloud provider
2. **kubectl** - Kubernetes command-line tool
3. **Docker Images** - Already pushed to Docker Hub:
   - `adityaubale08/subtracker-db:latest`
   - `adityaubale08/subtracker-backend:latest`
   - `adityaubale08/subtracker-frontend:latest`

---

## Quick Deploy

### Option 1: Deploy Everything at Once
```bash
kubectl apply -f k8s/
```

### Option 2: Deploy Step by Step
```bash
# 1. Create namespace
kubectl apply -f k8s/namespace.yaml

# 2. Create ConfigMap and Secrets
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml

# 3. Create Persistent Volume Claim
kubectl apply -f k8s/database-pvc.yaml

# 4. Deploy Database
kubectl apply -f k8s/database-deployment.yaml

# 5. Wait for database to be ready
kubectl wait --for=condition=ready pod -l component=database -n subtracker --timeout=120s

# 6. Deploy Backend
kubectl apply -f k8s/backend-deployment.yaml

# 7. Wait for backend to be ready
kubectl wait --for=condition=ready pod -l component=backend -n subtracker --timeout=180s

# 8. Deploy Frontend
kubectl apply -f k8s/frontend-deployment.yaml

# 9. Deploy Ingress (if using Ingress Controller)
kubectl apply -f k8s/ingress.yaml
```

---

## Accessing the Application

### Option 1: Using Ingress (Recommended)
Add to your hosts file (`C:\Windows\System32\drivers\etc\hosts`):
```
127.0.0.1 subtracker.local
```
Then access: http://subtracker.local

### Option 2: Using NodePort
Access via: http://localhost:30080

### Option 3: Using Port Forward
```bash
# Forward frontend
kubectl port-forward svc/subtracker-frontend 3000:80 -n subtracker

# Forward backend (for API testing)
kubectl port-forward svc/subtracker-backend 8084:8084 -n subtracker
```
Then access: http://localhost:3000

---

## Useful Commands

### Check Status
```bash
# All resources in namespace
kubectl get all -n subtracker

# Pods status
kubectl get pods -n subtracker

# Services
kubectl get svc -n subtracker

# Ingress
kubectl get ingress -n subtracker
```

### View Logs
```bash
# Database logs
kubectl logs -f deployment/subtracker-db -n subtracker

# Backend logs
kubectl logs -f deployment/subtracker-backend -n subtracker

# Frontend logs
kubectl logs -f deployment/subtracker-frontend -n subtracker
```

### Debug
```bash
# Describe pod (for troubleshooting)
kubectl describe pod <pod-name> -n subtracker

# Execute into container
kubectl exec -it <pod-name> -n subtracker -- /bin/sh
```

### Scale
```bash
# Scale backend to 3 replicas
kubectl scale deployment subtracker-backend --replicas=3 -n subtracker

# Scale frontend to 3 replicas
kubectl scale deployment subtracker-frontend --replicas=3 -n subtracker
```

---

## Update Deployment

After pushing new Docker images:
```bash
# Restart deployments to pull new images
kubectl rollout restart deployment/subtracker-backend -n subtracker
kubectl rollout restart deployment/subtracker-frontend -n subtracker

# Check rollout status
kubectl rollout status deployment/subtracker-backend -n subtracker
```

---

## Cleanup

```bash
# Delete all resources
kubectl delete -f k8s/

# Or delete namespace (removes everything)
kubectl delete namespace subtracker
```

---

## Minikube Quick Start

```bash
# Start Minikube
minikube start

# Enable Ingress
minikube addons enable ingress

# Deploy application
kubectl apply -f k8s/

# Get Minikube IP
minikube ip

# Access application
# Add to hosts file: <minikube-ip> subtracker.local
# Then open: http://subtracker.local
```

---

## Docker Desktop Kubernetes

```bash
# Enable Kubernetes in Docker Desktop settings
# Then deploy:
kubectl apply -f k8s/

# Access via NodePort
http://localhost:30080

# Or use port-forward
kubectl port-forward svc/subtracker-frontend 3000:80 -n subtracker
http://localhost:3000
```

---

## Architecture

```
                    ┌─────────────────────────────────────────────┐
                    │           Kubernetes Cluster                 │
                    │                                              │
                    │  ┌─────────────────────────────────────────┐ │
                    │  │          Ingress Controller              │ │
Internet ───────────┼─►│     (nginx-ingress / traefik)           │ │
                    │  └────────────────┬────────────────────────┘ │
                    │                   │                          │
                    │         ┌─────────┴─────────┐                │
                    │         │                   │                │
                    │         ▼                   ▼                │
                    │  ┌─────────────┐     ┌─────────────┐         │
                    │  │  Frontend   │     │   Backend   │         │
                    │  │ (2 replicas)│     │ (2 replicas)│         │
                    │  │   Nginx     │     │ Spring Boot │         │
                    │  └─────────────┘     └──────┬──────┘         │
                    │                             │                │
                    │                             ▼                │
                    │                      ┌─────────────┐         │
                    │                      │  Database   │         │
                    │                      │ PostgreSQL  │         │
                    │                      │ (1 replica) │         │
                    │                      └──────┬──────┘         │
                    │                             │                │
                    │                      ┌──────┴──────┐         │
                    │                      │     PVC     │         │
                    │                      │  (5Gi disk) │         │
                    │                      └─────────────┘         │
                    └──────────────────────────────────────────────┘
```
