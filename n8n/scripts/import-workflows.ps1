$ErrorActionPreference = "Stop"
. "$PSScriptRoot\_lib.ps1"

$rootDir = Get-RootDir
$workflowsDir = Join-Path $rootDir "n8n\workflows"
$envMap = Get-EnvMap

& (Join-Path $PSScriptRoot "wait-healthy.ps1")

function Get-GoogleSheetId {
    param([string]$Value)

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return $Value
    }

    if ($Value -match 'spreadsheets/d/([a-zA-Z0-9-_]+)') {
        return $Matches[1]
    }

    return $Value.Trim()
}

function Expand-WorkflowPlaceholders {
    param([string]$Json)

    $sheetId = Get-GoogleSheetId -Value $envMap["TEST_GOOGLE_SHEET_ID"]
    $replacements = @{
        "__TEST_GOOGLE_SHEET_ID__" = $sheetId
        "__TEST_GOOGLE_SHEET_NAME__" = if ($envMap["TEST_GOOGLE_SHEET_NAME"]) { $envMap["TEST_GOOGLE_SHEET_NAME"] } else { "Sheet1" }
        "__TEST_SLACK_CHANNEL__" = if ($envMap["TEST_SLACK_CHANNEL"]) { $envMap["TEST_SLACK_CHANNEL"] } else { "#general" }
        "__MAIN_GMAIL_TO__" = $envMap["MAIN_GMAIL_TO"]
        "__GEMINI_MODEL__" = if ($envMap["GEMINI_MODEL"]) {
            $m = $envMap["GEMINI_MODEL"]
            if ($m -match '^models/(.+)$') { $Matches[1] } else { $m }
        } else { "gemini-2.5-flash" }
        "__MAIN_SCHEDULE_CRON__" = if ($envMap["MAIN_SCHEDULE_CRON"]) { $envMap["MAIN_SCHEDULE_CRON"] } else { "0 18 * * 1-5" }
    }

    foreach ($key in $replacements.Keys) {
        $value = $replacements[$key]
        if (-not [string]::IsNullOrWhiteSpace($value)) {
            $Json = $Json.Replace($key, $value)
        }
    }

    return $Json
}

function Merge-CredentialRefs {
    param($FileCreds, $ExistingCreds)

    if (-not $FileCreds) { return $null }

    $merged = @{}
    foreach ($prop in $FileCreds.PSObject.Properties) {
        $key = $prop.Name
        $fileCred = $prop.Value
        $entry = @{ name = [string]$fileCred.name }
        if ($ExistingCreds -and ($ExistingCreds.PSObject.Properties.Name -contains $key)) {
            $existingCred = $ExistingCreds.$key
            if ($existingCred.id) {
                $entry.id = [string]$existingCred.id
            }
        }
        $merged[$key] = $entry
    }
    return $merged
}

function Merge-WorkflowForUpdate {
    param(
        [object]$FileWorkflow,
        [object]$ExistingWorkflow
    )

    $existingByName = @{}
    foreach ($node in $ExistingWorkflow.nodes) {
        $existingByName[$node.name] = $node
    }

    $mergedNodes = @()
    foreach ($fileNode in $FileWorkflow.nodes) {
        if ($existingByName.ContainsKey($fileNode.name)) {
            $existing = $existingByName[$fileNode.name]
            $node = [ordered]@{
                parameters = $fileNode.parameters
                id           = $existing.id
                name         = $fileNode.name
                type         = $fileNode.type
                typeVersion  = $fileNode.typeVersion
                position     = $fileNode.position
            }
            if ($existing.PSObject.Properties.Name -contains "webhookId" -and $existing.webhookId) {
                $node.webhookId = $existing.webhookId
            }
            $creds = Merge-CredentialRefs -FileCreds $fileNode.credentials -ExistingCreds $existing.credentials
            if ($creds) {
                $node.credentials = $creds
            }
            $mergedNodes += [pscustomobject]$node
        }
        else {
            $mergedNodes += $fileNode
        }
    }

    return @{
        name        = $FileWorkflow.name
        nodes       = $mergedNodes
        connections = $FileWorkflow.connections
        settings    = @{ executionOrder = "v1" }
        staticData  = $null
    }
}

$existing = Invoke-N8nApi -Path "/workflows"
$existingByName = @{}
foreach ($item in $existing.data) {
    $existingByName[$item.name] = $item
}

Get-ChildItem -Path $workflowsDir -Filter "*.json" -Recurse | ForEach-Object {
    $rawJson = Get-Content $_.FullName -Raw
    $rawJson = Expand-WorkflowPlaceholders -Json $rawJson
    try {
        $workflow = $rawJson | ConvertFrom-Json
    }
    catch {
        Write-Error "Invalid JSON in $($_.FullName): $_"
        return
    }
    $name = $workflow.name

    try {
        if ($existingByName.ContainsKey($name)) {
            $workflowId = $existingByName[$name].id
            $existingFull = Invoke-N8nApi -Path "/workflows/$workflowId"
            $body = Merge-WorkflowForUpdate -FileWorkflow $workflow -ExistingWorkflow $existingFull
            Update-N8nWorkflow -WorkflowId $workflowId -Body $body | Out-Null
            Write-Host "Updated $name from $($_.Name)."
            return
        }

        $body = @{
            name        = $workflow.name
            nodes       = $workflow.nodes
            connections = $workflow.connections
            settings    = @{ executionOrder = "v1" }
            staticData  = $null
        }
        Invoke-N8nApi -Method Post -Path "/workflows" -Body $body | Out-Null
        Write-Host "Imported '$name' from $($_.Name)."
    }
    catch {
        Write-Host "FAILED $name from $($_.Name): $($_.Exception.Message)"
    }
}

Write-Host "Workflow import complete."
