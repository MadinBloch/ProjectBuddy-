# AI Rules for ProjectBuddy

## 1. Keep the repo honest

The app is for generating project portfolio and submission materials based on real source code. Do not invent modules, frameworks, files, tables, or features.

## 2. Always update docs when code changes

When code changes, also update docs in the relevant area:

- architecture notes if structure changes
- product overview if the project goal or audience changes
- AI context if assumptions or constraints change
- setup notes if local development or dependencies change

## 3. Prefer real product logic over fake shortcuts

Do not add mock login flows, fake dashboards, fake auth UI, or fake product features just to look complete.

## 4. Keep runtime artifacts separate

Generated uploads, temp project folders, DB files, zip outputs, and local data should not live where source code is meant to be maintained.

## 5. Maintain clean architecture

Keep the code organized into clear concerns:

- backend logic
- frontend UI
- data and database layer
- docs and product context

## 6. Follow the approved product scope

Stay aligned with the v1 design in `docs/superpowers/specs/2026-09-30-projectbuddy-design.md`.

## 7. Good AI output pattern

Before producing changes, confirm:
- what the code does now
- what the user needs to change
- what evidence the repo supports
- which documentation should be updated alongside the code

## 8. Minimal but reliable output

Prefer small, correct, maintainable changes over large feature jumps. If a feature is not required by the product spec, do not add it prematurely.

## 9. Final rule

No change is complete unless the code and the documentation are both updated to match reality.
