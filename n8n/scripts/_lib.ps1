function Get-RootDir {
    Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
}

function Get-EnvMap {
    param([string]$EnvFile = (Join-Path (Get-RootDir) ".env"))

    if (-not (Test-Path $EnvFile)) {
        throw ".env file not found at $EnvFile"
    }

    $map = @{}
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
        $idx = $_.IndexOf('=')
        if ($idx -lt 1) { return }
        $key = $_.Substring(0, $idx).Trim()
        $value = $_.Substring($idx + 1).Trim()
        $map[$key] = $value
    }
    return $map
}

function Get-N8nApiKey {
    $root = Get-RootDir
    $envMap = Get-EnvMap -EnvFile (Join-Path $root ".env")
    $apiKey = $envMap['N8N_API_KEY']

    if (-not [string]::IsNullOrWhiteSpace($apiKey)) {
        return $apiKey
    }

    $dashboardEnv = Join-Path $root "dashboard\.env.local"
    if (Test-Path $dashboardEnv) {
        $dashMap = Get-EnvMap -EnvFile $dashboardEnv
        $dashKey = $dashMap['N8N_API_KEY']
        if (-not [string]::IsNullOrWhiteSpace($dashKey)) {
            return $dashKey
        }
    }

    return $null
}

function Get-N8nHeaders {
    $apiKey = Get-N8nApiKey
    if ([string]::IsNullOrWhiteSpace($apiKey)) {
        throw @"
N8N_API_KEY is missing.

1. n8n -> Settings -> API -> Create API key
2. Add to root .env:  N8N_API_KEY=your-key
   Or run:  .\n8n\scripts\sync-dashboard-env.ps1 -FromDashboard
"@
    }
    return @{ "X-N8N-API-KEY" = $apiKey }
}

function Get-N8nBaseUrl {
    $envMap = Get-EnvMap
    $hostName = if ($envMap['N8N_HOST']) { $envMap['N8N_HOST'] } else { 'localhost' }
    $port = if ($envMap['N8N_PORT']) { $envMap['N8N_PORT'] } else { '5678' }
    $protocol = if ($envMap['N8N_PROTOCOL']) { $envMap['N8N_PROTOCOL'] } else { 'http' }
    return "${protocol}://${hostName}:${port}"
}

function Get-N8nApiUrl {
    return "$(Get-N8nBaseUrl)/api/v1"
}

function Invoke-N8nApi {
    param(
        [string]$Method = 'Get',
        [string]$Path,
        [object]$Body
    )

    $uri = "$(Get-N8nApiUrl)$Path"
    $params = @{
        Uri = $uri
        Method = $Method
        Headers = (Get-N8nHeaders)
    }

    if ($null -ne $Body) {
        $params.Body = ($Body | ConvertTo-Json -Depth 100)
        $params.ContentType = 'application/json'
    }

    return Invoke-RestMethod @params
}

function Update-N8nWorkflow {
    param(
        [string]$WorkflowId,
        [object]$Body
    )

    return Invoke-N8nApi -Method Put -Path "/workflows/$WorkflowId" -Body $Body
}

function Set-N8nWorkflowActive {
    param(
        [string]$WorkflowId,
        [bool]$Active
    )

    if ($Active) {
        return Invoke-N8nApi -Method Post -Path "/workflows/$WorkflowId/activate"
    }

    return Invoke-N8nApi -Method Post -Path "/workflows/$WorkflowId/deactivate"
}

function Read-ManifestEntries {
    param($Object)

    if ($null -eq $Object) { return @() }
    if ($Object -is [System.Array]) {
        return @($Object | ForEach-Object { Read-ManifestEntries -Object $_ })
    }
    if ($Object.PSObject.Properties.Name -contains "value") {
        return Read-ManifestEntries -Object $Object.value
    }
    if ($Object.name -and $Object.id) { return @($Object) }
    return @()
}

function Get-CredentialManifest {
    param([string]$ManifestPath = (Join-Path (Get-RootDir) "n8n\credentials\manifest.json"))

    if (-not (Test-Path $ManifestPath)) {
        return @()
    }

    $raw = Get-Content $ManifestPath -Raw | ConvertFrom-Json
    $flat = Read-ManifestEntries -Object $raw
    $byName = [ordered]@{}

    foreach ($entry in $flat) {
        $byName[$entry.name] = [pscustomobject]@{
            id = [string]$entry.id
            name = [string]$entry.name
            type = [string]$entry.type
        }
    }

    return @($byName.Values)
}

function Save-CredentialManifest {
    param(
        [object[]]$Entries,
        [string]$ManifestPath = (Join-Path (Get-RootDir) "n8n\credentials\manifest.json")
    )

    if ($Entries.Count -eq 0) {
        return
    }

    $json = $Entries | ForEach-Object {
        [ordered]@{
            name = $_.name
            id = $_.id
            type = $_.type
        }
    } | ConvertTo-Json -Depth 5

    Set-Content -Path $ManifestPath -Value $json -Encoding UTF8
}

function Test-GeminiApiKeyFormat {
    param([string]$Key)

    if ([string]::IsNullOrWhiteSpace($Key)) {
        return $false
    }

    # Standard (legacy) keys from AI Studio
    if ($Key -match '^AIza[-0-9A-Za-z_]+$') {
        return $true
    }

    # Authorization keys — default for new keys since 2026
    if ($Key -match '^AQ\.[A-Za-z0-9_-]+$') {
        return $true
    }

    return $false
}

function Get-GeminiApiKeyType {
    param([string]$Key)

    if ($Key -match '^AIza') { return 'standard' }
    if ($Key -match '^AQ\.') { return 'authorization' }
    return 'unknown'
}

function Get-GeminiStandupPromptTemplate {
    return @'
You are a professional project assistant. From the spreadsheet rows below, produce a concise executive standup for leadership.

Format exactly (plain text, no markdown headers):
Project: [what they're working on]
Achieved: [what got done today]
Left: [what's still pending]
Issues: [blockers or "none"]

If multiple projects exist, combine into one cohesive update. Keep tone professional. 4-8 sentences total.

Data:
'@
}

function Get-N8nGeminiModelName {
    param([hashtable]$EnvMap)

    $model = if ($EnvMap['GEMINI_MODEL']) { $EnvMap['GEMINI_MODEL'] } else { 'models/gemini-2.5-flash' }
    if ($model -match '^models/(.+)$') {
        return $Matches[1]
    }

    return $model
}

function Get-GeminiStandupPromptExpression {
    return "=You are a professional project assistant. From the spreadsheet rows below, produce a concise executive standup for leadership.`n`nFormat exactly (plain text, no markdown headers):`nProject: [what they're working on]`nAchieved: [what got done today]`nLeft: [what's still pending]`nIssues: [blockers or `"none`"]`n`nIf multiple projects exist, combine into one cohesive update. Keep tone professional. 4-8 sentences total.`n`nData:`n{{ JSON.stringify(`$json.rows) }}"
}

function Get-MainAutomationSetResultAssignments {
    param(
        [string]$SlackChannel,
        [string]$GmailTo
    )

    return @(
        [pscustomobject]@{ id = 'm1000007-0007-4007-8007-000000000007'; name = 'success'; value = $true; type = 'boolean' },
        [pscustomobject]@{ id = 'm1000008-0008-4008-8008-000000000008'; name = 'summary'; value = '={{ $(''Gemini Summary'').first().json.text }}'; type = 'string' },
        [pscustomobject]@{ id = 'm1000009-0009-4009-8009-000000000009'; name = 'providers'; value = 'gemini,gmail,google-sheets,slack'; type = 'string' },
        [pscustomobject]@{ id = 'm1000012-0012-4012-8012-000000000012'; name = 'finishedAt'; value = '={{ $now.toISO() }}'; type = 'string' },
        [pscustomobject]@{ id = 'm1000013-0013-4013-8013-000000000013'; name = 'workflowName'; value = 'Main Automation'; type = 'string' },
        [pscustomobject]@{ id = 'm1000014-0014-4014-8014-000000000014'; name = 'slackChannel'; value = $SlackChannel; type = 'string' },
        [pscustomobject]@{ id = 'm1000015-0015-4015-8015-000000000015'; name = 'gmailTo'; value = $GmailTo; type = 'string' }
    )
}

function Install-CombineRowsNode {
    param([object]$Workflow)

    $nodes = @($Workflow.nodes)
    $combineNode = $nodes | Where-Object { $_.name -eq 'Combine Rows' } | Select-Object -First 1

    if (-not $combineNode) {
        $combineNode = [pscustomobject]@{
            parameters  = [pscustomobject]@{
                mode   = 'runOnceForAllItems'
                jsCode = "const rows = `$input.all().map((item) => item.json);`nreturn [{ json: { rows } }];"
            }
            id          = 'm1000017-0017-4017-8017-000000000017'
            name        = 'Combine Rows'
            type        = 'n8n-nodes-base.code'
            typeVersion = 2
            position    = @(550, 360)
        }
        $nodes = @($nodes) + $combineNode
        $Workflow.nodes = $nodes
    }

    $conn = $Workflow.connections
    $connJson = @"
{
  "Read Sheet Data": {
    "main": [
      [
        {
          "node": "Combine Rows",
          "type": "main",
          "index": 0
        }
      ]
    ]
  },
  "Combine Rows": {
    "main": [
      [
        {
          "node": "Gemini Summary",
          "type": "main",
          "index": 0
        }
      ]
    ]
  }
}
"@
    $connPatch = ($connJson | ConvertFrom-Json)
    foreach ($prop in $connPatch.PSObject.Properties) {
        $conn | Add-Member -NotePropertyName $prop.Name -NotePropertyValue $prop.Value -Force
    }

    return $true
}

function New-GeminiChatModelNode {
  param(
    [string]$Id = 'm1000004-0004-4004-8004-000000000004',
    [int[]]$Position = @(660, 560),
    [string]$ModelName = 'gemini-2.5-flash'
  )

  return [pscustomobject]@{
    parameters  = [pscustomobject]@{
      modelName = $ModelName
      options   = @{}
    }
    id          = $Id
    name        = 'Google Gemini Chat Model'
    type        = '@n8n/n8n-nodes-langchain.lmChatGoogleGemini'
    typeVersion = 1
    position    = $Position
    credentials = [pscustomobject]@{
      googlePalmApi = [pscustomobject]@{ name = 'SC - Gemini' }
    }
  }
}

function Set-GeminiCredentialRef {
    param([object]$Node)

    $Node | Add-Member -NotePropertyName credentials -NotePropertyValue ([pscustomobject]@{
        googlePalmApi = [pscustomobject]@{ name = 'SC - Gemini' }
    }) -Force
}

function Install-GeminiLangChainNodes {
    param(
        [object]$Workflow,
        [hashtable]$EnvMap
    )

    $modelName = Get-N8nGeminiModelName -EnvMap $EnvMap
    $nodes = @($Workflow.nodes)
    $summaryNode = $nodes | Where-Object { $_.name -eq 'Gemini Summary' } | Select-Object -First 1
    $testNode = $nodes | Where-Object { $_.name -eq 'Basic LLM Chain' } | Select-Object -First 1
    $targetNode = if ($summaryNode) { $summaryNode } else { $testNode }

    if (-not $targetNode) {
        return $false
    }

  $isTest = $targetNode.name -eq 'Basic LLM Chain'
  $targetNode.type = '@n8n/n8n-nodes-langchain.chainLlm'
  $targetNode.typeVersion = 1.5
  $targetNode.parameters = [pscustomobject]@{
    promptType = 'define'
    text       = if ($isTest) { '=Reply with exactly: OK' } else { Get-GeminiStandupPromptExpression }
  }

  if ($targetNode.PSObject.Properties.Name -contains 'credentials') {
    $targetNode.PSObject.Properties.Remove('credentials')
  }

  $modelNode = $nodes | Where-Object { $_.name -eq 'Google Gemini Chat Model' } | Select-Object -First 1
  if (-not $modelNode) {
    $modelId = if ($isTest) { 'b3c4d5e6-f7a8-9012-cdef-123456789012' } else { 'm1000004-0004-4004-8004-000000000004' }
    $modelPos = if ($isTest) { @(470, 520) } else { @(660, 560) }
    $nodes = @($nodes) + (New-GeminiChatModelNode -Id $modelId -Position $modelPos -ModelName $modelName)
  }
  else {
    $modelNode.parameters.modelName = $modelName
    Set-GeminiCredentialRef -Node $modelNode
  }

  $chainName = $targetNode.name
  $conn = $Workflow.connections
  $modelConnJson = @"
{
  "ai_languageModel": [
    [
      {
        "node": "$chainName",
        "type": "ai_languageModel",
        "index": 0
      }
    ]
  ]
}
"@
  $modelConn = $modelConnJson | ConvertFrom-Json
  $conn | Add-Member -NotePropertyName 'Google Gemini Chat Model' -NotePropertyValue $modelConn -Force

  $Workflow.nodes = $nodes
  return $true
}

function Get-N8nCredentials {
    $response = Invoke-N8nApi -Path "/credentials"
    if ($response.data) {
        return @($response.data)
    }
    return @($response)
}

function Find-N8nCredentialByName {
    param(
        [string]$Name,
        [string]$Type = $null
    )

    $matches = @(Get-N8nCredentials | Where-Object { $_.name -eq $Name })
    if ($Type) {
        $matches = @($matches | Where-Object { $_.type -eq $Type })
    }

    return $matches | Select-Object -First 1
}

function Sync-CredentialManifestFromN8n {
    param(
        [string[]]$CredentialNames = @(
            "SC - Gemini",
            "SC - Gmail",
            "SC - Google Sheets",
            "SC - Slack"
        ),
        [string]$ManifestPath = (Join-Path (Get-RootDir) "n8n\credentials\manifest.json")
    )

    $manifestByName = @{}
    foreach ($entry in (Get-CredentialManifest -ManifestPath $ManifestPath)) {
        $manifestByName[$entry.name] = $entry
    }

    $updated = $false
    foreach ($name in $CredentialNames) {
        $remote = Find-N8nCredentialByName -Name $name
        if (-not $remote) {
            continue
        }

        $current = $manifestByName[$name]
        if (-not $current -or $current.id -ne $remote.id -or $current.type -ne $remote.type) {
            $manifestByName[$name] = [pscustomobject]@{
                id = [string]$remote.id
                name = [string]$remote.name
                type = [string]$remote.type
            }
            $updated = $true
            Write-Host "Synced manifest: $name -> $($remote.id)"
        }
    }

    if ($updated) {
        Save-CredentialManifest -Entries @($manifestByName.Values) -ManifestPath $ManifestPath
    }

    return @($manifestByName.Values)
}
