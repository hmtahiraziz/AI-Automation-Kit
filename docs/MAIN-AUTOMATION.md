# Main Automation — Standup Pipeline

## Flow

1. **Read Sheet Data** — reads standup rows from Google Sheets
2. **Combine Rows** — merges all sheet rows into one item (one Slack + one Gmail per run)
3. **Gemini Summary** — professional standup text (Project / Achieved / Left / Issues)
3. **Post to Slack** — formatted message with date header
4. **Send Gmail** — HTML email with the same summary
5. **Set Result** — structured payload for the Next.js dashboard

## Triggers

| Trigger | Use |
|---------|-----|
| Manual Trigger | Test runs from n8n UI |
| Run Webhook (`POST /webhook/kit-run-main`) | **Run now** from dashboard Settings |
| Schedule Trigger | Weekdays at 6 PM (`MAIN_SCHEDULE_CRON`, default `0 18 * * 1-5`) |

Timezone: `GENERIC_TIMEZONE` in `.env` (e.g. `Asia/Karachi`).

## Sheet schema

| Project | Achieved | Left | Issues |
|---------|----------|------|--------|
| N8N Dashboard | Phase 2 complete | Dashboard polish | none |

Seed with:

```powershell
.\n8n\scripts\seed-sheet-data.ps1
```

## Outputs

### Slack

```
:clipboard: *Daily Standup — Jul 3, 2026*

Project: ...
Achieved: ...
Left: ...
Issues: none
```

### Gmail

HTML email with dark header, summary in a styled block, kit footer.

### Dashboard log (`Set Result`)

| Field | Description |
|-------|-------------|
| `success` | `true` on completion |
| `summary` | Gemini standup text |
| `providers` | `gemini,gmail,google-sheets,slack` |
| `finishedAt` | ISO timestamp |
| `workflowName` | `Main Automation` |
| `slackChannel` | From `TEST_SLACK_CHANNEL` |
| `gmailTo` | From `MAIN_GMAIL_TO` |

View at http://localhost:3000/executions/[id]

## Environment

```env
TEST_GOOGLE_SHEET_ID=
TEST_GOOGLE_SHEET_NAME=Sheet1
TEST_SLACK_CHANNEL=#dev-automation
MAIN_GMAIL_TO=team@example.com
MAIN_SCHEDULE_CRON=0 18 * * 1-5
GEMINI_MODEL=models/gemini-2.5-flash
GENERIC_TIMEZONE=Asia/Karachi
```

## Deploy changes

```powershell
.\n8n\scripts\import-workflows.ps1
.\n8n\scripts\upgrade-main-automation.ps1
.\n8n\scripts\upgrade-gemini-rest.ps1
.\n8n\scripts\link-credentials.ps1
.\n8n\scripts\seed-sheet-data.ps1
```

Toggle active in dashboard: http://localhost:3000/workflows

Use **Run now** and **Seed sheet** on the overview: http://localhost:3000
