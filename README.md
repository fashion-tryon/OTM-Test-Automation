# OTM Automation Portal

Playwright + Allure test automation portal for Oracle Transportation Management.

## Local Setup

1. `npm install`
2. `cp regions.template.json regions.json`
3. Update `regions.json` with real OTM credentials for each region
4. Create `.env` with `OTM_URL=<your-otm-url>` and `PORT=3000`
5. `node server/index.js`

Open `http://localhost:3000`

## Railway Deployment

Set these environment variables in the Railway dashboard:

| Variable | Description |
|----------|-------------|
| `OTM_URL` | OTM instance URL |
| `REGIONS_JSON` | Full JSON content of regions.json (with real credentials) |
| `PORT` | Set automatically by Railway |

The server reads `REGIONS_JSON` env var as a fallback when `regions.json` is not present on disk.

## Tech Stack

- React 18 + Vite + Tailwind CSS + Recharts
- Node.js (raw http — no Express)
- SQLite (better-sqlite3)
- Playwright + Allure Reporter
- Railway deployment (Nixpacks)

## Features

- **Dashboard** — live step-by-step test progress via SSE, pass rate trend chart, recent runs
- **Run History** — filterable by region and status
- **Run Detail** — per-step results with screenshots
- **Test Case Registry** — full CRUD for test suites and test cases per region
