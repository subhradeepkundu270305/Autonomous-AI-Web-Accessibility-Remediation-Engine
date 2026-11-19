#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# start.sh — One-shot script to set up and launch the A11y Remediation Engine
# Usage: bash start.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/backend"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   A11y Remediation Engine — Startup Script          ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ── 1. Check Node.js ─────────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  echo "❌  Node.js not found. Install Node.js >= 20 first."
  exit 1
fi
echo "✅  Node.js $(node --version)"

# (Database is now SQLite — no Docker or PostgreSQL required!)

# ── 2. Install dependencies ───────────────────────────────────────────────────
echo ""
echo "📦  Installing dependencies..."
cd "$ROOT"
npm install --legacy-peer-deps

# ── 3. Check .env ─────────────────────────────────────────────────────────────
if [ ! -f "$BACKEND/.env" ]; then
  echo "⚠️   backend/.env not found — copying from .env.example"
  cp "$ROOT/.env.example" "$BACKEND/.env"
  echo ""
  echo "   ⚠️  ACTION REQUIRED: Edit backend/.env and set:"
  echo "      GEMINI_API_KEY=<your key from https://aistudio.google.com/app/apikey>"
  echo "      JWT_SECRET=<random 32+ char string>"
  echo ""
  read -p "   Press ENTER after editing backend/.env to continue..."
fi

# Check for placeholder values
if grep -q "your_gemini_api_key_here" "$BACKEND/.env" 2>/dev/null; then
  echo ""
  echo "❌  GEMINI_API_KEY is still the placeholder value!"
  echo "   Edit backend/.env and set your real Gemini API key."
  echo "   Get one free at: https://aistudio.google.com/app/apikey"
  exit 1
fi

echo "✅  backend/.env looks good"

# ── 4. Generate Prisma client ─────────────────────────────────────────────────
echo ""
echo "🗄️   Generating Prisma client..."
cd "$BACKEND"
npm run db:generate

# ── 5. Run database migration (SQLite) ────────────────────────────────────────
echo ""
echo "🗄️   Running database migrations..."
npm run db:migrate

# ── 6. Install Playwright browsers ───────────────────────────────────────────
echo ""
echo "🎭  Installing Playwright Chromium browser..."
npx playwright install chromium --with-deps 2>&1 | tail -3

# ── 7. Launch servers ─────────────────────────────────────────────────────────
cd "$ROOT"
echo ""
echo "🚀  Starting development servers..."
echo ""
echo "   Backend:   http://localhost:3001"
echo "   Frontend:  http://localhost:5173"
echo ""
echo "   Press Ctrl+C to stop"
echo ""
npm run dev
