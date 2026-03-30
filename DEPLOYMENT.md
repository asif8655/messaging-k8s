# Deployment Guide for Messaging Backend on Azure AKS

This guide walks you through deploying the messaging backend application to Azure Kubernetes Service (AKS).

## Prerequisites

### Required Tools
- Azure CLI (`az`)
- kubectl
- Kustomize (or kubectl 1.14+)
- SOPS (for secret encryption)
- GPG (for SOPS key management)
- Docker (for local testing)

### Azure Resources
- Azure subscription
- Azure Kubernetes Service (AKS) cluster
- Azure Container Registry (optional, using GHCR by default)

## Step 1: Prepare AKS Cluster

### Create AKS Cluster (if needed)

```bash
# Set variables
RESOURCE_GROUP="messaging-rg"
CLUSTER_NAME="messaging-aks"
LOCATION="eastus"

# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create AKS cluster
az aks create \
  --resource-group $RESOURCE_GROUP \
  --name $CLUSTER_NAME \
  --node-count 3 \
  --node-vm-size Standard_D2s_v3 \
  --enable-managed-identity \
  --enable-addons monitoring \
  --generate-ssh-keys

# Get credentials
az aks get-credentials --resource-group $RESOURCE_GROUP --name $CLUSTER_NAME
```

### Verify cluster access

```bash
kubectl get nodes
```

## Step 2: Install Required Operators

### Install CloudNativePG Operator

```bash
kubectl apply -f https://raw.githubusercontent.com/cloudnative-pg/cloudnative-pg/release-1.22/releases/cnpg-1.22.0.yaml
```

### Install FluxCD (Optional)

```bash
flux install
```

### Install SOPS for Secret Decryption

If using FluxCD with SOPS:

```bash
# Generate GPG key for each environment
gpg --batch --full-generate-key <<EOF
%no-protection
Key-Type: RSA
Key-Length: 4096
Subkey-Type: RSA
Subkey-Length: 4096
Name-Real: Messaging Acceptance
Name-Email: messaging-acceptance@yourdomain.com
Expire-Date: 0
EOF

# Export public key
gpg --export --armor "messaging-acceptance@yourdomain.com" > acceptance/.sops.pub.asc

# Get fingerprint and update .sops.yaml
gpg --list-keys --fingerprint "messaging-acceptance@yourdomain.com"
```

Repeat for staging and production environments.

## Step 3: Create Namespaces

```bash
kubectl create namespace messaging-acceptance
kubectl create namespace messaging-staging
kubectl create namespace messaging-production
```

## Step 4: Configure Container Registry Access

### For GitHub Container Registry (GHCR)

```bash
# Create GitHub personal access token with read:packages permission
# Then create image pull secret

kubectl create secret docker-registry messaging-reg-cred \
  --docker-server=ghcr.io \
  --docker-username=YOUR_GITHUB_USERNAME \
  --docker-password=YOUR_GITHUB_TOKEN \
  --docker-email=YOUR_EMAIL \
  -n messaging-acceptance

kubectl create secret docker-registry messaging-reg-cred \
  --docker-server=ghcr.io \
  --docker-username=YOUR_GITHUB_USERNAME \
  --docker-password=YOUR_GITHUB_TOKEN \
  --docker-email=YOUR_EMAIL \
  -n messaging-staging

kubectl create secret docker-registry messaging-reg-cred \
  --docker-server=ghcr.io \
  --docker-username=YOUR_GITHUB_USERNAME \
  --docker-password=YOUR_GITHUB_TOKEN \
  --docker-email=YOUR_EMAIL \
  -n messaging-production
```

## Step 5: Configure Secrets

### Update Secret Values

Edit the secret files for each environment:

```bash
# Edit acceptance secrets
vi acceptance/messaging-secret.yaml

# Update with actual values:
# - APP_JWT_SECRET
# - SPRING_MAIL_USERNAME
# - SPRING_MAIL_PASSWORD
```

### Encrypt Secrets with SOPS

```bash
# Encrypt acceptance secrets
cd acceptance
sops -e -i messaging-secret.yaml

# Encrypt staging secrets
cd ../staging
sops -e -i messaging-secret.yaml

# Encrypt production secrets
cd ../production
sops -e -i messaging-secret.yaml
```

### Configure SOPS in Cluster (if using FluxCD)

```bash
# Export GPG private key
gpg --export-secret-keys --armor "messaging-acceptance@yourdomain.com" > acceptance-private.key

# Create Kubernetes secret
kubectl create secret generic sops-gpg \
  --from-file=acceptance.asc=acceptance-private.key \
  -n flux-system

# Clean up private key file
rm acceptance-private.key
```

## Step 6: Configure Azure Blob Storage for Backups

```bash
# Create storage account
STORAGE_ACCOUNT="messagingbackup"
az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS

# Get storage key
STORAGE_KEY=$(az storage account keys list \
  --account-name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --query '[0].value' -o tsv)

# Create container
az storage container create \
  --name messaging-backups \
  --account-name $STORAGE_ACCOUNT \
  --account-key $STORAGE_KEY

# Update postgres-backup secret in each environment
kubectl create secret generic postgres-backup \
  --from-literal=AZURE_STORAGE_ACCOUNT=$STORAGE_ACCOUNT \
  --from-literal=AZURE_STORAGE_KEY=$STORAGE_KEY \
  -n messaging-production
```

## Step 7: Deploy Application

### Option A: Manual Deployment with kubectl

```bash
# Deploy to acceptance
kubectl apply -k acceptance/

# Verify deployment
kubectl get pods -n messaging-acceptance
kubectl get cluster -n messaging-acceptance

# Deploy to staging
kubectl apply -k staging/

# Deploy to production
kubectl apply -k production/
```

### Option B: FluxCD GitOps Deployment

```bash
# Create deploy key for repository
flux create secret git messaging-k8s-deploy-key \
  --url=ssh://git@github.com/Auruscent/messaging-k8s \
  -n flux-system

# Apply FluxCD configuration
kubectl apply -k flux/

# Monitor reconciliation
flux get kustomizations
flux logs
```

## Step 8: Verify Deployment

### Check Pod Status

```bash
kubectl get pods -n messaging-staging
kubectl logs -n messaging-staging -l app=messaging
```

### Check Database Cluster

```bash
kubectl get cluster -n messaging-staging
kubectl get pods -n messaging-staging -l cnpg.io/cluster=messaging-db
```

### Test Health Endpoints

```bash
# Port forward to test
kubectl port-forward -n messaging-staging svc/messaging 8080:8080 8000:8000

# Test health endpoint
curl http://localhost:8000/actuator/health
```

## Step 9: Configure Ingress (Optional)

### Install nginx-ingress Controller

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.annotations."service\.beta\.kubernetes\.io/azure-load-balancer-health-probe-request-path"=/healthz
```

### Update Ingress Configuration

Edit `base/kustomization.yaml` to uncomment ingress.yaml, then update domain names in environment kustomizations.

## Step 10: Configure Monitoring

### Enable Azure Monitor Container Insights

```bash
az aks enable-addons \
  --resource-group $RESOURCE_GROUP \
  --name $CLUSTER_NAME \
  --addons monitoring
```

### View Logs and Metrics

```bash
# View logs in Azure Portal
# Navigate to: AKS Cluster -> Logs -> Container Logs

# Or use kubectl
kubectl logs -n messaging-production -l app=messaging --tail=100 -f
```

## Updating the Application

### Update Image Version

Edit the appropriate environment's `kustomization.yaml`:

```yaml
images:
  - name: ghcr.io/auruscent/messaging-backend
    newTag: v1.0.0-abc1234-1234567890  # Update this
```

Then apply:

```bash
kubectl apply -k production/
```

### Rollback Deployment

```bash
kubectl rollout undo deployment/messaging-deployment -n messaging-production
kubectl rollout status deployment/messaging-deployment -n messaging-production
```

## Troubleshooting

### Pod Not Starting

```bash
kubectl describe pod -n messaging-staging <pod-name>
kubectl logs -n messaging-staging <pod-name>
```

### Database Connection Issues

```bash
# Check database cluster status
kubectl get cluster -n messaging-staging messaging-db

# Check database pods
kubectl get pods -n messaging-staging -l cnpg.io/cluster=messaging-db

# Check database logs
kubectl logs -n messaging-staging messaging-db-1
```

### Secret Decryption Issues

```bash
# Verify SOPS GPG secret exists
kubectl get secret sops-gpg -n flux-system

# Check FluxCD logs
flux logs --kind=Kustomization --name=messaging-staging
```

### Image Pull Issues

```bash
# Verify image pull secret
kubectl get secret messaging-reg-cred -n messaging-staging

# Test image pull manually
kubectl run test --image=ghcr.io/auruscent/messaging-backend:latest \
  --image-pull-policy=Always \
  -n messaging-staging \
  --overrides='{"spec":{"imagePullSecrets":[{"name":"messaging-reg-cred"}]}}'
```

## Cleanup

```bash
# Delete specific environment
kubectl delete -k staging/

# Delete all resources
kubectl delete namespace messaging-acceptance
kubectl delete namespace messaging-staging
kubectl delete namespace messaging-production

# Delete AKS cluster
az aks delete --resource-group $RESOURCE_GROUP --name $CLUSTER_NAME --yes
```

## Security Best Practices

1. **Secrets**: Always encrypt secrets with SOPS before committing
2. **RBAC**: Configure proper role-based access control
3. **Network Policies**: Implement network policies for pod-to-pod communication
4. **Image Scanning**: Enable vulnerability scanning in container registry
5. **Regular Updates**: Keep operators and Kubernetes version up to date
6. **Backup Testing**: Regularly test database backup and restore procedures

## Additional Resources

- [CloudNativePG Documentation](https://cloudnative-pg.io/)
- [FluxCD Documentation](https://fluxcd.io/)
- [SOPS Documentation](https://github.com/mozilla/sops)
- [Azure AKS Documentation](https://docs.microsoft.com/en-us/azure/aks/)
