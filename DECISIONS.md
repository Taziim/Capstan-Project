# Engineering Decisions — Support Chat Delivery Platform

## Overview

The Support Chat application is delivered through three long-lived Git branches: `dev`, `stage`, and `prod`. Feature branches are merged into `dev`, validated and promoted to `stage`, and finally promoted to `prod`.

This model makes the promotion path explicit and provides increasing release control as code moves toward production.

## Branching Strategy

Feature work is performed in short-lived `feature/*` branches. Pull requests are required for `dev`, `stage`, and `prod`. CI must pass before changes can be merged. Direct pushes to the three environment branches are disabled.

The intended flow is:

`feature → dev → stage → prod`

## CI/CD

GitHub Actions is used for CI/CD. Every environment branch is automatically validated through linting, application builds, and Docker build validation.

Development and staging deployment are deliberately manual. A change reaching `dev` or `stage` does not automatically modify the running Kubernetes environment. A human must explicitly start the corresponding deployment workflow.

Production follows the assignment's stricter rule. A pull request opened against `prod` automatically triggers the production validation and release workflow, without requiring a separate manual deployment action.

## Container Versioning

Docker images are published to GitHub Container Registry. Images are tagged using both the target environment and the source Git commit:

`dev-<sha>`, `stage-<sha>`, and `prod-<sha>`.

This avoids mutable `latest`-only deployments and allows an operator to determine exactly which source revision produced a running container.

Development and production Docker images are intentionally separate. Development images retain development tooling and behavior, while production images use optimized multi-stage builds and a minimal runtime image.

## Kubernetes

Kubernetes resources are separated by environment using namespaces and environment-specific manifests.

Each environment contains separate Deployments and Services for the frontend and backend. No Ingress resource is used because ingress is explicitly outside the assignment scope.

The backend currently uses in-memory Socket.IO state and therefore is not horizontally scalable without a shared Socket.IO adapter. For that reason, the production Deployment does not pretend that multiple replicas provide valid Socket.IO scaling.

## GitOps and Argo CD

Argo CD is responsible for reconciling Kubernetes state. GitHub Actions does not directly run `kubectl apply` as the normal deployment mechanism.

Instead, successful deployment workflows build and publish immutable images and update the corresponding environment's Kubernetes manifest in Git. Argo CD observes the Git change and reconciles the Kubernetes cluster to the declared state.

Three Argo CD Applications separately track the `dev`, `stage`, and `prod` manifests.

This provides an auditable chain:

`Git commit → CI validation → Docker image → GitOps manifest → Argo CD → Kubernetes`

## Security and Reliability

Secrets such as registry credentials are kept in GitHub Secrets rather than committed to the repository. Kubernetes health probes use the backend's `/api/health` endpoint. Production containers use a non-root runtime where practical.

The application contains no database by design, so no database infrastructure is introduced unnecessarily.

## Result

The resulting platform provides a repeatable promotion path from developer code to production while enforcing progressively stronger controls:

`Feature → Dev → Stage → Production`

Development and staging require explicit human deployment decisions, while production follows the assignment's automatic pull-request-triggered release requirement.
