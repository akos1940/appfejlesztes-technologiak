# Alkalmazásfejlesztés technológiái – Projektfeladat

Egyszerű full-stack példa alkalmazás (Todo lista) e2e folyamattal: fejlesztés → konténerizálás → CI build + image push (GHCR).

## Komponensek

- Frontend: Angular (standalone) – 2 view (lista + új/szerkesztés) + pagination
- Backend: ASP.NET Web API – CRUD REST API
- Adatbázis: MongoDB

## Futtatás Dockerrel (ajánlott)

Előfeltétel: Docker Desktop fusson (Windows-on a Linux engine).

```bash
docker compose up --build
```

- UI: http://localhost:8080
- Backend health: http://localhost:5187/api/health

Megjegyzés: a frontend nginx reverse proxy-val hívja a backendet a `/api/*` útvonalon.

## Futtatás lokálisan (Docker nélkül a FE/BE-hez)

1) MongoDB indítása (pl. csak Mongo compose-ból):

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

- UI: http://localhost:4200
- Backend: a konzolban kiírt port (alapból `http://localhost:5187`)

## API végpontok

- `GET /api/health`
- `GET /api/todos?page=1&pageSize=10`
- `POST /api/todos`
- `GET /api/todos/{id}`
- `PUT /api/todos/{id}`
- `DELETE /api/todos/{id}`

Példa requestek: [backend/Backend.http](backend/Backend.http)

## CI – Docker image build + push (GHCR)

A workflow: [.github/workflows/ci.yml](.github/workflows/ci.yml)

Publikált image-ek:

- `ghcr.io/akos1940/appfejlesztes-technologiak-backend:latest`
- `ghcr.io/akos1940/appfejlesztes-technologiak-frontend:latest`

GitHub beállítás: **Settings → Actions → General → Workflow permissions → Read and write permissions** (különben nem tud package-et pusholni).

