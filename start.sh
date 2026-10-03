#!/bin/sh
# Install (if needed) and run both processes. If 4173 is already taken,
# Vite will automatically fall back to the next free port and the backend
# will follow the same FRONTEND_URL value.
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

export API_PORT="${API_PORT:-3001}"
export PORT="${PORT:-4173}"
export FRONTEND_URL="${FRONTEND_URL:-http://localhost:${PORT}}"

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
