## Kubernetes telepítés

A projekt alapból Docker Compose-zal futtatható. Ha Kubernetesben kell futtatni/bemutatni, a manifestek a `deployment/` mappában vannak.

Két összeállítás van:

- `deployment/local/`: helyben buildelt image-ekkel (pl. Docker Desktop Kubernetes / minikube). Itt `imagePullPolicy: Never` van beállítva.
- `deployment/prod/`: registry-ből letöltött image-ekkel (GHCR). Itt `imagePullPolicy: IfNotPresent` van beállítva.

### Előfeltételek

- `kubectl`
- futó Kubernetes klaszter (pl. Docker Desktop Kubernetes)
- `deployment/local/` használatakor: Docker (a lokális image buildhez)

### Local telepítés (helyi image-ek)

1) Image-ek buildelése és tag-elése:

```powershell
.\tools\docker_build_all.ps1
```

2) Manifestek apply:

```powershell
kubectl apply -f .\deployment\local
```

### Prod telepítés

```powershell
kubectl apply -f .\deployment\prod
```

### Ellenőrzés

```powershell
kubectl get ns
kubectl -n projektfeladat-local get pods
kubectl -n projektfeladat-local get svc
```

Prod telepítésnél a névtér (namespace) neve: `projektfeladat-prod`.

### Elérés (port-forward)

```powershell
kubectl -n projektfeladat-local port-forward svc/frontend 8080:80
kubectl -n projektfeladat-local port-forward svc/backend 5187:8080
kubectl -n projektfeladat-local port-forward svc/mcp-server 5190:3000
```

- UI: http://localhost:8080
- Backend health: http://localhost:5187/api/health
- MCP endpoint: http://localhost:5190/mcp
