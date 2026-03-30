# Messaging K8s Manifests

This repository is a Kubernetes manifests repository for the messaging system.
It should not build frontend or backend applications directly.

## What This Repo Contains

- Base Kubernetes resources in base/
- Environment overlays in acceptance/, staging/, and production/
- Optional Flux manifests in flux/

## Deployment Model

- Frontend and backend repositories build and push container images.
- This repository stores the image tags used by each environment.
- Updating an overlay tag triggers deployment via your GitOps or manual AKS flow.

## Automated Staging Tag Updates

The workflow in .github/workflows/build-push.yml updates staging image tags when it receives a repository dispatch event:

- Event: deploy-staging
- Payload service: backend or frontend
- Payload tags: backend_image_tag or frontend_image_tag

Updated file:
- staging/kustomization.yaml

## Manual Deploy

Use kustomize overlays directly:

```bash
kubectl apply -k acceptance/
kubectl apply -k staging/
kubectl apply -k production/
```

## Notes

- Keep secrets encrypted in environment secret manifests.
- Keep image names in overlay kustomization images section aligned with deployed deployments.
