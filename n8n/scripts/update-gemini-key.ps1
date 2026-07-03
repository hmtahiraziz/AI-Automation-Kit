$ErrorActionPreference = "Stop"
. "$PSScriptRoot\_lib.ps1"

& (Join-Path $PSScriptRoot "wait-healthy.ps1")

$envMap = Get-EnvMap
$apiKey = $envMap["GEMINI_API_KEY"]

if ([string]::IsNullOrWhiteSpace($apiKey)) {
    Write-Error "GEMINI_API_KEY is empty in .env"
}

if (-not (Test-GeminiApiKeyFormat -Key $apiKey)) {
    Write-Error @"
Invalid GEMINI_API_KEY format.

Valid formats from https://aistudio.google.com/apikey :
  - Standard key:        AIzaSy...
  - Authorization key:   AQ....

Set in .env and run this script again.
"@
}

$manifestPath = Join-Path (Get-RootDir) "n8n\credentials\manifest.json"
$credentialId = $null

$entry = Get-CredentialManifest -ManifestPath $manifestPath | Where-Object { $_.name -eq "SC - Gemini" } | Select-Object -First 1
if ($entry) { $credentialId = $entry.id }

if (-not $credentialId) {
    Write-Host "Manifest missing SC - Gemini id. Running seed-credentials.ps1..."
    & (Join-Path $PSScriptRoot "seed-credentials.ps1")
    exit $LASTEXITCODE
}

$body = @{
    name = "SC - Gemini"
    type = "googlePalmApi"
    data = @{
        host = "https://generativelanguage.googleapis.com"
        apiKey = $apiKey
    }
}

Invoke-N8nApi -Method Patch -Path "/credentials/$credentialId" -Body $body | Out-Null
$keyType = Get-GeminiApiKeyType -Key $apiKey
Write-Host "Updated SC - Gemini credential in n8n ($keyType key)."

& (Join-Path $PSScriptRoot "link-credentials.ps1")
& (Join-Path $PSScriptRoot "upgrade-gemini-rest.ps1")

Write-Host ""
Write-Host "Test in n8n: Workflows -> Test Gemini -> Test workflow"
