# Dashboard — S-C Automation Kit

Next.js monitoring UI for n8n workflows.

## Prerequisites

- n8n running (`docker compose up -d`)
- `N8N_API_KEY` created in n8n → Settings → API
- Main Automation imported (`.\n8n\scripts\import-workflows.ps1`)

## Setup

1. Copy environment file:

   ```powershell
   copy dashboard\.env.local.example dashboard\.env.local
   ```

2. Fill `dashboard/.env.local`:

   ```env
   N8N_API_KEY=<same as root .env>
   N8N_INTERNAL_URL=http://localhost:5678
   NEXT_PUBLIC_N8N_URL=http://localhost:5678
   ```

3. Install and run:

   ```powershell
   cd dashboard
   npm install
   npm run dev
   ```

4. Open http://localhost:3000

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Overview — success/fail rates, last run, recent activity |
| `/settings` | Kit operations — **Run now**, **Seed sheet**, config |
| `/workflows` | Kit workflows with on/off toggles |
| `/executions` | Execution log table |
| `/executions/[id]` | Run detail — summary, errors, nodes |
| `/credentials` | Connect-account stubs linking to n8n |

## API routes

| Route | Description |
|-------|-------------|
| `GET /api/workflows` | List all n8n workflows |
| `GET /api/workflows/kit` | Kit workflows merged with n8n status |
| `POST /api/workflows/[id]/toggle` | Activate/deactivate (`{ "active": true }`) |
| `GET /api/executions` | List executions (`?workflowId=&limit=`) |
| `GET /api/executions/[id]` | Execution detail with parsed summary |
| `GET /api/credentials` | Kit credentials merged with n8n |
| `POST /api/kit/run` | Execute **Main Automation** |
| `POST /api/kit/seed-sheet` | Seed Google Sheet demo rows |

`N8N_API_KEY` is **server-only** — never exposed to the browser.

## Docker

Root `docker-compose.yml` includes a `dashboard` service:

```powershell
docker compose up -d --build
```

Environment (from root `.env`):

- `N8N_API_KEY` — server-side n8n API
- `N8N_INTERNAL_URL` — `http://n8n:5678` inside Docker network
- `NEXT_PUBLIC_N8N_URL` — browser links to n8n (default `http://localhost:5678`)

Sync local dev env from root `.env`:

```powershell
.\n8n\scripts\sync-dashboard-env.ps1
```

## Customizing for a fork

Edit `dashboard/kit.config.ts`:

- `name` — kit title in sidebar
- `primaryWorkflow` — workflow name for overview filtering
- `workflows` — labels shown on `/workflows`
- `credentials` — labels shown on `/credentials`

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "n8n API not configured" | Create `dashboard/.env.local` with `N8N_API_KEY` |
| "Could not reach n8n" | Ensure n8n is up: `.\n8n\scripts\wait-healthy.ps1` |
| No executions shown | Run **Main Automation** once in n8n |
| Workflow not found | `.\n8n\scripts\import-workflows.ps1` |
| Toggle fails | Workflow must exist in n8n; check API key permissions |
| OAuth not connected | Use **Connect in n8n** on `/credentials` |
| Run now fails | Ensure `N8N_API_KEY` has workflow execute scope |
| Seed sheet fails | Connect Google Sheets OAuth; set `TEST_GOOGLE_SHEET_ID` |

## Docker (Sprint 4)

Dashboard runs via `docker compose up` — see root [README.md](../README.md).
