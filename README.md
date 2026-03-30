<<<<<<< HEAD
# Messaging Backend K8s Deployment

This repository contains Kubernetes manifests for deploying the messaging backend application to Azure Kubernetes Service (AKS).

## Architecture

- **Configuration Management**: Kustomize with base + environment overlays
- **Environments**: acceptance, staging, production
- **Database**: CloudNativePG operator for PostgreSQL clusters
- **Secrets**: SOPS-encrypted secrets per environment
- **GitOps**: Optional FluxCD for automated deployments

## Repository Structure

```
messaging-k8s/
├── base/                    # Base Kubernetes manifests
│   ├── deployment.yaml      # Messaging backend deployment
│   ├── service.yaml         # ClusterIP service
│   ├── postgres.yaml        # PostgreSQL cluster (CloudNativePG)
│   ├── ingress.yaml         # Optional ingress
│   └── kustomization.yaml   # Base kustomization
├── acceptance/              # Acceptance environment
│   ├── kustomization.yaml   # Acceptance patches
│   └── messaging-secret.yaml # SOPS encrypted secrets
├── staging/                 # Staging environment
│   ├── kustomization.yaml   # Staging patches
│   └── messaging-secret.yaml # SOPS encrypted secrets
├── production/              # Production environment
│   ├── kustomization.yaml   # Production patches
│   └── messaging-secret.yaml # SOPS encrypted secrets
└── flux/                    # FluxCD configuration (optional)
```

## Prerequisites

- Azure Kubernetes Service (AKS) cluster
- kubectl configured to access the cluster
- Kustomize (or kubectl 1.14+)
- SOPS for secret encryption/decryption
- CloudNativePG operator installed in cluster

## Deployment

### Manual Deployment

Deploy to a specific environment:

```bash
# Acceptance
kubectl apply -k acceptance/

# Staging
kubectl apply -k staging/

# Production
kubectl apply -k production/
```

### FluxCD Deployment

If using FluxCD for GitOps:

```bash
# Apply FluxCD configuration
kubectl apply -k flux/
```

FluxCD will automatically sync and deploy changes from this repository.

## Secret Management

Secrets are encrypted using SOPS. To decrypt and view:

```bash
sops -d acceptance/messaging-secret.yaml
```

To edit encrypted secrets:

```bash
sops acceptance/messaging-secret.yaml
```

## Environment Configuration

### Acceptance
- Namespace: `messaging-acceptance`
- Replicas: 1
- Resources: 512Mi-1Gi memory
- Database: 1 PostgreSQL instance

### Staging
- Namespace: `messaging-staging`
- Replicas: 1-2
- Resources: 1Gi-2Gi memory
- Database: 1 PostgreSQL instance

### Production
- Namespace: `messaging-production`
- Replicas: 2-3 (HA)
- Resources: 2Gi-4Gi memory
- Database: 2-3 PostgreSQL instances with backups

## Database

PostgreSQL is managed by CloudNativePG operator:
- Automated backups to Azure Blob Storage
- High availability with streaming replication
- Point-in-time recovery support

## Monitoring

- Spring Boot Actuator endpoints on port 8000
- Health checks: `/actuator/health/liveness` and `/actuator/health/readiness`
- Azure Monitor Container Insights integration

## Updating Image Versions

Update the image tag in the appropriate environment's `kustomization.yaml`:

```yaml
images:
  - name: ghcr.io/auruscent/messaging-backend
    newTag: v1.0.0-abc1234-1234567890
```

Then apply the changes or wait for FluxCD to reconcile.

## Troubleshooting

Check pod status:
```bash
kubectl get pods -n messaging-staging
```

View logs:
```bash
kubectl logs -n messaging-staging -l app=messaging
```

Check database cluster status:
```bash
kubectl get cluster -n messaging-staging
```

## Security

- All secrets are encrypted with SOPS
- Pods run as non-root user
- Security contexts enforce capability dropping
- Network policies can be added for pod-to-pod communication
=======
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
>>>>>>> dd42df4174093ba4f9457ce4ae55458fbe8c814e
