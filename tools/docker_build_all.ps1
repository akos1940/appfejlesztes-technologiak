$ErrorActionPreference = 'Stop'

Write-Host 'Building Docker images (local Kubernetes)...'

docker build -t projektfeladat-backend:latest -f .\backend\Dockerfile .\backend
if ($LASTEXITCODE -ne 0) { throw 'backend build failed' }

docker build -t projektfeladat-todos-service:latest -f .\todos-service\Dockerfile .\todos-service
if ($LASTEXITCODE -ne 0) { throw 'todos-service build failed' }

docker build -t projektfeladat-mcp-server:latest -f .\mcp-server\Dockerfile .\mcp-server
if ($LASTEXITCODE -ne 0) { throw 'mcp-server build failed' }

docker build -t projektfeladat-frontend:latest -f .\frontend\Dockerfile .\frontend
if ($LASTEXITCODE -ne 0) { throw 'frontend build failed' }

Write-Host 'Done.'
