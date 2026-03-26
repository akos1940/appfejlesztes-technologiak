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

## 5-ös szint: Helm + ArgoCD

Ebben a kiegészítésben:

- MongoDB Helm charttal települ a helyi klaszterre.
- A többi komponens ArgoCD Application-ökön keresztül a repóból automatikusan deployolódik és syncelődik.

### 1) ArgoCD manuális telepítése

Példa telepítés (upstream install manifest):

```powershell
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

ArgoCD UI elérés (opcionális):

```powershell
kubectl -n argocd port-forward svc/argocd-server 8081:443
```

Ekkor a UI: https://localhost:8081

### 2) MongoDB telepítése Helm charttal (local namespace)

Bitnami chart használata, a service név `mongo` marad, így a meglévő `mongodb://mongo:27017` connection string változatlanul működik.

```powershell
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
helm upgrade --install mongo bitnami/mongodb \
	--namespace projektfeladat-local \
	--create-namespace \
	-f .\deployment\helm\mongodb-local-values.yaml
```

### 3) ArgoCD Application-ök telepítése

Az Application manifestek a repóban: `deployment/argocd/`.

```powershell
kubectl apply -f .\deployment\argocd
```

Mit deployol ArgoCD:

- `projektfeladat-local` komponensek a `deployment/local/` útvonalról, de a `mongo.yaml` kizárva (mert azt Helm kezeli).
- `projektfeladat-prod` komponensek a `deployment/prod/` útvonalról.

Mindkét Application `automated` sync policy-val van beállítva (`prune` + `selfHeal`).

### 4) Ellenőrzés

```powershell
kubectl get applications -n argocd
kubectl -n projektfeladat-local get pods
kubectl -n projektfeladat-prod get pods
```

### Megjegyzések

- A `docker-compose.yml` továbbra is fejlesztési/gyors teszt célra ajánlott.
- Prod image-ek GHCR-ről jönnek (`IfNotPresent`), local környezetben pedig helyi buildelt image-eket használ a deployment (`Never`).
