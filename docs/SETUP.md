# ProjectBuddy setup guide

This project runs with a Node.js backend, a Vite React frontend, and a PostgreSQL database.

## 1. Prerequisites

- Node.js 20+
- npm
- PostgreSQL 16+ or Docker Desktop
- Git

## 2. Clone and install

```bash
git clone <repo-url>
cd ProjectBuddy
npm install --prefix backend
npm install --prefix frontend
```

## 3. Configure environment variables

Create a backend environment file from the template:

```bash
cp backend/.env.example backend/.env
```

Or use the repo root example:

```bash
cp .env.example .env
```

Example values:

```env
SESSION_SECRET=projectbuddy-dev-secret
FRONTEND_URL=http://localhost:5173
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:3001/api/auth/github/callback
API_PORT=3001
DATABASE_URL=postgresql://projectbuddy:projectbuddy@localhost:5432/projectbuddy?schema=public
```

If you are using Docker Compose, the backend inside the container should use:

```env
DATABASE_URL=postgresql://projectbuddy:projectbuddy@postgres:5432/projectbuddy?schema=public
```

## 4. Start PostgreSQL

### Option A: local PostgreSQL

Create a database named `projectbuddy` and a user named `projectbuddy` with password `projectbuddy`.

```sql
CREATE DATABASE projectbuddy;
CREATE USER projectbuddy WITH PASSWORD 'projectbuddy';
GRANT ALL PRIVILEGES ON DATABASE projectbuddy TO projectbuddy;
```

### Option B: Docker Compose

From the project root:

```bash
docker compose up --build
```

This starts:
- PostgreSQL on port 5432
- backend on port 3001
- frontend on port 5173

## 5. Run the app

### Backend

```bash
cd backend
npx prisma generate
npx prisma db push
node src/index.js
```

### Frontend

```bash
cd frontend
npm run dev
```

## 6. Access the app

- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Health check: http://localhost:3001/api/health

## 7. Notes

- Keep `.env` local and do not commit secrets.
- Do not include `node_modules` or generated uploads in source control.
- Use real GitHub OAuth credentials for repository login flows.

## 8. Troubleshooting

### Prisma connection issues

Check that PostgreSQL is running and the `DATABASE_URL` matches the actual host and port.

```bash
psql "postgresql://projectbuddy:projectbuddy@localhost:5432/projectbuddy?schema=public"
```

### Port already in use

Stop old Node.js processes and rerun the app.

```bash
taskkill /F /IM node.exe
```
