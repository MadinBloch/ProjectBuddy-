# Project Structure

This document explains how the repository is organized and what each major area is responsible for.

## Root structure

```text
ProjectBuddy/
├── backend/                  # Express API and project intelligence logic
├── docs/                     # product docs, architecture notes, AI context
├── frontend/                 # Vite + React app
├── .gitignore                # ignore rules for generated files and secrets
├── README.md                 # main project overview for humans
├── start.sh                  # local startup script for backend + frontend
└── ...
```

## Backend

```text
backend/
├── prisma/                   # Prisma schema and migrations setup
├── src/                      # application source code
│   ├── db/                   # database configuration and DB client
│   ├── modules/              # module entrypoints for the core backend services
│   │   ├── content/
│   │   │   └── index.js      # content/report generation entrypoint
│   │   ├── diagrams/
│   │   │   └── index.js      # diagram generation entrypoint
│   │   ├── generation/
│   │   │   └── index.js      # pack generation entrypoint
│   │   ├── intelligence/
│   │   │   └── index.js      # intelligence entrypoint
│   │   ├── scan/
│   │   │   └── index.js      # repository scan and zip extraction entrypoint
│   │   └── validation/
│   │       └── index.js      # verification and sanitization entrypoint
│   ├── routes/               # HTTP route registration and endpoint groups
│   │   ├── auth/
│   │   │   └── authRoutes.js # GitHub OAuth and session endpoints
│   │   ├── health.js         # health/status routes
│   │   └── projects/
│   │       └── projectRoutes.js
│   ├── services/             # reusable app services
│   │   ├── authService.js
│   │   └── projectStore.js
│   ├── ai.js                 # optional AI connector
│   ├── content.js            # report and content generation
│   ├── diagrams.js           # diagram generation logic
│   ├── generate.js           # main generation pipeline
│   ├── index.js              # Express server entrypoint and app wiring
│   ├── intelligence.js       # evidence extraction and stack detection
│   ├── scan.js               # unzip / GitHub fetch / repo scan flow
│   ├── util.js               # shared utilities
│   └── validator.js          # validation logic
├── test/                     # project pipeline tests
├── package.json
├── .env.example             # environment template if needed
└── ...
```

## Frontend

```text
frontend/
├── src/                      # React app source
│   ├── App.jsx               # app shell and main flow
│   ├── Landing.jsx           # public landing page wrapper
│   ├── components/           # reusable UI sections and widgets
│   │   ├── landing/
│   │   │   └── LandingTemplate.jsx
│   │   ├── DashboardSidebar.jsx
│   │   ├── ProjectSummaryCards.jsx
│   │   ├── RepoSelectorPanel.jsx
│   │   ├── RecentScansList.jsx
│   │   └── ProfileSection.jsx
│   ├── main.jsx              # app bootstrap
│   ├── styles.css            # styling and design system
│   └── ...
├── index.html
├── package.json
├── vite.config.js
└── ...
```

## Docs

```text
docs/
├── README.md                 # documentation index
├── PROJECT-OVERVIEW.md       # purpose, problem, audience, positioning
├── PROJECT-STRUCTURE.md     # repo layout and responsibilities
├── LLM-CONTEXT.md            # AI handoff / project understanding summary
├── superpowers/
│   └── specs/
│       └── 2026-09-30-projectbuddy-design.md
└── ...
```

## Rules for the repo

- Keep runtime-generated files out of source control.
- Keep business logic in `backend/src` and not directly inside HTTP handlers.
- Keep documentation in `docs/` so LLMs and developers can understand the project quickly.
- Keep `frontend` and `backend` independent where possible.
- Treat `data/`, generated packs, zip uploads, and local DB files as runtime artifacts.
