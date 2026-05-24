# Aurra — Production Deployment Runbook

Stack: Render (web service) + Neon Postgres + Google OAuth + OpenAI + Replicate.

## 1. Provision external services

### 1a. Neon Postgres
1. Sign up at https://console.neon.tech (free tier).
2. Create project `aurra-prod`. Region close to Render region (Oregon if using Render free).
3. Copy the **pooled** connection string (ends with `?sslmode=require`). This is `DATABASE_URL`.

### 1b. Google OAuth
1. https://console.cloud.google.com → create project `Aurra`.
2. APIs & Services → OAuth consent screen → External → fill app name, support email.
3. Credentials → Create Credentials → OAuth client ID → Web application.
4. **Authorized redirect URIs** (add both):
   - `http://localhost:5000/api/auth/google/callback` (local dev)
   - `https://<your-render-host>/api/auth/google/callback` (prod — fill after first deploy)
5. Copy `Client ID` and `Client Secret`.

### 1c. Anthropic (Claude)
- https://console.anthropic.com/settings/keys → create key. Save as `ANTHROPIC_API_KEY`.
- Add credit at https://console.anthropic.com/settings/billing. Sonnet 4.6 is $3/M input, $15/M output. Prompt caching reduces input cost by ~90% on cache hits.

### 1d. Replicate
- https://replicate.com/account/api-tokens → create token. Save as `REPLICATE_API_TOKEN`.

## 2. Local smoke test

```powershell
cp .env.example .env
# fill in DATABASE_URL, SESSION_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
# ANTHROPIC_API_KEY, REPLICATE_API_TOKEN, PUBLIC_URL=http://localhost:5000

npm install
npm run db:push    # creates tables in Neon
npm run dev        # starts on http://localhost:5000
```

Click "Get Started" → should redirect to Google → back to app, logged in.

## 3. Deploy to Render

1. Push repo to GitHub.
2. Render → New → Blueprint → connect repo. It reads `render.yaml`.
3. Render will prompt for the `sync: false` env vars. Paste:
   - `PUBLIC_URL` = `https://<service>.onrender.com` (you'll know after step 4 — set placeholder, update after)
   - `DATABASE_URL` = Neon pooled URL
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
   - `ANTHROPIC_API_KEY`, `REPLICATE_API_TOKEN`
   - Leave Stripe/PayPal blank (subscriptions hidden in v1).
4. First deploy runs `npm ci && npm run build && npm run db:push`.
5. Once live, copy the Render URL, update `PUBLIC_URL`, **redeploy**.
6. Add `https://<render-url>/api/auth/google/callback` to Google OAuth allowed redirects.

## 4. Verify in production

- `/` loads landing page.
- Click Get Started → Google → returns to `/dashboard`.
- `/api/auth/user` returns JSON with your email.
- Generate one outfit end-to-end to confirm OpenAI + Replicate keys work.

## 5. Operational notes

- **Sessions** live in Postgres `sessions` table — auto-created on first boot.
- **Free Render tier sleeps after 15 min idle.** First request takes ~30s to wake. Upgrade to Starter ($7/mo) to eliminate.
- **Neon free tier** auto-suspends inactive branches; first query may take ~1s. Fine for v1.
- **OpenAI/Replicate cost** ~$0.01–0.05 per outfit generation. Monitor usage dashboards.
- **Logs**: Render Dashboard → service → Logs.
- **Schema migrations**: run `npm run db:push` locally pointed at prod `DATABASE_URL`, or include in `buildCommand` (already done).

## 6. Rollback

Render keeps prior deploys. Dashboard → Deploys → "Rollback to this deploy".

## 7. What's intentionally NOT in v1

- Stripe/PayPal subscriptions (hidden per product spec; env vars accepted but unused).
- Email/password auth (Google OAuth only).
- Admin panel auth gating (admin route exists but trusts session — restrict by email in [server/routes.ts](server/routes.ts) before public launch).
