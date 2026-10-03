# ProjectBuddy

Turn a project zip (or public GitHub URL) into submission material: report, diagrams, slides, viva Q&A, and demo script.

English only. Grounded in the uploaded source. Missing tables, APIs, or modules are omitted, not invented.

Price in the product: Rs 249 per project.

## Documentation

The project documentation is centralized in [docs/README.md](docs/README.md).

## Local setup

Needs Node.js 20+.

### Option 1: Docker Compose (recommended)

```bash
docker compose up --build
```

This starts PostgreSQL, the backend, and the frontend together.

- Frontend: http://localhost:4173
- API: http://localhost:3001
- PostgreSQL: http://localhost:5432

### Option 2: Local services without Docker

```bash
# Backend
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
node src/index.js

# Frontend (another terminal)
cd frontend
npm install
PORT=4173 npm run dev
```

If port 4173 is already occupied by another local app, Vite will automatically move to the next free port. In that case, update `FRONTEND_URL` in `backend/.env` to match the port Vite reports.

### Environment file

See [.env.example](.env.example) for the project environment template.

```env
SESSION_SECRET=projectbuddy-dev-secret
FRONTEND_URL=http://localhost:4173
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:3001/api/auth/github/callback
API_PORT=3001
DATABASE_URL=postgresql://projectbuddy:projectbuddy@localhost:5432/projectbuddy?schema=public
```

Zip your project folder before upload. Do not include `node_modules` or `vendor`.

## Stack

- Frontend: Vite + React (`frontend/`)
- Backend: Node.js Express (`backend/`)
- Store: `data/store.json` (created at runtime)

Optional AI: set `USER_LLM_API_KEY`, `USER_LLM_BASE_URL`, and `USER_LLM_MODEL` in your own environment. Without keys, generation uses the deterministic evidence pipeline.

See `PROJECTBUDDY.md` for the product flow and API.
