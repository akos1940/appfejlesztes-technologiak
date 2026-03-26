# Alkalmazásfejlesztés technológiái – Projektfeladat (Todo)

Egyszerű full‑stack mintaalkalmazás egy Todo listához. A cél: fejlesztés -> konténerizálás -> CI build -> Docker image push (GHCR).

## Felépítés

- Frontend: Angular (standalone)
	- 2 nézet: lista + új/szerkesztés
	- lapozás (pagination)
- Backend: ASP.NET Web API
	- CRUD REST API
- Adatbázis: MongoDB

## Funkciók

- Feladatok listázása (lapozható)
- Új feladat létrehozása
- Feladat módosítása
- Feladat törlése
- Állapot: nyitott / kész
- Határidő megadása

## Futtatás Dockerrel (ajánlott)

Előfeltétel: Docker Desktop fusson (Windows-on Linux engine).

```bash
docker compose up --build
```

Elérhetőségek:

- UI: http://localhost:8080
- Backend health: http://localhost:5187/api/health
- MCP endpoint: http://localhost:5190/mcp

Gyors MCP teszt (teszt kliens):

```bash
npm.cmd --prefix .\mcp-server run test:client
```

A frontend nginx reverse proxy-n keresztül hívja a backendet az `/api/*` útvonalon.

Leállítás:

```bash
docker compose down
```

Teljes törlés (MongoDB volume is):

```bash
docker compose down -v
```

## Telepítés Kubernetesre

Kubernetes manifestek a `deployment/` mappában:

- `deployment/local/`: lokálisan buildelt image-ekkel (pl. Docker Desktop Kubernetes)
- `deployment/prod/`: GHCR image-ekkel

Az 5-ös szintű kiegészítésben a local MongoDB Helm charttal települ, a többi komponens pedig ArgoCD Application-ökön keresztül syncelődik a repóból.

Részletesebb leírás: [deployment/deployment_guide.md](deployment/deployment_guide.md).

Előfeltételek:

- `kubectl`
- `helm` (5-ös szinthez)
- futó lokális Kubernetes klaszter (pl. Docker Desktop Kubernetes)

### Local telepítés

1) Image-ek build (local tag-ekkel):

```bash
.\tools\docker_build_all.ps1
```

2) Telepítés:

```bash
kubectl apply -f .\deployment\local
```

Ellenőrzés:

```bash
kubectl -n projektfeladat-local get pods
kubectl -n projektfeladat-local get svc
```

Elérés port-forwarddal:

```bash
kubectl -n projektfeladat-local port-forward svc/frontend 8080:80
```

- UI: http://localhost:8080

Backend elérés (ha külön is szükséges):

```bash
kubectl -n projektfeladat-local port-forward svc/backend 5187:8080
```

- Backend health: http://localhost:5187/api/health

MCP server elérés (ha külön is szükséges):

```bash
kubectl -n projektfeladat-local port-forward svc/mcp-server 5190:3000
```

- MCP endpoint: http://localhost:5190/mcp

Törlés:

```bash
kubectl delete ns projektfeladat-local
```

### Prod telepítés (GHCR)

```bash
kubectl apply -f .\deployment\prod
```

Törlés:

```bash
kubectl delete ns projektfeladat-prod
```

### 5-ös szint (Helm + ArgoCD)

- ArgoCD manuális telepítés + Application alapú automatikus sync
- MongoDB Helm chart telepítés local namespace-be

Lépésről lépésre: [deployment/deployment_guide.md](deployment/deployment_guide.md).

## Futtatás más gépen

Előfeltételek:

- Docker Desktop telepítve van és fut (Windows/Mac/Linux)
- Git telepítve (vagy repo letöltése ZIP-ként)

Lépések:

```bash
git clone https://github.com/akos1940/appfejlesztes-technologiak
cd appfejlesztes-technologiak
docker compose up --build -d
```

Ellenőrzés:

- UI: http://localhost:8080/todos
- Backend health: http://localhost:5187/api/health
- Todos JSON: http://localhost:5187/api/todos?page=1&pageSize=10

Leállítás:

```bash
docker compose down
```

Tipp: ha a `localhost` nem elérhető, tipikusan a Docker engine nem fut. El kell indítani a Docker Desktopot, majd újra le kell futtatni a compose parancsot.

## Futtatás lokálisan (Docker nélkül a FE/BE-hez)

Előfeltételek:

- .NET SDK 10
- Node.js + npm

1) MongoDB indítása (csak a mongo service):

```bash
docker compose up -d mongo
```

2) Backend:

```bash
dotnet run --project .\backend
```

3) Frontend:

```bash
npm.cmd --prefix .\frontend start
```

Elérhetőségek:

- UI: http://localhost:4200
- Backend: a konzolban kiírt port (alapból `http://localhost:5187`)

Windows/PowerShell: ha az `npm` futása tiltott aláírás miatt, az `npm.cmd` / `npx.cmd` parancs használható.

## API végpontok

- `GET /api/health`
- `GET /api/todos?page=1&pageSize=10`
- `POST /api/todos`
- `GET /api/todos/{id}`
- `PUT /api/todos/{id}`
- `DELETE /api/todos/{id}`

Példa requestek: [backend/Backend.http](backend/Backend.http)

Tipp: a `GET by id`, `PUT`, `DELETE` requesteknél a `TodoId` értékét le kell cserélni egy létező MongoDB ObjectId-ra (a `POST` válaszában megjelenik).

## CI – Docker image build + push (GHCR)

Workflow: [.github/workflows/ci.yml](.github/workflows/ci.yml)

Publikált image-ek:

- `ghcr.io/akos1940/appfejlesztes-technologiak-backend:latest`
- `ghcr.io/akos1940/appfejlesztes-technologiak-todos-service:latest`
- `ghcr.io/akos1940/appfejlesztes-technologiak-frontend:latest`
- `ghcr.io/akos1940/appfejlesztes-technologiak-mcp-server:latest`

GitHub beállítás: **Settings -> Actions -> General -> Workflow permissions -> Read and write permissions** (különben nem lehet package-et pusholni).

Működés röviden:

- `pull_request`: build (push nélkül)
- `push` a `main` ágra: build + push GHCR-re
- tagek: `sha-...` mindig, `latest` csak default branch-en

## Hibaelhárítás

- Ha semmi nem érhető el a `localhost`-on: ellenőrizni kell, hogy Docker Desktop fut-e, és a `docker compose ps` szerint a konténerek `Up` állapotban vannak.
- Ha a docker CLI ezt írja: `dockerDesktopLinuxEngine ... cannot find the file specified`, akkor a Docker engine nem fut (el kell indítani a Docker Desktopot).

## Használat (egyszerű user guide)

1) Rendszer indítása (ajánlott Dockerrel):

```bash
docker compose up --build
```

2) Felület megnyitása:

- UI: http://localhost:8080

3) Funkciók kipróbálása (UI):

- Listázás + lapozás: a lista nézetben lapozóval lehet oldalt váltani.
- Új feladat: az új feladat nézeten a cím/leírás kitölthető, majd mentéssel létrejön a feladat.
- Szerkesztés: a listából kiválasztott feladat megnyitható, módosítható, majd menthető.
- Állapot váltás (nyitott/kész): szerkesztésnél az állapot átállítható, majd mentéssel rögzíthető.
- Határidő: határidő megadása után mentéssel tárolódik, és a feladat adatai között megjelenik.
- Törlés: a feladat törölhető; törlés után a listából eltűnik.

4) Funkciók kipróbálása (API):

- A teljes CRUD-hoz példa requestek: [backend/Backend.http](backend/Backend.http)
- Backend health: http://localhost:5187/api/health

5) MCP funkció kipróbálása (ha szükséges):

- MCP endpoint: http://localhost:5190/mcp
- Gyors teszt (teszt kliens):

```bash
npm.cmd --prefix .\mcp-server run test:client
```

