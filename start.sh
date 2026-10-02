#!/bin/sh
# Install (if needed) and run both processes: API on 3001, Vite dev on 5173.
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

# Deterministic ports so the preview proxy always matches (5173 is declared).
export API_PORT=3001
export PORT=5173

if [ ! -d "$ROOT/frontend/node_modules" ]; then
  npm install --prefix "$ROOT/frontend" --no-audit --no-fund
fi
if [ ! -d "$ROOT/backend/node_modules" ]; then
  npm install --prefix "$ROOT/backend" --no-audit --no-fund
fi

mkdir -p "$ROOT/backend/data"
export DATABASE_URL="file:./data/projectbuddy.db"

cd "$ROOT/backend"
node src/index.js &
BACK_PID=$!

cd "$ROOT/frontend"
npm run dev

kill "$BACK_PID" 2>/dev/null || true
