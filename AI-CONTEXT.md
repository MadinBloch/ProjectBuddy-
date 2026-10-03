# ProjectBuddy — AI handoff context

Give this file to another AI before asking it to change the product.

Last updated: 2026-10-02  
Repo: https://github.com/MadinBloch/ProjectBuddy-  
Branch: `main`  
Founder: Madin Bloch

---

## What this product is

ProjectBuddy is a **tool**, not a sample student project.

A user uploads a **ZIP** of their own repository, or pastes a **public GitHub URL**. ProjectBuddy reads the actual files and generates submission material:

- Project report
- System diagrams (SVG)
- 12-slide presentation
- Viva Q&A
- Demo script
- Project analysis / health / evidence
- Individual file downloads and a complete ZIP

Price shown in the product: **₹249 per project**.

English only. Zip-first. Public GitHub optional.

---

## Hard rules (do not break)

1. **Evidence-first.** Stack, tables, routes, modules, APIs come only from uploaded source. Missing facts are **omitted**, never invented.
2. **Never** use Library Management System as an example in the product UI or marketing copy.
3. **Never** use fake stats or banned phrases: `college pack`, `IEEE-style`, `10,000+ students`, `4.9/5`, fake testimonials.
4. Keep **Node.js + Express + Vite/React**. Do not migrate to Laravel.
5. Express v5: do **not** use `app.get("*")`.
6. Scan rejects empty/unknown folders. Tiny repos are OK if a stack is detected (`files.length < 2` is allowed).
7. Do not commit `data/`, `node_modules`, secrets, or API keys.
8. User project LLM keys must be `USER_LLM_*` placeholders. Never copy Agent environment keys into this repo.
9. Preview environment exposes **one port**. Frontend Vite (5173) proxies `/api` to backend (3001).

---

## Brand copy (landing)

- Label: `FROM CODE TO SUBMISSION` (top utility bar)
- Headline: `Ship the submission, not the busywork.`
- Primary CTA: `Upload project ZIP`
- Secondary CTA: `Paste GitHub URL`
- Trust: `ZIP or public repository · Preview before you download · No setup required`
- Pricing CTA: `Create my project pack`
- Closing CTA: `Your code is done. Finish the submission.`

Design system: warm-paper neutrals with a deep-teal brand (`#0f766e`) and terracotta accent
(`#c2410c`). Display headings use the Newsreader serif, UI uses Inter, and eyebrows/evidence use
JetBrains Mono. Avoid generic indigo/violet gradients and default purple SaaS styling.

If an example is shown, label it **Example project**. Keep examples generic (detected repository, not Student/Hospital/Library/E-commerce as the product identity).

---

## How to run

```bash
bash start.sh
```

Or separately:

```bash
# Backend — port 3001
cd backend
npm install
node src/index.js

# Frontend — port 5173
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173  
API: http://localhost:3001  
Vite proxies `/api` to `http://127.0.0.1:3001`.

Tests:

```bash
cd backend
node --test test/pipeline.test.js
```

Five fixtures must pass: Laravel, Express+Mongo, Django, Flask, Spring Boot.

---

## Architecture

```
ZIP / public GitHub
        |
        v
  backend/src/scan.js          unzip or fetch repo
        |
        v
  intelligence.js              evidence model (stack, tables, routes, auth, health)
        |
        v
  ai.js                        optional USER_LLM_* understanding; else deterministic
        |
        v
  content.js                   report, viva, demo, slides from evidence
        |
        v
  validator.js                 strip filler / unverified stack claims
        |
        v
  diagrams.js + generate.js    SVG diagrams (omit missing) + pack ZIP
        |
        v
  frontend studio              preview, edit, regenerate, per-file / full ZIP download
```

Runtime data (generated, gitignored):

- `data/store.json`
- `data/projects/`
- `data/tmp/`

---

## File map

### Product docs

| File | What it is |
|---|---|
| `AI-CONTEXT.md` | This handoff file for another AI |
| `PROJECTBUDDY.md` | Product overview, API, flow, pack contents |
| `README.md` | Short setup |
| `docs/superpowers/specs/2026-09-30-projectbuddy-design.md` | Product design spec |

### Frontend (`frontend/`)

| File | What it is |
|---|---|
| `package.json` | Vite + React scripts |
| `vite.config.js` | Port 5173, `/api` proxy, `allowedHosts: ['.monkeycode-ai.live']` |
| `index.html` | HTML shell + page title |
| `src/main.jsx` | React mount |
| `src/Landing.jsx` | Marketing landing (hero + app-window mock, stack marquee, upload, steps, pack cards, diagram workspace, deck, live preview, compare, pricing, FAQ, CTA band, footer) |
| `src/App.jsx` | Theme, topbar, nav, zip/GitHub handlers, scan, questions, studio |
| `src/styles.css` | Design system: warm-paper + deep-teal, serif/Inter/mono, light + dark |

### Backend (`backend/`)

| File | What it is |
|---|---|
| `package.json` | Express app |
| `src/index.js` | HTTP API, jobs, download |
| `src/scan.js` | Unzip / GitHub fetch + intelligence |
| `src/intelligence.js` | Evidence model |
| `src/ai.js` | Optional LLM understanding |
| `src/content.js` | Grounded report / viva / demo / slides |
| `src/validator.js` | Strip filler and unverified tech |
| `src/generate.js` | Pack + progress |
| `src/diagrams.js` | Evidence diagrams; omit missing |
| `src/util.js` | Shared helpers |
| `test/pipeline.test.js` | 5-stack fixture tests |
| `test/fixtures/` | Sample repos for tests (includes a Laravel library fixture used **only** as scanner input, not as marketing) |

### Scripts

| File | What it is |
|---|---|
| `start.sh` | Install if needed, start API then Vite |
| `.gitignore` | Ignores `data/`, `node_modules`, archives, secrets |

---

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/projects/upload` | Raw zip body, starts scan |
| POST | `/api/projects` | `{ github }` public repo URL |
| GET | `/api/projects/:id` | Status, scan, preview |
| POST | `/api/projects/:id/generate` | `{ answers }` |
| POST | `/api/projects/:id/section` | Edit one section |
| POST | `/api/projects/:id/regenerate` | Regenerate a section or all |
| POST | `/api/projects/:id/unlock` | Mark paid (preview unlock) |
| GET | `/api/projects/:id/download` | Full zip |
| GET | `/api/projects/:id/file?path=&download=1` | One pack file |

---

## User flow in the UI

1. **Landing** — upload ZIP or paste GitHub URL.
2. **Scan** — detect stack / files / tables / routes. Reject empty/unknown.
3. **Questions** — student name, enrollment, college, course, guide, year, title, problem, future work.
4. **Generate** — evidence-first pack with progress.
5. **Studio** — tabs: Report, Diagrams, PPT, Viva, Demo, Files. Edit / Regenerate / download.
6. **Download** — full ZIP or individual files.

Theme toggle (light/dark) is in the navbar and persisted as `localStorage.pb-theme`.

---

## What changed (2026-10-03, report export formats)

- `backend/src/generate.js` now also renders the report to **PDF** (`pdfkit`, pure JS — no browser/system PDF tool) alongside the existing DOCX (`docx`) and PPTX (`pptxgenjs`).
- Pack gains `01-report/project-report.pdf` (+ legacy copy `01-project-report.pdf`), listed in `packFiles` and downloadable via `/api/projects/:id/file` (alias + `application/pdf` MIME added in `projectRoutes.js`).
- UI: "Download PDF" button in the studio head; Files-tab copy updated.
- Pack `README.txt` no longer tells students to export HTML to PDF by hand.
- Tests assert PDF (`%PDF-`) and DOCX (`PK`) headers for every fixture.
- Docs updated: `docs/LLM-CONTEXT.md`, `docs/SETUP.md`, `docs/ai/LLM-HANDOFF.md`, `PROJECTBUDDY.md`.

---

## What changed in this UI pass (2026-10-02, design system rewrite)

This commit is a **visual + copy rewrite of the frontend** to look like a designed product rather
than a template. Backend generation pipeline was not touched.

### Added

- `frontend/src/Landing.jsx` — full marketing page with an inline SVG icon set, a real app-window
  hero mock, a stack marquee, a CTA band, and a five-column footer
- Inline `SunIcon` / `MoonIcon` theme toggle in `App.jsx`

### Changed

- `frontend/src/styles.css` — full design-system rewrite: warm paper (`#f6f5f1`) light theme and
  near-black (`#0a0c0e`) dark theme, deep-teal brand + terracotta accent, serif display type,
  refined radii/shadows, underline tabs, and a redesigned studio
- `frontend/index.html` — new title/meta and the Inter + Newsreader + JetBrains Mono font stack
- `frontend/src/App.jsx` — top utility bar, refined nav, studio/scan/questions screens restyled
- `backend/src/index.js` + `frontend/vite.config.js` — API port is now `API_PORT` (default 3001);
  the frontend binds `PORT` (default 5173) so the two-process preview is deterministic
- `start.sh` — POSIX `sh`, idempotent installs, fixed `API_PORT=3001` / `PORT=5173`
- Removed the non-functional `Login` button (the app keeps auth honest and does not add fake UI)

### Landing sections now present

Top bar, hero + app-window mock, stack marquee, upload dropzone, 4-step flow, six output cards,
diagram workspace, deck track, live preview tabs, compare, ₹249 pricing, FAQ accordion, CTA band,
dark footer.

### Not changed

Backend scan/generate/validator/diagrams logic, API routes, fixture tests, pricing amount,
zip/GitHub generation flow.

---

## What the product does not include

Private GitHub OAuth, college template upload, Hindi copy, monthly plans, live Razorpay/UPI charge, writing the user's application code, guaranteed “no plagiarism.”

Preview unlock currently allows download without a live payment.

---

## Safe next work

Good follow-ups:

- Live Razorpay / UPI at ₹249
- Login that actually authenticates
- Stronger diagram rendering when evidence exists
- Keep marketing examples generic

Do not:

- Invent tables/routes in reports
- Put Library Management on the landing page
- Add fake social proof
- Commit tokens or `data/`

---

## Git notes

- Remote: `origin` → `https://github.com/MadinBloch/ProjectBuddy-.git`
- Do not reuse any personal access token that was pasted in chat. If push needs auth, use Git credential helper / a new token.
- Never force-push `main` unless the owner asks.
