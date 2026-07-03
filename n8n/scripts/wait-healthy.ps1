param(
    [string]$Url = "http://localhost:5678/healthz",
    [int]$MaxRetries = 30,
    [int]$SleepSeconds = 2
)

for ($i = 1; $i -le $MaxRetries; $i++) {
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "n8n is healthy."
            exit 0
        }
    }
    catch {
        Write-Host "Waiting for n8n... attempt $i/$MaxRetries"
    }

    Start-Sleep -Seconds $SleepSeconds
}

Write-Error "n8n did not become healthy in time."
exit 1
