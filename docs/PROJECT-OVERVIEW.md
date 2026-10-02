# Project Overview

## What this project is

ProjectBuddy is a project-pack generator for students. It scans a student project repository, finds the actual stack, routes, files, database tables, and application structure, and then generates a college-ready output pack such as:

- project report
- viva Q&A
- demo script
- presentation support
- diagrams
- suggestions and reflection notes

## Why this project was created

Many students struggle with creating submission-quality project documentation from real code. Generic AI tools often invent details or claim technologies that are not present in the source. This project is built to be evidence-based:

- it reads the actual repository
- it detects the real stack and modules
- it cites evidence from the files it scanned
- it avoids inventing modules, tables, APIs, or features

## Who this is for

This product is designed for:

- Indian college students
- BCA / MCA / BTech / Diploma final-year students
- project submissions and viva preparation
- students who need report-ready material based on their own codebase

## Product positioning

The product is meant to turn a project zip or public GitHub URL into submission material that is grounded in source code instead of generic AI output.

## Core product principles

- English-only output
- grounded in repository evidence
- no invented features or fake modules
- keep answer quality useful for college submission
- keep processing transparent and explainable

## Current v1 focus

The current version focuses on:

- upload or GitHub input
- repository scan
- stack and evidence detection
- generated report and output pack
- preview and download flow
- authenticated user flow with GitHub login
- authenticated GitHub repository selection from the signed-in account
- local JSON project storage for runtime metadata and generated artifacts

The app now supports a real GitHub OAuth login flow and a repo picker that lists repositories from the signed-in account, with the rest of the project continuing to stay grounded in source evidence.

## UX and landing page polish

The landing experience has been refined for a more premium developer-product feel while staying grounded in the actual product flow. This includes:

- higher-contrast dark UI with stronger visual hierarchy
- clearer primary actions for upload and GitHub login
- motion-enhanced hero and glass-panel details without relying on fake product claims
- accessible focus states and reduced-motion support for keyboard and motion-sensitive users
