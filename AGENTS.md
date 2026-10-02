# ProjectBuddy AI Rules

This repository is for a real student project-generation product. Keep the implementation grounded in evidence and avoid fake or invented project features.

## Core rules

1. Always work from the actual repository state.
2. Do not invent routes, tables, modules, frameworks, auth flows, or business logic that are not clearly supported by the code or the product specification.
3. If evidence is missing, say so explicitly and keep the output honest.
4. Keep the product aligned with the approved v1 scope in `docs/superpowers/specs/2026-09-30-projectbuddy-design.md`.
5. Do not add fake login, fake payments, or fake social proof.

## Documentation rule

Whenever you change code, config, features, architecture, or app behavior, you must also update the matching docs in `docs/`.

Required updates:
- update the relevant overview or architecture doc when behavior changes
- update the AI context if the change affects project assumptions or constraints
- add or update a short developer note in the relevant docs section when the change affects setup or usage

## Documentation structure

Use `docs/` as the canonical place for product and implementation context:

- `docs/README.md` — documentation index
- `docs/PROJECT-OVERVIEW.md` — product purpose and value
- `docs/PROJECT-STRUCTURE.md` — repository layout
- `docs/LLM-CONTEXT.md` — AI-ready understanding
- `docs/architecture/` — architecture decisions and implementation notes
- `docs/ai/` — AI engineering rules and handoff guidance

## Implementation quality rules

- Prefer clear folder separation: backend logic, frontend logic, docs, and runtime/generated artifacts should stay separate.
- Keep runtime data and generated outputs in `data/` or other runtime folders instead of mixing them with source files.
- Keep the codebase clean, understandable, and aligned with a real product lifecycle.
- Be careful with security: no secrets or tokens in code or committed config files.

## Approved product scope

This project is not a fake SaaS landing page or a mock login product.

The real v1 direction is:
- project upload or GitHub input
- repository scan and evidence extraction
- generated report and pack
- preview flow and unlock logic
- real, verifiable product behavior grounded in code

Any future auth or database expansion should follow the documented architecture plan and also be reflected in the docs.
