param([string]$Id)

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\_lib.ps1"

if (-not $Id) {
    $list = Invoke-N8nApi -Path "/executions?limit=1"
    $Id = $list.data[0].id
}

Write-Host "Execution: $Id"
$d = Invoke-N8nApi -Path "/executions/$Id`?includeData=true"
Write-Host "Top-level keys:" ($d.PSObject.Properties.Name -join ', ')
if ($d.data -and $d.data.PSObject.Properties.Name -contains 'resultData') {
    Write-Host "Has data.resultData on wrapper.data (flat)"
}
if ($d.data -and $d.data.data) {
    Write-Host "Has data.data nested (wrapped execution)"
}

$runData = $null
if ($d.data.resultData) {
    $runData = $d.data.resultData.runData
} elseif ($d.data.data.resultData) {
    $runData = $d.data.data.resultData.runData
} elseif ($d.resultData) {
    $runData = $d.resultData.runData
} elseif ($d.data -is [string]) {
    Write-Host "data is string?"
}

foreach ($name in @("Set Result", "Gemini Summary", "Post to Slack")) {
    Write-Host ""
    Write-Host "=== $name ==="
    $node = $runData.$name
    if (-not $node) {
        Write-Host "(missing)"
        continue
    }
    $json = $node[0].data.main[0][0].json
    $json | ConvertTo-Json -Depth 6
}
