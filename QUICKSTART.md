# Quick Start Guide

## What Was Created

This setup includes two repositories:

### 1. messaging-k8s (D:\messaging-backend\messaging-k8s)
Kubernetes manifests for deploying to Azure AKS following the Arts-k8s pattern.

### 2. messaging-backend (D:\messaging-backend\messaging-backend)
Updated with Docker and CI/CD configurations.

## Repository Structure

```
messaging-k8s/
├── base/                           # Base Kubernetes manifests
│   ├── deployment.yaml             # Spring Boot deployment
│   ├── service.yaml                # ClusterIP service
│   ├── postgres.yaml               # CloudNativePG cluster
│   ├── ingress.yaml                # Optional ingress
│   ├── image-automation.yaml       # FluxCD automation
│   └── kustomization.yaml          # Base config
├── acceptance/                     # Acceptance environment
│   ├── .sops.yaml                  # SOPS config
│   ├── kustomization.yaml          # Acceptance patches
│   └── messaging-secret.yaml       # Secrets (encrypt before commit!)
├── staging/                        # Staging environment
│   ├── .sops.yaml
│   ├── kustomization.yaml
│   └── messaging-secret.yaml
├── production/                     # Production environment
│   ├── .sops.yaml
│   ├── kustomization.yaml
│   └── messaging-secret.yaml
├── flux/                           # FluxCD configuration
│   ├── kustomization.yaml
│   ├── gitrepository.yaml
│   └── kustomization-*.yaml
├── README.md                       # Main documentation
├── DEPLOYMENT.md                   # Detailed deployment guide
└── renovate.json5                  # Automated updates

messaging-backend/
├── Dockerfile                      # Multi-stage Docker build
├── .dockerignore                   # Docker ignore patterns
├── docker-compose.yml              # Local testing
├── .github/workflows/
│   └── build-push.yml              # CI/CD pipeline
└── src/main/resources/
    └── application-k8s.yml         # Kubernetes profile
```

## Next Steps

### 1. Test Locally

```bash
cd D:\messaging-backend\messaging-backend

# Build and run with Docker Compose
docker-compose up --build

# Test endpoints
curl http://localhost:9000/actuator/health
```

### 2. Push to GitHub

```bash
# Initialize messaging-k8s repository
cd D:\messaging-backend\messaging-k8s
git add .
git commit -m "Initial Kubernetes manifests for messaging backend"
git remote add origin git@github.com:Auruscent/messaging-k8s.git
git push -u origin main

# Update messaging-backend repository
cd D:\messaging-backend\messaging-backend
git add Dockerfile .dockerignore docker-compose.yml .github/ src/main/resources/application-k8s.yml
git commit -m "Add Kubernetes deployment configuration"
git push
```

### 3. Configure Secrets

**IMPORTANT**: Before committing, encrypt secrets with SOPS!

```bash
cd D:\messaging-backend\messaging-k8s

# Generate GPG keys for each environment (see DEPLOYMENT.md)
# Update .sops.yaml files with your GPG fingerprints
# Update secret values in each environment
# Then encrypt:

sops -e -i acceptance/messaging-secret.yaml
sops -e -i staging/messaging-secret.yaml
sops -e -i production/messaging-secret.yaml
```

### 4. Deploy to AKS

See `DEPLOYMENT.md` for detailed instructions:

```bash
# Quick deployment (after AKS setup)
kubectl apply -k staging/

# Or use FluxCD for GitOps
kubectl apply -k flux/
```

## Key Configuration Points

### Update These Values

1. **Container Registry** (if not using GHCR):
   - Update `base/deployment.yaml` image URL
   - Update `.github/workflows/build-push.yml` registry settings

2. **Domain Names**:
   - Update `base/ingress.yaml` with your domain
   - Update environment kustomizations with correct URLs

3. **Secrets** (in each environment):
   - `APP_JWT_SECRET`: Generate strong secret
   - `SPRING_MAIL_USERNAME`: Your email
   - `SPRING_MAIL_PASSWORD`: App password
   - Database credentials (if not using CloudNativePG auto-generated)

4. **CORS Origins**:
   - Update in environment kustomizations to match your frontend URLs

5. **Azure Blob Storage** (for backups):
   - Update `postgres-backup` secret with Azure credentials

## Environment Differences

| Setting | Acceptance | Staging | Production |
|---------|-----------|---------|------------|
| Namespace | messaging-acceptance | messaging-staging | messaging-production |
| Replicas | 1 | 1 | 2 |
| Memory | 512Mi-1Gi | 1Gi-2Gi | 2Gi-4Gi |
| CPU | 100m | 200m | 500m-1000m |
| DB Instances | 1 | 1 | 2 |
| DB Storage | 5Gi | 10Gi | 20Gi |
| DB Backups | Disabled | Disabled | Enabled |
| Image Auto-update | Enabled | Enabled | Disabled |

## GitHub Actions Workflow

The workflow automatically:
1. Runs tests on every push/PR
2. Builds Docker image on push to main/develop
3. Tags images with version-sha-timestamp
4. Pushes to GitHub Container Registry
5. FluxCD can auto-deploy to staging (if configured)

## Monitoring & Health Checks

- **Liveness**: `/actuator/health/liveness` on port 8000
- **Readiness**: `/actuator/health/readiness` on port 8000
- **Metrics**: `/actuator/metrics` on port 8000
- **Application**: Port 8080

## Troubleshooting

### Secrets Not Decrypting
- Verify SOPS GPG keys are configured in cluster
- Check FluxCD has access to sops-gpg secret

### Image Pull Errors
- Verify `messaging-reg-cred` secret exists in namespace
- Check GitHub token has `read:packages` permission

### Database Connection Issues
- Check CloudNativePG cluster status: `kubectl get cluster -n <namespace>`
- Verify database pods are running
- Check connection credentials in secrets

### Pod CrashLoopBackOff
- Check logs: `kubectl logs -n <namespace> <pod-name>`
- Verify all required environment variables are set
- Check database is accessible

## Additional Resources

- **Full Deployment Guide**: See `DEPLOYMENT.md`
- **Main README**: See `README.md`
- **Arts-k8s Reference**: D:\Artwork\Arts-k8s (for pattern examples)

## Support

For issues or questions:
1. Check logs: `kubectl logs -n <namespace> -l app=messaging`
2. Check events: `kubectl get events -n <namespace>`
3. Review DEPLOYMENT.md for detailed troubleshooting
