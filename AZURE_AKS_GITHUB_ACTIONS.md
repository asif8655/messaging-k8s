# Azure AKS + GitHub Actions Deployment Guide

This is the recommended setup for your project on Azure because it is both **common in the market** and a good production pattern:

- **AKS** for Kubernetes
- **Azure Container Registry (ACR)** for container images
- **GitHub Actions** for CI/CD
- **NGINX Ingress** for routing
- **PostgreSQL** either in-cluster for now or later Azure Database for PostgreSQL Flexible Server

## Current safe state before Azure exists

The workflows are now split into two modes:

1. **Always-on CI**
   - backend tests
   - frontend lint/build
   - Docker build checks for both apps

2. **Optional Azure publish/deploy**
   - Azure image publishing only runs when repository variable
     `ENABLE_AZURE_PUBLISH=true`
   - AKS deployment is manual only for now

This means you can push the repo now even before creating Azure resources.

## Recommended market-standard architecture

### Best practical Azure stack
1. **Frontend** -> React app in AKS
2. **Backend** -> Spring Boot app in AKS
3. **Images** -> pushed to ACR
4. **Ingress** -> one domain with path routing
   - `/` -> frontend
   - `/api` -> backend
   - `/ws` -> backend websocket
5. **CI/CD** -> GitHub Actions
6. **Azure publish** -> optional, enabled only after Azure is ready
7. **Deployment** -> manual GitHub Actions deployment from `messaging-k8s`

## Why this is good for market use

- AKS + ACR is widely used in Azure environments
- GitHub Actions is commonly used for CI/CD
- Separate frontend/backend image pipelines scale well
- Path-based ingress reduces CORS complexity
- Manual production promotion is safer than full automatic production deploy

## Repositories expected

This workspace already looks organized as separate repos:

- `messaging-backend`
- `messagin-app`
- `messaging-k8s`

### Flow
1. Backend repo runs tests and Docker build check
2. Frontend repo runs lint/build and Docker build check
3. After Azure is ready, set `ENABLE_AZURE_PUBLISH=true`
4. Backend/frontend then publish images to ACR
5. `messaging-k8s` deploys manually to AKS using workflow inputs

## GitHub secrets and variables

Configure these in **backend**, **frontend**, and **k8s** repos.

### Secrets
- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`

### Variables
- `ENABLE_AZURE_PUBLISH` -> set to `true` only after Azure is ready
- `ACR_NAME`
- `ACR_LOGIN_SERVER`

Additional in **messaging-k8s** repo:
- `AKS_RESOURCE_GROUP`
- `AKS_CLUSTER_NAME`

> Note: `K8S_REPO_PAT` is not required right now because automatic repository-dispatch deployment has been removed until Azure is ready.

## Important: pushing workflow files to GitHub

If you push changes to `.github/workflows/*.yml` using HTTPS and a Personal Access Token,
that token must allow workflow-file updates.

### If you use a classic PAT
It needs:
- `repo`
- `workflow`

### Better option
Use **SSH** for git push instead of HTTPS.

Example:

```bash
git remote set-url origin git@github.com:asif8655/messagin-app.git
```

Also, if a token was exposed publicly, revoke it immediately and create a new one.

## Azure setup commands

### Create ACR

```bash
az acr create --resource-group <rg> --name <acrName> --sku Basic
```

### Create AKS

```bash
az aks create \
  --resource-group <rg> \
  --name <aksName> \
  --node-count 2 \
  --enable-managed-identity \
  --attach-acr <acrName> \
  --generate-ssh-keys
```

### Get kubeconfig

```bash
az aks get-credentials --resource-group <rg> --name <aksName>
```

## Domain strategy

Use one host per environment:

- `messaging-acceptance.yourdomain.com`
- `messaging-staging.yourdomain.com`
- `messaging.yourdomain.com`

Ingress routes:

- `/` -> frontend
- `/api` -> backend
- `/ws` -> backend

This keeps frontend env values simple.

## Database recommendation

### Short term
You can continue with the current Kubernetes PostgreSQL setup.

### Better Azure production option
Move later to **Azure Database for PostgreSQL Flexible Server**.

That is more common for production teams because:
- backups are managed
- upgrades are easier
- database is outside cluster lifecycle
- operations are simpler

## Deployment strategy

### Staging
- manual for now, until Azure resources are created and configured

### Production
- manual deploy from `messaging-k8s` workflow

## First deployment steps

1. Create AKS and ACR
2. Install ingress controller
3. Configure DNS and TLS
4. Set GitHub secrets/variables
5. Run backend workflow
6. Run frontend workflow
7. In `messaging-k8s`, run **Deploy to Azure AKS** workflow with:
   - `environment=staging`
   - backend image tag
   - frontend image tag

## Next improvements after this implementation

1. Move secrets to Azure Key Vault
2. Add cert-manager
3. Add frontend unit tests
4. Add backend integration tests
5. Replace in-cluster PostgreSQL with Azure Database for PostgreSQL Flexible Server
6. Add monitoring with Azure Monitor / Prometheus / Grafana
