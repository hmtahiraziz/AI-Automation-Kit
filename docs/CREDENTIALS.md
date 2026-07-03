# Credentials — S-C AI Automation Kit

This kit uses four pre-named credentials. Always use these exact names so test workflows and forks stay compatible.

| Credential name | n8n type | Auth |
|-----------------|----------|------|
| `SC - Gemini` | Google Gemini(PaLM) Api | API key |
| `SC - Gmail` | Gmail OAuth2 | OAuth |
| `SC - Google Sheets` | Google Sheets OAuth2 | OAuth |
| `SC - Slack` | Slack OAuth2 API | OAuth |

---

## Quick setup

```powershell
# 1. Fill .env (see below)
# 2. Bootstrap credentials + test workflows
.\n8n\scripts\setup-phase2.ps1

# 3. Finish OAuth in n8n UI
# http://localhost:5678 → Credentials → Connect my account

# 4. Validate
.\n8n\scripts\validate-credentials.ps1
```

---

## 1. Google Gemini (LLM)

**Uses API key only — no OAuth.**

Google AI Studio now issues two key types ([docs](https://ai.google.dev/gemini-api/docs/api-key)):

| Prefix | Type | Notes |
|--------|------|-------|
| `AIzaSy...` | Standard (legacy) | Older keys; still works |
| `AQ....` | Authorization (new default) | What new free keys use in 2026 |

1. Open [Google AI Studio](https://aistudio.google.com/apikey)
2. Create an API key (`AIzaSy...` or `AQ....`)
3. Add to `.env`:

   ```env
   GEMINI_API_KEY=AQ.your_key_here
   GEMINI_MODEL=models/gemini-2.5-flash
   ```

   For workflow import, the model is stored as `gemini-2.5-flash` (n8n node format). REST test scripts keep the `models/` prefix.

4. Test the key **outside n8n** first:

   ```powershell
   .\n8n\scripts\test-gemini-api-key.ps1
   ```

5. Push key to n8n:

   ```powershell
   .\n8n\scripts\update-gemini-key.ps1
   ```

**Test workflow:** `Test Gemini` (webhook: `POST /webhook/kit-test-gemini`)

Main Automation uses **Gemini Summary** (Basic LLM Chain) with a **Google Gemini Chat Model** sub-node linked to the **`SC - Gemini`** credential (`Google Gemini(PaLM) Api`).

### Gemini troubleshooting (AQ keys)

If `test-gemini-api-key.ps1` **passes** but **Google Gemini Chat Model** fails with `ACCESS_TOKEN_TYPE_UNSUPPORTED`, your `AQ....` key may not work in n8n's LangChain node yet. Try an `AIzaSy...` standard key, or upgrade n8n.

Re-apply the LangChain Gemini nodes:

```powershell
.\n8n\scripts\upgrade-gemini-rest.ps1
.\n8n\scripts\update-gemini-key.ps1
```

---

## 2. Google OAuth (Gmail + Sheets)

**One Google Cloud project covers both Gmail and Sheets.**

### Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or select existing)
3. Enable APIs:
   - **Gmail API**
   - **Google Sheets API**
4. **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized redirect URI (required):

   ```
   http://localhost:5678/rest/oauth2-credential/callback
   ```

7. Copy **Client ID** and **Client Secret** to `.env`:

   ```env
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```

### n8n UI — connect accounts

1. Run `.\n8n\scripts\seed-credentials.ps1`
2. Open http://localhost:5678 → **Credentials**
3. Open **SC - Gmail** → **Connect my account** → sign in → Save
4. Open **SC - Google Sheets** → **Connect my account** → sign in → Save

**Test workflows:**
- `Test Gmail` — lists Gmail labels
- `Test Google Sheets` — reads cell A1 from your test sheet

### Google Sheets test sheet

1. Create a Google Sheet
2. Put `OK` in cell **A1** (Sheet1)
3. Copy the Sheet ID from the URL:

   ```
   https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
   ```

4. Add to `.env`:

   ```env
   TEST_GOOGLE_SHEET_ID=your-sheet-id
   TEST_GOOGLE_SHEET_NAME=Sheet1
   ```

5. Re-import workflows: `.\n8n\scripts\import-workflows.ps1`

---

## 3. Slack OAuth

### Slack app setup

1. Go to [api.slack.com/apps](https://api.slack.com/apps) → **Create New App**
2. **OAuth & Permissions** → add Bot Token Scopes:
   - `chat:write`
   - `channels:read`
3. **Redirect URL**:

   ```
   http://localhost:5678/rest/oauth2-credential/callback
   ```

4. Install app to workspace
5. Copy **Client ID** and **Client Secret** to `.env`:

   ```env
   SLACK_CLIENT_ID=...
   SLACK_CLIENT_SECRET=...
   TEST_SLACK_CHANNEL=#your-dev-channel
   ```

### n8n UI

1. Run `.\n8n\scripts\seed-credentials.ps1`
2. Open **SC - Slack** → **Connect my account** → authorize → Save

**Test workflow:** `Test Slack` — posts "Kit test OK" to your channel

---

## Validate all credentials

```powershell
.\n8n\scripts\validate-credentials.ps1
```

This script:
1. Activates each test workflow
2. Calls its webhook
3. Deactivates the workflow
4. Reports PASS / SKIP / FAIL per provider

Tests are **skipped** if the required `.env` values are missing.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `redirect_uri_mismatch` | Redirect URI must exactly match `http://localhost:5678/rest/oauth2-credential/callback` |
| Gemini test returns 500 | Verify `GEMINI_API_KEY`, check [AI Studio quota](https://aistudio.google.com/apikey) |
| Gmail/Sheets "not connected" | Open credential in n8n → **Connect my account** |
| Sheets test fails | Verify `TEST_GOOGLE_SHEET_ID` and that A1 contains data |
| Slack test fails | Verify bot is invited to channel, `TEST_SLACK_CHANNEL` is correct |
| Slack/Gmail `DNS server returned an error` / `EAI_AGAIN` | Docker DNS flake — `docker-compose.yml` sets Google/Cloudflare DNS + IPv4-first on n8n; run `docker compose up -d n8n` and retry |
| Webhook 404 | Run `import-workflows.ps1` then `link-credentials.ps1`, activate workflow once in UI |

---

## Production

For deployed environments, update:

- `WEBHOOK_URL` and `N8N_HOST` in `.env`
- OAuth redirect URIs in Google Cloud and Slack to your production n8n URL
