# Deploying to Fly.io + connecting Google Calendar

State (your shares + Google tokens) lives on a Fly **volume** mounted at `/data`,
so deploys never wipe it. Availability refreshes from your calendar every
~10 min via an in-server timer.

## 1. Google Cloud — OAuth client (read-only calendar)

1. <https://console.cloud.google.com> → create a project (e.g. "availability").
2. **APIs & Services → Library** → enable **Google Calendar API**.
3. **OAuth consent screen** → **External** → fill app name + your email.
   - Add scope `.../auth/calendar.readonly` (and userinfo.email).
   - Under **Test users**, add **both** Google emails (personal + work). In
     "Testing" mode only test users can authorise — no Google verification
     needed, which is perfect for a personal tool.
4. **Credentials → Create credentials → OAuth client ID → Web application**.
   - **Authorized redirect URIs** (add both):
     - `http://localhost:3000/api/google/callback`
     - `https://<your-app>.fly.dev/api/google/callback`
   - Copy the **Client ID** and **Client secret**.

## 2. Fly.io

```bash
# In the repo root. Edit fly.toml `app = "..."` to a unique name first.
fly apps create <your-app>
fly volumes create availability_data --region lhr --size 1   # 1 GB is plenty

fly secrets set \
  APP_URL="https://<your-app>.fly.dev" \
  GOOGLE_CLIENT_ID="…" \
  GOOGLE_CLIENT_SECRET="…" \
  APP_PASSWORD="<a strong password>"

fly deploy
```

`fly deploy` builds the Dockerfile, mounts the volume, and starts the server.
Re-run `fly deploy` for any code update — the volume (and your state) persists.

## 3. Connect your calendars

1. Open `https://<your-app>.fly.dev/me`, enter your `APP_PASSWORD`.
2. **Connect a Google account** → authorise (personal). Repeat for **work**
   (it signs in the second account and lists its calendars).
3. Tick which calendars feed availability, **Save**. Availability regenerates
   immediately and then every ~10 min.
4. Compose a share, send the link (or **Copy as text**).

## Local development

```bash
cp .env.example .env.local   # set GOOGLE_* + APP_URL=http://localhost:3000
npm run dev                  # APP_PASSWORD unset → no gate locally
```

## Later

- **Instant updates:** add a Google push webhook that POSTs `/api/regenerate`
  (set `REGEN_SECRET`). The refresh timer stays as a safety net.
- **LLM refine:** set `ANTHROPIC_API_KEY` to swap the heuristic for the cached
  LLM refine pass.
