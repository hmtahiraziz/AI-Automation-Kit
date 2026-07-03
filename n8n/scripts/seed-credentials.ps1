$ErrorActionPreference = "Stop"
. "$PSScriptRoot\_lib.ps1"

& (Join-Path $PSScriptRoot "wait-healthy.ps1")

$rootDir = Get-RootDir
$envMap = Get-EnvMap
$manifestPath = Join-Path $rootDir "n8n\credentials\manifest.json"

Write-Host "Syncing credential manifest from n8n..."
$manifest = @(Sync-CredentialManifestFromN8n -ManifestPath $manifestPath)

function Get-ManifestEntry {
    param([string]$Name)
    return $manifest | Where-Object { $_.name -eq $Name } | Select-Object -First 1
}

function Save-Manifest {
    Save-CredentialManifest -Entries $manifest -ManifestPath $manifestPath
    Write-Host "Saved credential manifest to n8n/credentials/manifest.json"
}

function Upsert-Credential {
    param(
        [string]$Name,
        [string]$Type,
        [hashtable]$Data,
        [string[]]$RequiredEnv
    )

    foreach ($key in $RequiredEnv) {
        if ([string]::IsNullOrWhiteSpace($envMap[$key])) {
            Write-Host "Skipping $Name ($Type) - missing $key in .env"
            return
        }
    }

    if ($Name -eq "SC - Gemini" -and -not (Test-GeminiApiKeyFormat -Key $envMap["GEMINI_API_KEY"])) {
        Write-Host ""
        Write-Host "ERROR: GEMINI_API_KEY is not a recognized Google AI Studio key."
        $current = $envMap["GEMINI_API_KEY"]
        if (-not [string]::IsNullOrWhiteSpace($current)) {
            Write-Host "  Current key starts with: $($current.Substring(0, [Math]::Min(8, $current.Length)))..."
        }
        Write-Host "  Valid formats: AIzaSy... (standard) or AQ.... (authorization)"
        Write-Host "  Create one at: https://aistudio.google.com/apikey"
        Write-Host "  Then update .env and run: .\n8n\scripts\update-gemini-key.ps1"
        Write-Host ""
        return
    }

    $body = @{
        name = $Name
        type = $Type
        data = $Data
    }

    $existing = Get-ManifestEntry -Name $Name

    if ($existing -and $existing.id) {
        try {
            Invoke-N8nApi -Method Patch -Path "/credentials/$($existing.id)" -Body $body | Out-Null
            Write-Host "Updated credential $Name."
            return
        }
        catch {
            Write-Host "Could not update $Name via API: $($_.Exception.Message)"
        }
    }

    $remote = Find-N8nCredentialByName -Name $Name -Type $Type
    if ($remote) {
        try {
            Invoke-N8nApi -Method Patch -Path "/credentials/$($remote.id)" -Body $body | Out-Null
            Write-Host "Updated credential $Name (found in n8n)."
            $script:manifest = @($manifest | Where-Object { $_.name -ne $Name })
            $script:manifest += [pscustomobject]@{
                id = [string]$remote.id
                name = $Name
                type = $Type
            }
            return
        }
        catch {
            Write-Host "Could not update existing $Name in n8n: $($_.Exception.Message)"
        }
    }

    try {
        $created = Invoke-N8nApi -Method Post -Path "/credentials" -Body $body
        Write-Host "Created credential $Name."
        $script:manifest = @($manifest | Where-Object { $_.name -ne $Name })
        $script:manifest += [pscustomobject]@{
            id = [string]$created.id
            name = $Name
            type = $Type
        }
    }
    catch {
        $message = $_.Exception.Message
        if ($message -match "already exists|duplicate|409") {
            Write-Host "Credential $Name may already exist. Run .\n8n\scripts\sync-credentials-manifest.ps1"
            return
        }
        Write-Host "Could not create $Name via API: $message"
        Write-Host "Create it manually in n8n UI: Credentials -> name $Name"
    }
}

Upsert-Credential -Name "SC - Gemini" -Type "googlePalmApi" -RequiredEnv @("GEMINI_API_KEY") -Data @{
    host = "https://generativelanguage.googleapis.com"
    apiKey = $envMap["GEMINI_API_KEY"]
}

Upsert-Credential -Name "SC - Gmail" -Type "gmailOAuth2" -RequiredEnv @("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET") -Data @{
    clientId = $envMap["GOOGLE_CLIENT_ID"]
    clientSecret = $envMap["GOOGLE_CLIENT_SECRET"]
}

Upsert-Credential -Name "SC - Google Sheets" -Type "googleSheetsOAuth2Api" -RequiredEnv @("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET") -Data @{
    clientId = $envMap["GOOGLE_CLIENT_ID"]
    clientSecret = $envMap["GOOGLE_CLIENT_SECRET"]
}

Upsert-Credential -Name "SC - Slack" -Type "slackOAuth2Api" -RequiredEnv @("SLACK_CLIENT_ID", "SLACK_CLIENT_SECRET") -Data @{
    clientId = $envMap["SLACK_CLIENT_ID"]
    clientSecret = $envMap["SLACK_CLIENT_SECRET"]
}

Save-Manifest

Write-Host ""
Write-Host "Credential seed complete."
Write-Host "OAuth credentials still need account connection in the n8n UI."
Write-Host "Open http://localhost:5678 and go to Credentials to finish OAuth."
