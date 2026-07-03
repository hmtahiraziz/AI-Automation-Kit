# S-C AI Automation Kit

Reusable **n8n + Next.js** kit: Google Sheets → Gemini standup → Slack + Gmail, with a monitoring dashboard.

```powershell
copy .env.example .env
# Fill N8N_ENCRYPTION_KEY, POSTGRES_PASSWORD, API keys, OAuth, sheet ID

.\n8n\scripts\setup-phase3.ps1
```

**Done:** `docker compose up` runs **n8n** (5678) and **dashboard** (3000).

| URL | Service |
|-----|---------|
| http://localhost:3000 | Dashboard — overview, run/seed, logs |
| http://localhost:5678 | n8n — workflows & credentials |

---

## Fork this kit (2 files)

Most customization is **only** these files:

### 1. `dashboard/kit.config.ts`

| Field | What to change |
|-------|----------------|
| `name` / `description` | Sidebar title and overview subtitle |
| `primaryWorkflow` | Workflow name for overview + **Run now** |
| `primaryWebhookPath` / `seedWebhookPath` | Dashboard webhook paths (`kit-run-main`, `kit-seed-sheet`) |
| `workflows[]` | Labels on `/workflows` |
| `credentials[]` | Labels on `/credentials` |

Workflow **names** must match JSON files under `n8n/workflows/`.

### 2. `.env`

| Group | Keys |
|-------|------|
| Docker / n8n | `N8N_ENCRYPTION_KEY`, `POSTGRES_PASSWORD`, `N8N_API_KEY`, `GENERIC_TIMEZONE` |
| Gemini | `GEMINI_API_KEY`, `GEMINI_MODEL` |
| Google OAuth | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| Slack | `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET` |
| Automation | `TEST_GOOGLE_SHEET_ID`, `TEST_SLACK_CHANNEL`, `MAIN_GMAIL_TO`, `MAIN_SCHEDULE_CRON` |
| Dashboard | `NEXT_PUBLIC_N8N_URL`, `NEXT_PUBLIC_KIT_NAME` |

After editing `.env`:

```powershell
.\n8n\scripts\sync-dashboard-env.ps1
docker compose up -d --build
```

Rename credential prefixes (`SC - Gemini` → `YourCo - Gemini`) in:

- `dashboard/kit.config.ts`
- `n8n/credentials/*.json` (if any)
- Re-run `.\n8n\scripts\seed-credentials.ps1`

---

## Project layout

```
docker-compose.yml      # postgres + n8n + dashboard
.env                    # secrets & kit targets (single source)
dashboard/
  kit.config.ts         # fork branding & workflow list
  Dockerfile            # production dashboard image
n8n/
  workflows/            # git-tracked workflow JSON
  scripts/              # import, seed, setup phases
docs/                   # SETUP, CREDENTIALS, DASHBOARD, MAIN-AUTOMATION
```

---

## Setup phases

| Script | Purpose |
|--------|---------|
| `setup-phase2.ps1` | Credentials + import workflows + link |
| `setup-phase3.ps1` | Docker stack + phase 2 + dashboard env sync |
| `upgrade-main-automation.ps1` | Patch live Main Automation (Sprint 3 nodes) |
| `seed-sheet-data.ps1` | Populate Google Sheet via webhook |
| `sync-dashboard-env.ps1` | Copy `N8N_API_KEY` → `dashboard/.env.local` |

---

## Dashboard actions

On **Overview** (`/`):

- **Run now** — executes **Main Automation** via n8n API
- **Seed sheet** — triggers `kit-seed-sheet` webhook (demo standup rows)

Requires `N8N_API_KEY` with workflow execute permission.

---

## Docs

- [SETUP.md](docs/SETUP.md) — first-time install
- [CREDENTIALS.md](docs/CREDENTIALS.md) — OAuth & API keys
- [MAIN-AUTOMATION.md](docs/MAIN-AUTOMATION.md) — standup pipeline
- [DASHBOARD.md](docs/DASHBOARD.md) — routes & API

---

## Local dev (without Docker dashboard)

```powershell
docker compose up -d postgres n8n
.\n8n\scripts\sync-dashboard-env.ps1
cd dashboard
npm install
npm run dev
```
