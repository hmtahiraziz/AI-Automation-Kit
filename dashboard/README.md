# S-C Automation Kit — Dashboard

Next.js 16 monitoring UI for n8n. See [../docs/DASHBOARD.md](../docs/DASHBOARD.md) for full setup.

## Docker (recommended)

From repo root:

```powershell
docker compose up -d --build
```

Open http://localhost:3000

## Local dev

```powershell
..\n8n\scripts\sync-dashboard-env.ps1
npm install
npm run dev
```

## Routes

- `/` — Overview (success/fail rates, last run)
- `/settings` — **Run now**, **Seed sheet**, kit config
- `/workflows` — On/off toggles
- `/executions` — Log table
- `/executions/[id]` — Run detail
- `/credentials` — Connect stubs → n8n

Fork customization: edit `kit.config.ts` and root `.env` — see [../README.md](../README.md).
