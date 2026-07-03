$ErrorActionPreference = "Stop"
. "$PSScriptRoot\_lib.ps1"

& (Join-Path $PSScriptRoot "wait-healthy.ps1")

$envMap = Get-EnvMap
$baseUrl = Get-N8nBaseUrl
$rootDir = Get-RootDir
$manifestPath = Join-Path $rootDir "n8n\credentials\manifest.json"

$credentialNames = @()
if (Test-Path $manifestPath) {
    $manifest = Get-CredentialManifest -ManifestPath $manifestPath
    $credentialNames = @($manifest | ForEach-Object { $_.name })
}

$tests = @(
    @{
        Name = "Test Gemini"
        WebhookPath = "kit-test-gemini"
        RequiredEnv = @("GEMINI_API_KEY")
        CredentialName = "SC - Gemini"
    },
    @{
        Name = "Test Gmail"
        WebhookPath = "kit-test-gmail"
        RequiredEnv = @("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET")
        CredentialName = "SC - Gmail"
    },
    @{
        Name = "Test Google Sheets"
        WebhookPath = "kit-test-google-sheets"
        RequiredEnv = @("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "TEST_GOOGLE_SHEET_ID")
        CredentialName = "SC - Google Sheets"
    },
    @{
        Name = "Test Slack"
        WebhookPath = "kit-test-slack"
        RequiredEnv = @("SLACK_CLIENT_ID", "SLACK_CLIENT_SECRET", "TEST_SLACK_CHANNEL")
        CredentialName = "SC - Slack"
    }
)

$workflows = Invoke-N8nApi -Path "/workflows"
$workflowByName = @{}
foreach ($item in $workflows.data) {
    $workflowByName[$item.name] = $item
}

$failures = 0
$skipped = 0

foreach ($test in $tests) {
    Write-Host ""
    Write-Host "=== $($test.Name) ==="

    $missingEnv = @($test.RequiredEnv | Where-Object { [string]::IsNullOrWhiteSpace($envMap[$_]) })
    if ($missingEnv.Count -gt 0) {
        Write-Host "SKIP - missing in .env: $($missingEnv -join ', ')"
        $skipped++
        continue
    }

    if ($credentialNames.Count -gt 0 -and $credentialNames -notcontains $test.CredentialName) {
        Write-Host "SKIP - credential $($test.CredentialName) not in manifest. Run seed-credentials.ps1 or create in n8n UI."
        $skipped++
        continue
    }

    if (-not $workflowByName.ContainsKey($test.Name)) {
        Write-Host "FAIL - workflow $($test.Name) not found. Run import-workflows.ps1 first."
        $failures++
        continue
    }

    $workflowId = $workflowByName[$test.Name].id

    try {
        Set-N8nWorkflowActive -WorkflowId $workflowId -Active $true | Out-Null
        Start-Sleep -Seconds 2

        $webhookUrl = "$baseUrl/webhook/$($test.WebhookPath)"
        $response = Invoke-WebRequest -Uri $webhookUrl -Method Post -UseBasicParsing -TimeoutSec 120

        if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300) {
            Write-Host "PASS - webhook returned $($response.StatusCode)"
        }
        else {
            Write-Host "FAIL - webhook returned $($response.StatusCode)"
            $failures++
        }
    }
    catch {
        Write-Host "FAIL - $($_.Exception.Message)"
        if ($test.CredentialName -eq "SC - Gemini") {
            Write-Host "Hint: Run .\n8n\scripts\test-gemini-api-key.ps1 to test the key outside n8n."
            Write-Host "      AQ keys are valid - see docs/CREDENTIALS.md if REST works but n8n fails."
        }
        elseif ($test.CredentialName -ne "SC - Gemini") {
            Write-Host "Hint: OAuth credentials may need account connection in n8n UI."
        }
        $failures++
    }
    finally {
        try {
            Set-N8nWorkflowActive -WorkflowId $workflowId -Active $false | Out-Null
        }
        catch {
            Write-Host "Warning: could not deactivate workflow $($test.Name)."
        }
    }
}

Write-Host ""
if ($failures -gt 0) {
    Write-Error "$failures credential test(s) failed."
}

if ($skipped -eq $tests.Count) {
    Write-Host "All tests skipped - fill in .env values and run seed-credentials.ps1, then retry."
    exit 0
}

Write-Host "Credential validation complete."
