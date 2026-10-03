# ProjectBuddy — what we built

ProjectBuddy is a small SaaS for Indian BCA, MCA, BTech and Diploma students.

A user uploads a **project zip** (or pastes a public GitHub URL). The app reads the real source files, detects the stack, then generates submission material: report, diagrams, 12-slide PPT, viva Q&A, demo script, reflection and suggestions.

It is **English only**. It is **not** a Laravel-only wrapper. PHP, Laravel, Node, React, Python, Java and similar student repos all scan.

Price in the product: **Rs 249 per project**. This preview unlocks download without a live UPI charge.

Live preview (this session): https://5173-82c73052491c28c3.monkeycode-ai.live

---

## Problem it solves

Colleges ask for a bound report, ER / use-case / DFD diagrams, a PPT, and viva answers. ChatGPT writes generic essays that do not match the student's code. Teachers catch it. ProjectBuddy grounds every page in the uploaded files and does not invent tables that are not in the project.

---

## User flow

1. **Landing** — SaaS homepage. Primary action: upload zip. GitHub is optional.
2. **Scan** — unzip or fetch GitHub, build an evidence model (stack, tables, routes, auth, health). Empty or unknown folders are rejected.
3. **Questions** — student name, enrollment, college, course, guide, year, title, problem, future work. Title/problem are prefilled from the repo when possible.
4. **Generate** — report, diagrams (SVG, omitted if no evidence), slides, categorized viva, demo, reflection, suggestions, zip. Missing modules/tables/APIs are skipped, not invented.
5. **Studio** — project health, evidence, progress, Edit/Regenerate per section. Tabs: Report, Diagrams, PPT, Viva, Demo, Files.
6. **Download** — full zip, or each file separately.

---

## What the student gets (the pack)

| File | What it is |
|---|---|
| `01-project-report.html` / `.md` / `.docx` / `.pdf` | Project report |
| `02-srs.md` | Software requirements |
| `03-diagrams/*.svg` | Use case, ER, DFD 0, DFD 1, architecture, sequence, activity, deployment |
| `04-viva-qa.md` | Viva questions from detected tables and routes |
| `05-demo-script.md` | 3-minute demo script |
| `06-presentation.html` / `.md` / `.pptx` | 12 slides |
| `07-learning-reflection.md` | Learning reflection |
| `08-suggestions.md` | Gaps (tests, README, secrets) |
| `README.txt` | How to submit |
| `projectbuddy-pack.zip` | All of the above |

---

## Tech stack (v1)

This workspace has Node, not PHP/MySQL/Redis, so v1 is:

- Frontend: Vite + React (`frontend/`, port 5173)
- Backend: Node.js Express (`backend/`, port 3001)
- Store: `data/store.json` plus folders under `data/projects/`
- Jobs: in-process (scan then generate)
- Diagrams: SVG drawn from the scan (`backend/src/diagrams.js`)
- Reverse proxy: Vite proxies `/api` to the backend
- Allowed host: `.monkeycode-ai.live`

Long-term the founder can rebuild the API in Laravel. The product does not depend on Laravel.

---

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/projects/upload` | Raw zip body, starts scan |
| POST | `/api/projects` | `{ github }` public repo URL |
| GET | `/api/projects/:id` | Status, scan, preview |
| POST | `/api/projects/:id/generate` | `{ answers }` |
| POST | `/api/projects/:id/section` | Edit one generated section |
| POST | `/api/projects/:id/regenerate` | Regenerate a section or the full pack |
| POST | `/api/projects/:id/unlock` | Mark paid (preview unlock) |
| GET | `/api/projects/:id/download` | Full zip |
| GET | `/api/projects/:id/file?path=&download=1` | One pack file |

---

## How to run

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

Or from the repo root:

```bash
bash start.sh
```

Frontend: http://localhost:5173  
API: http://localhost:3001

Zip the project folder before upload. Do not include `node_modules` or `vendor`.

---

## Source files we wrote

### Product docs

- `PROJECTBUDDY.md` — this file
- `AI-CONTEXT.md` — handoff file for another AI (what each file is, rules, recent changes)
- `docs/superpowers/specs/2026-09-30-projectbuddy-design.md` — v1 design spec

### Backend

- `backend/package.json` — Express app
- `backend/src/index.js` — HTTP API, upload, jobs, download
- `backend/src/scan.js` — unzip / GitHub fetch, then repository intelligence
- `backend/src/intelligence.js` — evidence model: stack, tables, routes, auth, health
- `backend/src/ai.js` — optional USER_LLM_* understanding; deterministic fallback
- `backend/src/content.js` — evidence-first report, viva, demo, slides
- `backend/src/validator.js` — drop generic filler and unverified technologies
- `backend/src/generate.js` — pack builder with progress steps
- `backend/src/diagrams.js` — diagrams from detected structure; omit missing facts
- `backend/src/util.js` — shared helpers

### Frontend

- `frontend/package.json` — Vite + React
- `frontend/vite.config.js` — port 5173, `/api` proxy, allowedHosts
- `frontend/index.html` — HTML shell
- `frontend/src/main.jsx` — React mount
- `frontend/src/Landing.jsx` — marketing landing (hero, upload, outputs, diagrams, pricing, FAQ)
- `frontend/src/App.jsx` — theme, nav, zip/GitHub handlers, scan, questions, pack studio
- `frontend/src/styles.css` — light/dark premium SaaS theme

### Scripts

- `start.sh` — install if needed, start API + Vite

### Runtime data (generated, not source)

- `data/store.json` — project records
- `data/projects/` — uploads, scans, generated packs
- `data/tmp/` — sample zip used for testing
- `frontend/node_modules/`, `backend/node_modules/` — dependencies

---

## v1 does not include

Private GitHub OAuth, college template upload, Hindi copy, monthly plans, live Razorpay, writing the student's application code, or a guarantee of “no plagiarism.”

---

## Why this can make money

Students already pay for reports. The product is cheap (Rs 249), tied to a real repo, and matches YouTube / LinkedIn teaching (Laravel, Docker, student workshops). Grow by posting “zip in, pack out” demos, then charge.

Next product steps if you continue: live Razorpay, college template upload, and a Laravel API if you want to own the backend in PHP.
