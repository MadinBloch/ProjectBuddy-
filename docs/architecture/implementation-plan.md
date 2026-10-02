# Implementation Plan

## Phase 1 — clean foundations

- keep docs in `docs/`
- keep backend code separate from runtime-generated data
- keep the app evidence-driven and honest
- maintain a clear service layer for scanning and generation

## Phase 2 — persistence

- add a database layer for user and project records
- start with SQLite for local development
- use Prisma to keep the path open for PostgreSQL later

## Phase 3 — auth

- add GitHub login first
- add repo selection from the authenticated GitHub account
- add Google login second
- tie authenticated users to their saved projects and outputs
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
