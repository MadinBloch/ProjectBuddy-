# ProjectBuddy

Turn a project zip (or public GitHub URL) into submission material: report, diagrams, slides, viva Q&A, and demo script.

English only. Grounded in the uploaded source. Missing tables, APIs, or modules are omitted, not invented.

Price in the product: Rs 249 per project.

## Documentation

The project documentation is centralized in [docs/README.md](docs/README.md).

## Local setup

Needs Node.js 18+.

```bash
# Install frontend and backend, then start both
bash start.sh
```

Frontend: http://localhost:5173  
API: http://localhost:3001

Or run them separately:

```bash
# Backend
cd backend
npm install
node src/index.js

# Frontend (another terminal)
cd frontend
npm install
npm run dev
```

Zip your project folder before upload. Do not include `node_modules` or `vendor`.

## Stack

- Frontend: Vite + React (`frontend/`)
- Backend: Node.js Express (`backend/`)
- Store: `data/store.json` (created at runtime)

Optional AI: set `USER_LLM_API_KEY`, `USER_LLM_BASE_URL`, and `USER_LLM_MODEL` in your own environment. Without keys, generation uses the deterministic evidence pipeline.

See `PROJECTBUDDY.md` for the product flow and API.
