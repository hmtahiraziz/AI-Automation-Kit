$ErrorActionPreference = "Stop"

Write-Host "Phase 2 setup - credentials and test workflows"
Write-Host ""

& (Join-Path $PSScriptRoot "seed-credentials.ps1")
Write-Host ""
& (Join-Path $PSScriptRoot "import-workflows.ps1")
Write-Host ""
& (Join-Path $PSScriptRoot "link-credentials.ps1")

Write-Host ""
Write-Host "Phase 2 bootstrap complete."
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Open http://localhost:5678 and go to Credentials"
Write-Host "  2. Connect OAuth for SC - Gmail, SC - Google Sheets, SC - Slack"
Write-Host "  3. Set TEST_GOOGLE_SHEET_ID and TEST_SLACK_CHANNEL in .env"
Write-Host "  4. Run validate-credentials.ps1 from n8n/scripts"
