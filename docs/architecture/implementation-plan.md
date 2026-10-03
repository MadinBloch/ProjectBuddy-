# Implementation Plan

## Phase 1 — clean foundations

- keep docs in `docs/`
- keep backend code separate from runtime-generated data
- keep the app evidence-driven and honest
- maintain a clear service layer for scanning and generation

## Phase 2 — persistence

- add a database layer for user and project records
- SQLite is the local default via `DATABASE_URL=file:./data/projectbuddy.db`
- Prisma can still target PostgreSQL later by changing the schema provider and URL

## Phase 3 — auth

- GitHub login and repo selection are implemented
- signed-in users own their scan/pack records
- Google login is still not implemented
- use the backend session and SQLite-backed user model for authenticated sessions

## Phase 4 — production hardening

- environment config
- secure sessions and secret handling
- deployment settings
- production DB migration planning

## Product guardrails

- do not invent missing project modules or behaviors
- do not add mock auth or fake product features
- document all large changes in `docs/`
- keep the product aligned with the design spec
