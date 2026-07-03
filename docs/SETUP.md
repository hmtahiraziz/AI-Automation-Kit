# Setup — S-C AI Automation Kit (n8n)

## Prerequisites

- Docker Desktop
- PowerShell (Windows) or Bash (macOS/Linux)

## Quick start

1. Copy environment file:

   ```powershell
   copy .env.example .env
   ```

2. Set strong values in `.env`:
   - `N8N_ENCRYPTION_KEY` (32+ random characters)
   - `POSTGRES_PASSWORD`
   - `N8N_API_KEY` (create in n8n after first login)

3. Start the stack:

   ```powershell
   docker compose up -d
   ```

4. Wait for n8n:

   ```powershell
   .\n8n\scripts\wait-healthy.ps1
   ```

5. Open n8n: http://localhost:5678

6. Import kit workflows:

   ```powershell
   .\n8n\scripts\import-workflows.ps1
   ```

## Verify persistence

1. Confirm **Persistence Test** workflow exists in n8n.
2. Restart containers:

   ```powershell
   docker compose restart
   ```

3. Reload http://localhost:5678 — the workflow should still be there.

## Export a workflow to git

1. Open the workflow in n8n.
2. Click the menu (top right) → **Download**.
3. Save the JSON under `n8n/workflows/`.
4. Commit the file.

## Create n8n API key

1. n8n → **Settings** → **API**
2. Create API key
3. Paste into `.env` as `N8N_API_KEY`

## Useful commands

```powershell
docker compose ps
docker compose logs n8n
docker compose restart
.\n8n\scripts\import-workflows.ps1
```

## Phase 2 — Credentials and test workflows

See [CREDENTIALS.md](./CREDENTIALS.md) for full setup.

```powershell
# Bootstrap credentials + import test workflows
.\n8n\scripts\setup-phase2.ps1

# After filling .env and connecting OAuth in n8n UI:
.\n8n\scripts\validate-credentials.ps1
```

Test workflows imported:

| Workflow | Webhook path | Credential |
|----------|--------------|------------|
| Test Gemini | `POST /webhook/kit-test-gemini` | SC - Gemini |
| Test Gmail | `POST /webhook/kit-test-gmail` | SC - Gmail |
| Test Google Sheets | `POST /webhook/kit-test-google-sheets` | SC - Google Sheets |
| Test Slack | `POST /webhook/kit-test-slack` | SC - Slack |

## Main automation workflow

**Main Automation** (`n8n/workflows/main-automation.json`) — standup pipeline:

```
Manual Trigger ──┐
                 ├── Read Sheet → Gemini standup → Slack → HTML Gmail → Set Result
Schedule Trigger ┘
```

**Sheet columns:** `Project` | `Achieved` | `Left` | `Issues`

Seed standup demo data:

```powershell
.\n8n\scripts\seed-sheet-data.ps1
```

Set in `.env`:

```env
MAIN_GMAIL_TO=you@example.com
MAIN_SCHEDULE_CRON=0 18 * * 1-5
TEST_SLACK_CHANNEL=#your-channel
```

Import and link:

```powershell
.\n8n\scripts\import-workflows.ps1
.\n8n\scripts\upgrade-main-automation.ps1
.\n8n\scripts\link-credentials.ps1
.\n8n\scripts\seed-sheet-data.ps1
```

Run manually in n8n: **Main Automation** → **Test workflow**

Activate on `/workflows` in the dashboard for scheduled runs (weekdays 6 PM by default, `GENERIC_TIMEZONE`).

See [MAIN-AUTOMATION.md](./MAIN-AUTOMATION.md) for output format details.

## Phase 3 — Dashboard

See [DASHBOARD.md](./DASHBOARD.md) for full setup.

**Full stack (n8n + dashboard):**

```powershell
.\n8n\scripts\setup-phase3.ps1
```

Or manually:

```powershell
docker compose up -d --build
.\n8n\scripts\sync-dashboard-env.ps1
```

**Local dev only:**

```powershell
copy dashboard\.env.local.example dashboard\.env.local
.\n8n\scripts\sync-dashboard-env.ps1
cd dashboard
npm install
npm run dev
```

Open http://localhost:3000 — overview with **Run now** / **Seed sheet**, execution logs, workflow toggles.
