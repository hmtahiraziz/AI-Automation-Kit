$ErrorActionPreference = "Stop"
. "$PSScriptRoot\_lib.ps1"

& (Join-Path $PSScriptRoot "wait-healthy.ps1")

$workflowId = "q25dfAZbIahaEHDm"
$envMap = Get-EnvMap
$cron = if ($envMap["MAIN_SCHEDULE_CRON"]) { $envMap["MAIN_SCHEDULE_CRON"] } else { "0 18 * * 1-5" }
$slack = if ($envMap["TEST_SLACK_CHANNEL"]) { $envMap["TEST_SLACK_CHANNEL"] } else { "#general" }
$gmailTo = $envMap["MAIN_GMAIL_TO"]

$w = Invoke-N8nApi -Path "/workflows/$workflowId"

if (Install-GeminiLangChainNodes -Workflow $w -EnvMap $envMap) {
    Write-Host "Restored Google Gemini Chat Model (SC - Gemini credential)."
}

Install-CombineRowsNode -Workflow $w | Out-Null

foreach ($node in $w.nodes) {
    switch ($node.name) {
        "Gemini Summary" {
            $node.parameters.text = Get-GeminiStandupPromptExpression
        }
        "Post to Slack" {
            $node.parameters.text = '=:clipboard: *Daily Standup - {{ $now.format(''MMM d, yyyy'') }}*

{{ $json.text }}'
        }
        "Send Gmail" {
            $node.parameters.emailType = "html"
            $node.parameters.subject = '=Daily Standup - {{ $now.format(''MMM d, yyyy'') }}'
            $node.parameters.message = '=<div style="font-family:Arial,sans-serif;max-width:600px"><div style="background:#18181b;color:#fff;padding:16px"><h2 style="margin:0">Daily Standup Summary</h2></div><div style="padding:16px"><pre style="white-space:pre-wrap;font-family:Arial">{{ $(''Gemini Summary'').first().json.text }}</pre></div></div>'
        }
        "Set Result" {
            $node.parameters.assignments.assignments = @(Get-MainAutomationSetResultAssignments -SlackChannel $slack -GmailTo $gmailTo)
        }
    }
}

$hasWebhook = @($w.nodes | Where-Object { $_.name -eq "Run Webhook" }).Count -gt 0
if (-not $hasWebhook) {
    $webhookNode = [pscustomobject]@{
        parameters  = [pscustomobject]@{
            httpMethod   = "POST"
            path         = "kit-run-main"
            responseMode = "lastNode"
            options      = @{}
        }
        id          = "m1000016-0016-4016-8016-000000000016"
        name        = "Run Webhook"
        type        = "n8n-nodes-base.webhook"
        typeVersion = 2
        position    = @(200, 100)
        webhookId   = "kit-run-main"
    }
    $w.nodes = @($w.nodes) + $webhookNode
}

$hasSchedule = @($w.nodes | Where-Object { $_.name -eq "Schedule Trigger" }).Count -gt 0
if (-not $hasSchedule) {
    $scheduleNode = [pscustomobject]@{
        parameters  = [pscustomobject]@{
            rule = [pscustomobject]@{
                interval = @(
                    [pscustomobject]@{
                        field      = "cronExpression"
                        expression = $cron
                    }
                )
            }
        }
        id          = "m1000011-0011-4011-8011-000000000011"
        name        = "Schedule Trigger"
        type        = "n8n-nodes-base.scheduleTrigger"
        typeVersion = 1.2
        position    = @(200, 460)
    }
    $w.nodes = @($w.nodes) + $scheduleNode
}

$conn = $w.connections
if (-not ($conn.PSObject.Properties.Name -contains "Run Webhook")) {
    $manualConn = $conn.'Manual Trigger'.main
    $conn | Add-Member -NotePropertyName "Run Webhook" -NotePropertyValue ([pscustomobject]@{
        main = $manualConn
    })
}
if (-not ($conn.PSObject.Properties.Name -contains "Schedule Trigger")) {
    $manualConn = $conn.'Manual Trigger'.main
    $conn | Add-Member -NotePropertyName "Schedule Trigger" -NotePropertyValue ([pscustomobject]@{
        main = $manualConn
    })
}

$body = @{
    name        = $w.name
    nodes       = $w.nodes
    connections = $conn
    settings    = @{ executionOrder = "v1" }
    staticData  = $null
}

Update-N8nWorkflow -WorkflowId $workflowId -Body $body | Out-Null
Write-Host "Main Automation upgraded in n8n (webhook + Sprint 3)."
