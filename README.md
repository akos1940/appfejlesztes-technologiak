# Alkalmazásfejlesztés technológiái – Projektfeladat

Egyszerű full-stack példa alkalmazás (Todo lista) e2e folyamattal: fejlesztés → konténerizálás → CI build + image push (GHCR).

## Komponensek

- Frontend: Angular (standalone) – 2 view (lista + új/szerkesztés) + pagination
- Backend: ASP.NET Web API – CRUD REST API
- Adatbázis: MongoDB

## Funkciók (user-guide)

- Feladatok listázása (lapozható / pagination)
- Új feladat létrehozása
- Feladat szerkesztése
- Feladat törlése
- Állapot: nyitott / kész
- Határidő megadása (opcionális)

## Futtatás Dockerrel (ajánlott)

Előfeltétel: Docker Desktop fusson (Windows-on a Linux engine).

```bash
docker compose up --build
```

- UI: http://localhost:8080
- Backend health: http://localhost:5187/api/health

Megjegyzés: a frontend nginx reverse proxy-val hívja a backendet a `/api/*` útvonalon.

Leállítás:

```bash
docker compose down
```

Teljes törlés (adatbázis volume is):

```bash
docker compose down -v
```

## Futtatás lokálisan (Docker nélkül a FE/BE-hez)

Előfeltétel:

- .NET SDK 10
- Node.js + npm

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

Megjegyzés (Windows/PowerShell): ha az `npm` futása tiltott aláírás miatt, használd az `npm.cmd` / `npx.cmd` parancsot.

## API végpontok

- `GET /api/health`
- `GET /api/todos?page=1&pageSize=10`
- `POST /api/todos`
- `GET /api/todos/{id}`
- `PUT /api/todos/{id}`
- `DELETE /api/todos/{id}`

Példa requestek: [backend/Backend.http](backend/Backend.http)

Tipp: a `GET by id`, `PUT`, `DELETE` requesteknél a `TodoId` értékét cseréld le egy létező MongoDB ObjectId-ra (a `POST` válaszában megkapod).

## CI – Docker image build + push (GHCR)

A workflow: [.github/workflows/ci.yml](.github/workflows/ci.yml)

Publikált image-ek:

- `ghcr.io/akos1940/appfejlesztes-technologiak-backend:latest`
- `ghcr.io/akos1940/appfejlesztes-technologiak-frontend:latest`

GitHub beállítás: **Settings → Actions → General → Workflow permissions → Read and write permissions** (különben nem tud package-et pusholni).

CI működés:

- `pull_request`: build (push nélkül)
- `push` a `main` ágra: build + push GHCR-re
- tagek: `sha-...` mindig, `latest` csak default branch-en

## Hibaelhárítás

- Ha semmi nem érhető el a `localhost`-on: ellenőrizd, hogy Docker Desktop fut-e, és a `docker compose ps` szerint a konténerek `Up` állapotban vannak.
- Ha a docker CLI ezt írja: `dockerDesktopLinuxEngine ... cannot find the file specified`, akkor a Docker engine nem fut (indítsd el a Docker Desktopot).

