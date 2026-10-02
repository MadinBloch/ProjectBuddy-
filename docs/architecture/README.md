# Architecture

This folder captures the architectural direction for ProjectBuddy.

## Current direction

- Node.js + Express backend
- React frontend for the product UI
- SQLite + Prisma as the local persistence layer
- runtime-generated files kept separate from source files
- evidence-based generation and validation for student project packs

## Main principles

- product logic must be grounded in source evidence
- generated project outputs are runtime artifacts
- docs live in `docs/` and must be kept in sync with code
- auth and user management are planned follow-up work after the core project-generation flow is stable

## Files in this folder

- [implementation-plan.md](./implementation-plan.md) — current architecture and delivery plan
