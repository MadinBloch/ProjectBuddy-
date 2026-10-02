# LLM Handoff

Use this file when giving the project to a new AI agent or model.

## Project summary

ProjectBuddy is a repository analysis tool that turns a student's project into a college-ready output pack. It reads actual source files and generates documentation grounded in evidence.

## Primary constraints

- no fake modules or invented APIs
- do not claim database or auth features unless implemented and verified
- keep output English-only
- do not fabricate functionality from missing evidence
- always update docs when changing behavior

## Where to look

- Product spec: `docs/superpowers/specs/2026-09-30-projectbuddy-design.md`
- Overview: `docs/PROJECT-OVERVIEW.md`
- Structure: `docs/PROJECT-STRUCTURE.md`
- AI rules: `docs/ai/AI-RULES.md`
- Backend: `backend/src`
- Frontend: `frontend/src`

## Expected workflow

1. Understand product scope.
2. Read the relevant implementation files.
3. Make the smallest correct change.
4. Update matching docs.
5. Verify behavior with a relevant check.

## Failure to avoid

- adding fake login UX
- stating unsupported project features
- leaving code changes undocumented
- mixing runtime/generated files with source code
