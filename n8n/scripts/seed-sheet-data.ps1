$ErrorActionPreference = "Stop"
. "$PSScriptRoot\_lib.ps1"

& (Join-Path $PSScriptRoot "wait-healthy.ps1")
& (Join-Path $PSScriptRoot "import-workflows.ps1")

$workflows = Invoke-N8nApi -Path "/workflows"
$seed = $workflows.data | Where-Object { $_.name -eq "Seed Dummy Sheet Data" }

if (-not $seed) {
    Write-Error "Seed Dummy Sheet Data workflow not found after import."
}

$workflowId = $seed.id
$baseUrl = Get-N8nBaseUrl

try {
    Set-N8nWorkflowActive -WorkflowId $workflowId -Active $true | Out-Null
    & (Join-Path $PSScriptRoot "link-credentials.ps1")
    Start-Sleep -Seconds 2

    $response = Invoke-WebRequest -Uri "$baseUrl/webhook/kit-seed-sheet" -Method Post -UseBasicParsing -TimeoutSec 120
    Write-Host "Seeded dummy sheet data (HTTP $($response.StatusCode))."
    Write-Host $response.Content
}
catch {
    Write-Error "Failed to seed sheet data: $($_.Exception.Message)"
}
finally {
    try {
        Set-N8nWorkflowActive -WorkflowId $workflowId -Active $false | Out-Null
    }
    catch {
        Write-Host "Warning: could not deactivate seed workflow."
    }
}
