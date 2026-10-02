# DistressDeals Railway Worker

Background worker that syncs property data from Supabase → your Base44 app every 2 hours.

## Why this exists

Base44's built-in scheduled workflows consume integration credits. This worker runs on Railway (free tier is fine) and calls your app's `workerSync` function directly — **zero Base44 credits consumed**.

## Deploy to Railway

### Option A: Deploy from GitHub (recommended)
1. Push this `railway/` folder to your GitHub repo (happens automatically with 2-way sync)
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
3. Select your repo, set the root directory to `railway/`
4. Railway auto-detects `package.json` and runs `npm start`

### Option B: Deploy from CLI
```bash
cd railway
npm install
npm install -g @railway/cli
railway login
railway init
railway up
```

## Environment Variables

Set these in Railway → Settings → Variables:

| Variable | Value |
|----------|-------|
| `APP_URL` | `https://distressed-deals.base44.app` |
| `WORKER_SECRET` | *(same value you set in Base44 → Secrets)* |

## How it works

1. Worker starts and runs sync immediately
2. Every 2 hours, it POSTs to `https://distressed-deals.base44.app/functions/workerSync`
3. The function authenticates via `WORKER_SECRET` (no user login needed)
4. It reads from your Supabase project and upserts properties into the app database
5. Results are logged in Railway's dashboard

## Supabase Setup

Create a table in your Supabase project ("Universal Property Intelligence") with at minimum:
- `title` (text)
- `address` (text)
- `city` (text)
- `state` (text)
- `asking_price` (numeric)
- `category` (text — e.g. "Foreclosure", "Pre-Foreclosure", "Short Sale")

Optional fields: `arv`, `estimated_repair_cost`, `projected_roi`, `sqft`, `beds`, `baths`, `year_built`, `description`, `distress_reason`, `images` (json array), `lat`, `lng`

Once the table exists, the worker will automatically discover it and start syncing.