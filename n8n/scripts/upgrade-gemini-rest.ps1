$ErrorActionPreference = "Stop"
. "$PSScriptRoot\_lib.ps1"

& (Join-Path $PSScriptRoot "wait-healthy.ps1")

$envMap = Get-EnvMap
$targetNames = @("Main Automation", "Test Gemini")

$response = Invoke-N8nApi -Path "/workflows"
$workflows = if ($response.data) { @($response.data) } else { @($response) }

foreach ($summary in $workflows) {
    if ($summary.name -notin $targetNames) {
        continue
    }

    if ($summary.isArchived) {
        Write-Host "Skipping archived workflow: $($summary.name)"
        continue
    }

    $workflow = Invoke-N8nApi -Path "/workflows/$($summary.id)"
    if (-not (Install-GeminiLangChainNodes -Workflow $workflow -EnvMap $envMap)) {
        continue
    }

    $body = @{
        name        = $workflow.name
        nodes       = $workflow.nodes
        connections = $workflow.connections
        settings    = @{ executionOrder = "v1" }
        staticData  = $null
    }

    Update-N8nWorkflow -WorkflowId $summary.id -Body $body | Out-Null
    Write-Host "Upgraded Google Gemini nodes in: $($summary.name)"
}
