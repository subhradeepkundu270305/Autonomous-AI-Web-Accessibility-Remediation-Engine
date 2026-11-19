# Autonomous AI Web Accessibility Remediation Engine

> **Scan any website for WCAG 2.1 AA violations, get AI-generated code fixes, download a `patch.js` and a PDF report — end to end, no manual steps.**

[![Phase](https://img.shields.io/badge/phase-MVP%20Complete-green)](#phases)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](#)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](#)
[![Gemini](https://img.shields.io/badge/Gemini-3.8%20Flash-orange?logo=google)](#)
[![Playwright](https://img.shields.io/badge/Playwright-1.47-green?logo=playwright)](#)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          USER BROWSER                                    │
│                                                                          │
│  React + Tailwind (Vite · port 5173)                                     │
│  ┌──────────┐   POST /api/scans ──────►  Express (port 3001)            │
│  │ Home     │   ◄── 202 { scanId }        │ Rate limit (5/min/IP)       │
│  │ Scan     │   GET /api/scans/:id ◄──── │ JWT auth (optional)          │
│  │ Results  │   (poll every 2s)           │                              │
│  └──────────┘                             │                              │
│  Login / Register                         ▼                              │
└─────────────────────────────────────────────────────────────────────────┘
                                  SCAN PIPELINE (async)
                        ┌─────────────────────────────────┐
                        │ 1. URL Validator + robots.txt   │
                        │ 2. Playwright → HTML+screenshot │
                        │ 3. axe-core → issues list       │
                        │ 4. Gemini Vision → JSON fixes   │
                        │    (Zod validated + selector    │
                        │     validation against DOM)     │
                        │ 5. patch-gen → patch.js file    │
                        │ 6. Prisma → PostgreSQL          │
                        └─────────────────────────────────┘
```

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React 18 + Vite + Tailwind CSS | Fast DX, small bundle |
| Backend | Node.js + Express.js (TypeScript) | Familiar, large ecosystem |
| Browser automation | Playwright | More reliable than Puppeteer |
| Accessibility engine | axe-core | Industry standard, 70+ WCAG rules |
| AI / Vision | Google Gemini 3.8 Flash (`@google/genai ≥ 2.3.0`) | Multimodal vision, best JSON output |
| ORM | **Prisma v5** | Auto-generated types, migration CLI, `prisma studio` GUI |
| Database | PostgreSQL 16 | Relational integrity for issues ↔ fixes |
| Auth | JWT + bcryptjs | Stateless, no external service |
| Validation | Zod | Runtime validation of all AI output |
| PDF | pdfkit | Lightweight, no browser dependency |
| HTML parsing | cheerio | Selector validation on AI output |

> **ORM choice:** Prisma over Drizzle — superior TypeScript codegen keeps all 4 team members in sync, excellent migration tooling, and `prisma studio` visual GUI for easy DB inspection.

---

## Project Structure

```
.
├── frontend/
│   ├── src/
│   │   ├── api/              # Axios client + scans/auth API helpers
│   │   ├── components/       # ScoreGauge, IssueCard, IssueBadge, Layout, ProgressStep, ProtectedRoute
│   │   ├── hooks/            # useAuth, useScanPolling
│   │   ├── pages/            # HomePage, ScanPage, ResultsPage, LoginPage, RegisterPage
│   │   └── types/            # API types (Scan, Issue, Fix, Auth)
│   ├── tailwind.config.js
│   └── vite.config.ts        # Dev proxy to Express
│
├── backend/
│   ├── src/
│   │   ├── config/env.ts     # Zod-validated env (fails fast)
│   │   ├── db/client.ts      # Prisma singleton
│   │   ├── middleware/       # errorHandler, auth, notFoundHandler
│   │   ├── modules/
│   │   │   ├── scanner/      # Playwright → HTML + screenshot
│   │   │   ├── rules-engine/ # axe-core + score calculator
│   │   │   ├── ai-fixer/     # Gemini Vision + Zod + selector validation
│   │   │   └── patch-gen/    # Converts fixes → patch.js
│   │   ├── routes/           # auth, scans, projects, health
│   │   ├── services/
│   │   │   ├── scanQueue.ts  # In-process async job queue (2 concurrent)
│   │   │   ├── scanPipeline.ts # Full 6-step pipeline
│   │   │   └── pdfGenerator.ts # pdfkit PDF report
│   │   ├── tests/            # integration.test.ts (vitest + supertest)
│   │   └── utils/urlValidator.ts # SSRF protection + robots.txt
│   ├── prisma/schema.prisma  # DB schema
│   ├── fixtures/bad-accessibility.html  # 12 deliberate WCAG violations
│   └── vitest.config.ts
│
├── docker-compose.yml        # PostgreSQL 16
├── .env.example              # All env vars documented
└── README.md
```

---

## Quick Start

### Prerequisites
- **Node.js** ≥ 20 (LTS)
- **Docker** + **Docker Compose**
- A **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/app/apikey)

### 1 — Clone & install

```bash
git clone <repo-url> a11y-engine
cd a11y-engine
npm install
```

### 2 — Configure environment

```bash
cp .env.example .env
# Edit .env and set:
#   GEMINI_API_KEY=your_key_here
#   JWT_SECRET=a_random_32+_char_string
```

### 3 — Start PostgreSQL

```bash
docker compose up -d
# Postgres starts at localhost:5432
```

### 4 — Run database migration

```bash
cd backend
npm run db:generate   # Generate Prisma client types
npm run db:migrate    # Create all tables
cd ..
```

### 5 — Install Playwright browsers

```bash
cd backend
npx playwright install chromium
cd ..
```

### 6 — Start development servers

```bash
npm run dev
# Backend:  http://localhost:3001
# Frontend: http://localhost:5173
```

### 7 — Verify

```bash
curl http://localhost:3001/health
# → {"status":"ok","timestamp":"...","uptime":...}
```

Open http://localhost:5173, paste a URL, click **Scan Website** 🚀

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/scans` | Optional | Start scan — returns `{ scanId }` immediately (202) |
| `GET` | `/api/scans/:id` | No | Poll scan status + full results with issues & fixes |
| `GET` | `/api/scans/:id/progress` | No | SSE stream of real-time progress events |
| `GET` | `/api/scans/:id/patch` | No | Download `patch.js` file |
| `GET` | `/api/scans/:id/report` | No | Download PDF report |
| `POST` | `/api/auth/register` | No | Register with email + password |
| `POST` | `/api/auth/login` | No | Login → JWT token |
| `GET` | `/api/auth/me` | JWT | Get current user |
| `GET` | `/health` | No | Health check |

---

## Database Schema

```
users ──< projects ──< scans ──< issues ──< fixes (one-to-one)
```

Run `npm run db:studio --workspace=backend` to open the **Prisma Studio** visual GUI.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `GEMINI_API_KEY` | ✅ | — | Google AI Studio API key |
| `JWT_SECRET` | ✅ | — | ≥16 char random secret for JWT signing |
| `PORT` | — | `3001` | Backend port |
| `CORS_ORIGIN` | — | `http://localhost:5173` | Allowed frontend origin |
| `SCAN_TIMEOUT_MS` | — | `30000` | Playwright page load timeout |
| `RATE_LIMIT_MAX_REQUESTS` | — | `5` | Max scans per IP per minute |
| `GEMINI_HTML_MAX_BYTES` | — | `50000` | Max HTML sent to Gemini |
| `UPLOADS_DIR` | — | `./uploads` | Screenshot + patch storage path |

---

## Running Tests

```bash
cd backend
npm test
# Runs: integration tests (URL validator, score calculator, API endpoints)
```

---

## Key Security Decisions

- **SSRF protection** — `urlValidator.ts` rejects localhost, 127.x.x.x, 192.168.x, 10.x, 172.16–31.x
- **AI output validation** — every Gemini response is validated against a Zod schema + CSS selector validated against the actual captured DOM before being trusted
- **Rate limiting** — 5 scans per IP per minute (configurable)
- **robots.txt** — respected; scanning aborted if disallowed
- **JWT** — tokens signed with HS256, 7-day expiry, never stored server-side

---

## Phases

| Phase | Status | Description |
|-------|--------|-------------|
| **0 — Scaffold** | ✅ | Monorepo, TypeScript, ESLint, Prettier, docker-compose, .env.example |
| **1 — Playwright capture** | ✅ | POST /api/scans, async queue, Playwright HTML/screenshot + robots.txt |
| **2 — axe-core** | ✅ | Accessibility rule engine, 70+ WCAG 2.1 AA rules, score calculator |
| **3 — Gemini integration** | ✅ | Vision API call, Zod validation, selector validation, retry logic |
| **4 — Patch generator** | ✅ | Converts fixes → safe downloadable patch.js |
| **5 — Database** | ✅ | Prisma persistence, GET /api/scans/:id with nested issues + fixes |
| **6 — Frontend dashboard** | ✅ | Score gauge, issue list, filters, screenshot, downloads |
| **7 — Auth** | ✅ | JWT signup/login, scans optionally tied to users |
| **8 — PDF export** | ✅ | pdfkit PDF with score, breakdown, per-issue fixes |
| **9 — Testing & polish** | ✅ | Integration tests, error states, SSRF guard, README |

---

## Deployment (target — not yet deployed)

| Service | Platform | Notes |
|---------|----------|-------|
| Frontend | **Vercel** | `frontend/` dir, `vite build`, set `VITE_API_BASE_URL` |
| Backend | **Render** or **Railway** | Node 22, add Playwright buildpack, set all env vars |
| Database | **Render Postgres** or **Supabase** | Copy connection string to `DATABASE_URL` |

### Render Backend Deploy Notes
```yaml
# render.yaml (add to root)
buildCommand: "npm install && npx playwright install-deps chromium && npx playwright install chromium && cd backend && npm run db:generate && npm run db:migrate"
startCommand: "cd backend && npm start"
```

---

## Team

Built by a team of 4 B.Tech CS students as a final-year project — demonstrating hybrid AI + rule-based accessibility remediation.

---

## License

MIT
