# ProjectBuddy v1 Design

Date: 2026-09-30
Status: approved for implementation

## Problem

Indian BCA, MCA, BTech, and Diploma students must submit a project report, diagrams, PPT, and viva Q&A. Generic chat tools invent modules that are not in the code. ProjectBuddy reads the actual project files and builds a college-ready pack.

## Product

Name: ProjectBuddy
Language: English only
Primary input: project zip
Secondary input: public GitHub URL
Download flow: generate evidence-based project pack and allow direct download after the repository is scanned and the pack is ready.

## v1 user flow

1. Landing — upload a ZIP or paste a public GitHub URL; optionally sign in with GitHub for repo selection.
2. Scan — detect stack, tables, routes, modules. Stop if the project has almost no code.
3. Questions — student name, enrollment, college, course, title, problem, future work, guide name. Confirm detected modules.
4. Generate — 2-4 minutes. Preview generated sections in the browser.
5. Download — save the project pack or individual files once the pack is ready.

## Download pack

- 01-project-report.docx and .pdf/.html
- 02-srs.md
- 03-diagrams (use case, ER, DFD 0/1, architecture, sequence, activity, deployment if found)
- 04-viva-qa.md
- 05-demo-script.md
- 06-presentation.pptx
- 07-learning-reflection.md
- 08-suggestions.md
- README.txt

Diagrams are produced only from detected tables, models, and routes. Missing facts are marked for the student to confirm.

## Runtime stack (this environment)

Laravel is the long-term fit for the founder, but this workspace has Node and no PHP/MySQL/Redis.

v1 implementation:

- Frontend: Vite + React
- Backend: Node.js Express
- Store: JSON files on disk
- Jobs: in-process async (same machine)
- Optional AI: USER_LLM_API_KEY + USER_LLM_BASE_URL (never platform keys)
- Fallback: deterministic generator grounded in the scan
- No payment or unlock wall is included in v1; downloads are available after a valid project pack is generated

## Non-goals for v1

Private GitHub OAuth, college template upload, Hindi copy, monthly plans, writing the student's application code.
