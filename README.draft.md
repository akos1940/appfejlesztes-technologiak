# Alkalmazásfejlesztés technológiái – Projektfeladat (Todo)

Egyszerű full‑stack mintaalkalmazás egy Todo listához. A cél: fejlesztés → konténerizálás → CI build → Docker image push (GHCR).

## Mi van benne?

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
- Határidő (opcionális)

## Futtatás Dockerrel (ajánlott)

Előfeltétel: Docker Desktop fusson (Windows-on Linux engine).

```bash
docker compose up --build
```

Elérhetőségek:

- UI: http://localhost:8080
- Backend health: http://localhost:5187/api/health

Megjegyzés: a frontend nginx reverse proxy-n keresztül hívja a backendet a `/api/*` útvonalon.

Leállítás:

```bash
docker compose down
```

Teljes törlés (MongoDB volume is):

```bash
docker compose down -v
```

## Megosztás / futtatás más gépen

Előfeltételek:

- Docker Desktop telepítve és fut (Windows/Mac/Linux)
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

Tipp: ha a `localhost` nem elérhető, tipikusan a Docker engine nem fut. Indítsd el a Docker Desktopot, majd futtasd újra a compose parancsot.

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

Workflow: [.github/workflows/ci.yml](.github/workflows/ci.yml)

Publikált image-ek:

- `ghcr.io/akos1940/appfejlesztes-technologiak-backend:latest`
- `ghcr.io/akos1940/appfejlesztes-technologiak-frontend:latest`

GitHub beállítás: **Settings → Actions → General → Workflow permissions → Read and write permissions** (különben nem tud package-et pusholni).

Működés röviden:

- `pull_request`: build (push nélkül)
- `push` a `main` ágra: build + push GHCR-re
- tagek: `sha-...` mindig, `latest` csak default branch-en

## Hibaelhárítás

- Ha semmi nem érhető el a `localhost`-on: ellenőrizd, hogy Docker Desktop fut-e, és a `docker compose ps` szerint a konténerek `Up` állapotban vannak.
- Ha a docker CLI ezt írja: `dockerDesktopLinuxEngine ... cannot find the file specified`, akkor a Docker engine nem fut (indítsd el a Docker Desktopot).
