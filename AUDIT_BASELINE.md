# HIREMIND AI — AUDIT BASELINE REPORT
**Generated**: 2026-08-14
**Git Commit**: `a539602d90436adf33238386e5731e8115717761`
**Branch**: `main`
**Node Version**: `v26.7.0` (Darwin / macOS)
**Next.js Version**: `16.1.1` (Turbopack)
**Prisma Version**: `6.11.1` (SQLite: `custom.db`)

---

## 1. Git State & Working Tree
- Clean commit base: `a539602d90436adf33238386e5731e8115717761` (Author: `Z User <z@container>`).
- Uncommitted modified files: 36 files.
- Untracked files: documentation, tests, auth API routes, config API routes, health API routes, components.

---

## 2. Static Analysis & Build Results

### TypeScript Typecheck (`npx tsc --noEmit`)
- **Result**: `0 errors`.
- **Status**: PASSED.

### Linter Check (`npm run lint` / ESLint)
- **Result**: `0 errors, 0 warnings`.
- **Status**: PASSED.

### Production Build / API Compilation
- **Status**: Clean compilation in Next.js Turbopack.

---

## 3. Runtime & Test Suite Execution Baseline

| Test Suite | File | Status | Duration | Key Validations |
| :--- | :--- | :---: | :---: | :--- |
| **System Diagnostics & Health** | `tests/auth-and-config-qa.mjs` | **PASSED** | ~3.2s | Health check (2ms), Public config, First-user Admin auto-promotion, Session auth token verification, Password verification & 401 rejection, Admin config update, 403 on non-admin update, Database stats, Auth session association, Logout. |
| **Core Workflow & Resilience** | `tests/runtime-qa.mjs` | **PASSED** | ~5.8s | `/api/analyze`, Resume parsing, Competency extraction (14 unique), `/api/interview/start`, Adaptive question progression (Microservices -> Scalability), Answer evaluation, `/api/readiness`, Session comparison, DB persistence. |
| **Multi-Candidate Differentiation** | `tests/multi-candidate-qa.mjs` | **PASSED** | ~9.5s | Candidate A (AI/ML), Candidate B (Frontend), Candidate C (DevOps). Confirms distinct match scores (43 vs 56 vs 71), distinct skill gaps, distinct interview questions, distinct roadmaps. |
| **All-Parameters QA** | `tests/all-parameters-qa.mjs` | **PASSED** | ~4.5s | Validates all scoring weight boundaries, candidate levels, importance ratings, difficulty modes (`easy`, `medium`, `hard`, `auto`). |
| **Ten-Run Benchmark Stability** | `tests/ten-run-demo-qa.mjs` | **PASSED** | ~35s | 10 consecutive full pipeline runs without error or memory degradation. |

---

## 4. Known Warnings, Bottlenecks & Audit Findings to Address

1. **AI Connectivity & Model ID**:
   - `GEMINI_API_KEY` format in `.env` is invalid for Google AI Studio (`AQ.Ab8...`).
   - Direct call in `src/lib/ai.ts` targets `gemini-pro` which returns 404 on Google AI API v1beta.
   - Deterministic fallback engine gracefully rescues all requests, but AI status is not explicitly exposed as `connected` vs `fallback` vs `unavailable`.
2. **Animation & CSS Performance Overhead**:
   - `GradientMesh` in `src/app/layout.tsx` runs 4 full-screen infinite CSS keyframe transforms with heavy radial blurs.
   - `globals.css` contains 15+ infinite keyframe loops running simultaneously.
   - Framer Motion transition durations are long (400–600ms) with nested stagger chains on every view.
3. **Monolithic Page Chunk**:
   - `src/app/page.tsx` statically imports all 9 views into a single client component bundle.
4. **Database Query Logging**:
   - `src/lib/db.ts` has `log: ['query']` hard-coded, outputting every SQL query to stdout.
5. **Duplicate React Keys**:
   - Skills repeating across categories can produce React key warnings if keyed solely by `key={skill}`.
6. **Session & Security Hardening**:
   - Anonymous session authorization needs guest browser cookie verification.
   - `lastEvaluation` state recovery on page refresh needs persistence in session state.
   - API rate limiting & file upload size/MIME verification need enforcement.
