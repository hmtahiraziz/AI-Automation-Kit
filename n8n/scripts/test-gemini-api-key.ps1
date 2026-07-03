$ErrorActionPreference = "Stop"
. "$PSScriptRoot\_lib.ps1"

$envMap = Get-EnvMap
$apiKey = $envMap["GEMINI_API_KEY"]
$model = if ($envMap["GEMINI_MODEL"]) { $envMap["GEMINI_MODEL"] } else { "models/gemini-2.5-flash" }

if (-not (Test-GeminiApiKeyFormat -Key $apiKey)) {
    Write-Error "GEMINI_API_KEY in .env is missing or not a recognized AI Studio key (AIza... or AQ....)."
}

$keyType = Get-GeminiApiKeyType -Key $apiKey
Write-Host "Testing Gemini API directly ($keyType key, model: $model)..."

$uri = "https://generativelanguage.googleapis.com/v1beta/$($model):generateContent"
$body = @{
    contents = @(
        @{
            parts = @(
                @{ text = "Reply with exactly: OK" }
            )
        }
    )
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Method Post -Uri $uri -Headers @{
        "x-goog-api-key" = $apiKey
        "Content-Type" = "application/json"
    } -Body $body

    $text = $response.candidates[0].content.parts[0].text
    Write-Host "PASS - Gemini API responded: $text"
    Write-Host ""
    Write-Host "Your key works with Google's REST API."
    if ($keyType -eq "authorization") {
        Write-Host "If n8n still fails, the Google Gemini node may need an n8n update."
        Write-Host "See docs/CREDENTIALS.md -> Gemini troubleshooting (AQ keys)."
    }
}
catch {
    $status = $_.Exception.Response.StatusCode.value__
    $detail = $_.ErrorDetails.Message
    Write-Host "FAIL - HTTP $status"
    if ($detail) {
        Write-Host $detail
    }

    if ($detail -match "ACCESS_TOKEN_TYPE_UNSUPPORTED") {
        Write-Host ""
        Write-Host "AQ key rejected by generateContent. Try in Google AI Studio:"
        Write-Host "  1. API Keys -> your key -> restrict to Gemini API only"
        Write-Host "  2. Ensure key is bound to a service account (no extra IAM roles on it)"
        Write-Host "  3. Or create a new key in a fresh AI Studio project"
        Write-Host "Docs: https://ai.google.dev/gemini-api/docs/api-key"
    }

    exit 1
}
