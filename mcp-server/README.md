# MCP server (Todo)

Ez egy külön komponens (Node.js + TypeScript), ami MCP (Model Context Protocol) szerverként fut **Streamable HTTP** transporttal.

A tool-ok a meglévő ASP.NET `backend` gateway REST API-ját hívják, így a lánc:

MCP server -> backend gateway -> todos-service -> MongoDB

## Futtatás lokálisan

Előfeltétel: Node.js 20+.

```bash
cd .\mcp-server
npm.cmd install

# backend legyen futtatva (pl. docker compose up)
set BACKEND_BASE_URL=http://localhost:5187
npm.cmd run dev
```

- MCP endpoint: `http://localhost:3000/mcp`

## Docker compose-ban

A repo root-ból:

```bash
docker compose up --build
```

- MCP endpoint: `http://localhost:5190/mcp`

## Gyors teszt (MCP kliens)

Ez a mappa tartalmaz egy egyszerű teszt klienst, ami csatlakozik a szerverhez, kilistázza a tool-okat, majd meghívja a `todos_list` tool-t.

Előfeltétel: fusson a stack (pl. `docker compose up`).

```bash
cd .\\mcp-server
set MCP_URL=http://localhost:5190/mcp
npm.cmd run test:client
```

## Konfiguráció (env)

- `BACKEND_BASE_URL` (alap: `http://localhost:5187`) – a gateway base URL-je
- `MCP_PORT` (alap: `3000`)
- `MCP_HOST` (alap: `0.0.0.0`)
- `MCP_ALLOWED_HOSTS` (alap: `localhost,127.0.0.1`) – DNS rebinding védelem allowlist
