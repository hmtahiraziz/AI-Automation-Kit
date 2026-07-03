$ErrorActionPreference = "Stop"
. "$PSScriptRoot\_lib.ps1"

& (Join-Path $PSScriptRoot "wait-healthy.ps1")

$rootDir = Get-RootDir
$manifestPath = Join-Path $rootDir "n8n\credentials\manifest.json"

if (-not (Test-Path $manifestPath)) {
    Write-Host "No manifest found at n8n/credentials/manifest.json"
    Write-Host "Run seed-credentials.ps1 after filling .env, or link credentials manually in n8n UI."
    exit 0
}

$manifest = Get-CredentialManifest -ManifestPath $manifestPath
$credentialsByName = @{}
foreach ($cred in $manifest) {
    $credentialsByName[$cred.name] = $cred
}

$workflows = Invoke-N8nApi -Path "/workflows"
$kitWorkflowNames = @(
    "Main Automation",
    "Seed Dummy Sheet Data",
    "Test Gemini",
    "Test Gmail",
    "Test Google Sheets",
    "Test Slack"
)

foreach ($workflowSummary in $workflows.data) {
    if ($kitWorkflowNames -notcontains $workflowSummary.name) {
        continue
    }

    $workflow = Invoke-N8nApi -Path "/workflows/$($workflowSummary.id)"
    $updated = $false

    foreach ($node in $workflow.nodes) {
        if (-not $node.credentials) {
            continue
        }

        $credentialKeys = @($node.credentials.PSObject.Properties.Name)
        foreach ($credentialKey in $credentialKeys) {
            $credentialRef = $node.credentials.$credentialKey
            $credentialName = $credentialRef.name

            if (-not $credentialName -or -not $credentialsByName.ContainsKey($credentialName)) {
                Write-Host "Workflow $($workflow.name) node $($node.name): credential $credentialName not in manifest."
                continue
            }

            $credentialId = $credentialsByName[$credentialName].id
            if (-not $credentialRef.id -or $credentialRef.id -ne $credentialId) {
                $node.credentials.$credentialKey = @{
                    id = $credentialId
                    name = $credentialName
                }
                $updated = $true
            }
        }
    }

    if (-not $updated) {
        Write-Host "Workflow $($workflow.name) credentials already linked or use manual linking."
        continue
    }

    $body = @{
        name = $workflow.name
        nodes = $workflow.nodes
        connections = $workflow.connections
        settings = $workflow.settings
        staticData = $workflow.staticData
    }

    Update-N8nWorkflow -WorkflowId $workflow.id -Body $body | Out-Null
    Write-Host "Linked credentials for workflow $($workflow.name)."
}

Write-Host "Credential linking complete."
