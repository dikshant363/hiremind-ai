# Changelog

All notable changes to **HireMind AI** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- GitHub Community health templates (`.github/ISSUE_TEMPLATE/` and `pull_request_template.md`).
- GitHub Actions CI pipeline for automated typecheck, linting, testing, and production builds (`.github/workflows/ci.yml`).
- Architectural Decision Records (`docs/decisions/ADR-001` through `ADR-006`).
- Direct user data deletion endpoint (`DELETE /api/session?id=...`).
- Comprehensive open-source governance documents: `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `SUPPORT.md`, `PRIVACY.md`, `ROADMAP.md`, `DEVELOPMENT.md`, and `ENVIRONMENT.md`.

---

## [0.4.0] - 2026-08-14

### Added
- Safe multi-model fallback chain for Google Gemini (`gemini-2.5-flash`, `gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-2.0-flash`).
- Safe API key validation via `getAIStatus()` and transparent `source: "live-ai" | "deterministic-fallback"` metadata reporting in `/api/analyze`, `/api/interview/answer`, and `/api/health`.
- In-memory sliding-window rate limiters (`src/lib/rate-limit.ts`) for `/api/analyze` (30/min), `/api/interview/answer` (40/min), and `/api/extract-text` (20/min).
- Dynamic code splitting with `next/dynamic` for heavy non-home views and modals.
- Comprehensive Red-Team Verification suite (`scratch/redteam-test.mjs`) verifying session isolation, boundary conditions, rate limiting, and candidate differentiation.

### Fixed
- Replaced continuous 600px blur keyframe transforms in `<GradientMesh />` with static GPU-friendly radial gradients, eliminating UI lag.
- Controlled Prisma query logging via `DEBUG_SQL` environment variable to eliminate stdout log spam.
- Fixed React duplicate key warnings in candidate experience, projects, education, and roadmap lists.
- Fixed session persistence on `/evaluation` page refreshes by falling back to historical evaluation records in database.

### Changed
- Scoped unauthenticated session listings (`GET /api/session?list=true`) to public demo sessions only for candidate privacy.

---

## [0.3.0] - 2026-08-14

### Added
- PBKDF2 password hashing (SHA-512, 100k iterations) and signed HMAC-SHA256 session tokens.
- Server-side session ownership authorization (403 Forbidden on unauthorized cross-user queries).
- Real PDF and DOCX document extraction engine via `pdf-parse` and `mammoth`.
- Dynamic Control Center modal for runtime brand and scoring weight adjustments.

---

## [0.2.0] - 2026-08-14

### Added
- Authoritative deterministic intelligence engine (`src/lib/engine.ts`).
- 4-axis match index calculation formula.
- Adaptive mock interview question generator with competency-gap tracking.
- 5-axis readiness index calculation and personalized 4-phase improvement roadmap generator.

---

## [0.1.0] - 2026-08-14

### Added
- Initial project prototype for Hackathon Problem Statement PS 02 (*Automated Smart Resume Parser & Mock Interviewer*).
- Navigation shell, light/dark theme toggle, and presentation mode.
