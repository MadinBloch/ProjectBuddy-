# LLM Context

This file is meant to be the easiest high-signal document to hand to an LLM when working on the project.

## Project summary

ProjectBuddy is a product that turns a project zip or a public GitHub URL into a clean submission pack for students. It reads the actual repository instead of inventing project logic.

## Primary goal

Generate documentation and deliverables grounded in the source code of the uploaded project. This includes:

- report generation
- diagrams
- viva Q&A
- demo script
- suggestions and reflection notes

## Key product constraints

- English only
- grounded in evidence from files
- do not invent missing modules, APIs, or tables
- prefer explicit omission over made-up content
- project pack is for academic submission use

## Current stack

- Frontend: Vite + React
- Backend: Node.js + Express
- Data layer: local JSON store for project metadata and generated output artifacts
- Auth: GitHub OAuth with session-backed user records
- Repo listing: authenticated GitHub repo picker from the signed-in account using the `repo` OAuth scope
- Dashboard metrics: project scan counts, ready-pack totals, and recent scan history are kept in the local project store
- Mobile support: React Native, Flutter, and Android app scans are recognized when evidence is present in the repo
- Runtime model: local service and generated project artifacts
- Local env handling: backend loads `.env` at startup via `dotenv`
- Optional AI: environment-based LLM integration if keys are supplied

## Important architecture notes

- `backend/src/index.js` is the API entrypoint and app wiring layer
- HTTP route groups live under `backend/src/routes`, with auth endpoints in `backend/src/routes/auth/authRoutes.js` and project APIs in `backend/src/routes/projects/projectRoutes.js`
- module entrypoints live under `backend/src/modules`, with scan, generation, content, diagrams, validation, and intelligence access points grouped by responsibility
- scanning and evidence logic are in `backend/src/scan.js` and `backend/src/intelligence.js`
- generation logic lives in `backend/src/generate.js` and supporting content modules
- zip extraction and packaging are implemented in JavaScript with `adm-zip` so repo scans work on Windows, macOS, and Linux without relying on a system `unzip`/`zip` binary
- React frontend lives in `frontend/src` with reusable sections under `frontend/src/components`
- the public landing page is separated into `frontend/src/components/landing/LandingTemplate.jsx` and wrapped by `frontend/src/Landing.jsx`
- docs are centralized in `docs/`

## Repository conventions

- Keep the source code and generated artifacts separate
- Generated data such as uploads, temp folders, DB files, and zip outputs should not be treated as source files
- Prefer structured folders over single-file growth
- Use documentation in `docs/` as the handoff layer for AI or team onboarding

## Landing page UX notes

- The landing page should reflect the real product flow: upload a ZIP or pick a GitHub repo, then review the generated evidence
- Keep contrast strong and actions obvious for upload, GitHub auth, and repository scanning
- Prefer subtle motion and layered glass surfaces over noisy visuals
- Maintain accessible focus states and reduced-motion behavior for keyboard and motion-sensitive users
- Do not add pricing gates, demo-only mock flows, or fake product claims that do not exist in the app

## Safety rules for future AI work

- Do not add fake modules, routes, or database tables.
- Do not assume missing APIs exist.
- Do not claim auth or payment features unless implemented and verified.
- When evidence is missing, say it clearly instead of making it up.
- Keep project generation grounded and explainable.

## Best use when prompting an AI

When you give this project to an AI, describe the task and point it to the relevant folder:

- backend logic: `backend/src`
- frontend logic: `frontend/src`
- design spec: `docs/superpowers/specs/2026-09-30-projectbuddy-design.md`
- project overview: `docs/PROJECT-OVERVIEW.md`
- repo structure: `docs/PROJECT-STRUCTURE.md`

This lets the AI understand the project goals, constraints, and architecture quickly and reduces wrong assumptions.
