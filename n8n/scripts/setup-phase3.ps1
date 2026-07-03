$ErrorActionPreference = "Stop"

Write-Host "Phase 3 setup — dashboard + full kit deploy"
Write-Host ""

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$envFile = Join-Path $root ".env"
$envExample = Join-Path $root ".env.example"

if (-not (Test-Path $envFile)) {
    if (Test-Path $envExample) {
        Copy-Item $envExample $envFile
        Write-Host "Created .env from .env.example — fill secrets before continuing."
    }
    else {
        throw ".env not found. Copy .env.example to .env first."
    }
}

Write-Host "Starting Docker stack (n8n + dashboard)..."
Push-Location $root
try {
    docker compose up -d --build
}
finally {
    Pop-Location
}

Write-Host ""
& (Join-Path $PSScriptRoot "wait-healthy.ps1")

Write-Host ""
Write-Host "Bootstrapping n8n workflows and credentials..."
& (Join-Path $PSScriptRoot "setup-phase2.ps1")
Write-Host ""
& (Join-Path $PSScriptRoot "upgrade-main-automation.ps1")
Write-Host ""
& (Join-Path $PSScriptRoot "sync-dashboard-env.ps1")

Write-Host ""
Write-Host "Phase 3 bootstrap complete."
Write-Host ""
Write-Host "Open:"
Write-Host "  Dashboard  http://localhost:3000"
Write-Host "  n8n        http://localhost:5678"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Create N8N_API_KEY in n8n -> Settings -> API, add to .env"
Write-Host "  2. Re-run: .\n8n\scripts\sync-dashboard-env.ps1"
Write-Host "  3. docker compose up -d --build dashboard"
Write-Host "  4. Connect OAuth credentials in n8n UI"
Write-Host "  5. Use Run now / Seed sheet on the dashboard overview"
