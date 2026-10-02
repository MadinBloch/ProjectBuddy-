# ProjectBuddy Documentation

This folder is the canonical documentation for the project. It is designed to help both humans and LLMs understand the app quickly without digging through the full codebase.

## Index

- [Setup Guide](./SETUP.md) — full local and Docker setup instructions.
- [Project Overview](./PROJECT-OVERVIEW.md) — what the app does, why it exists, and who it is for.
- [Project Structure](./PROJECT-STRUCTURE.md) — folder layout and responsibilities.
- [LLM Context](./LLM-CONTEXT.md) — AI handoff summary, constraints, and implementation notes.
- [AI Rules](./ai/AI-RULES.md) — documentation and quality standards for future AI work.
- [Product Spec](./superpowers/specs/2026-09-30-projectbuddy-design.md) — approved design and product constraints.

## Quick rule

Keep business logic, docs, and runtime artifacts separated. Generated files, uploads, caches, and local DB data should not be treated as source code.

## Product reality

This project is intentionally grounded in real repository evidence. It does not invent modules, tables, or features. Future authentication and database expansion must follow the product plan and be documented in the repo.
