$ErrorActionPreference = "Stop"
. "$PSScriptRoot\_lib.ps1"

& (Join-Path $PSScriptRoot "wait-healthy.ps1")

$manifestPath = Join-Path (Get-RootDir) "n8n\credentials\manifest.json"
Sync-CredentialManifestFromN8n -ManifestPath $manifestPath | Out-Null

Write-Host ""
Write-Host "Done. Re-link workflows with: .\n8n\scripts\link-credentials.ps1"
