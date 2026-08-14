# Comprehensive Testing Guide

HireMind AI includes an extensive, multi-layered automated testing architecture covering static types, code quality, cryptographic authentication, runtime candidate intelligence, multi-candidate differentiation, mathematical scoring invariants, and red-team security verification.

---

## 🧪 Test Execution Matrix

| Test Suite | File Path | Focus Area | Command |
|---|---|---|---|
| **Static Types** | Entire codebase | Strict TypeScript validation | `npx tsc --noEmit` |
| **Lint Standards** | Entire codebase | ESLint Next.js standards | `npm run lint` |
| **Auth & Config QA** | `tests/auth-and-config-qa.mjs` | PBKDF2 hashing, HMAC tokens, RBAC | `node tests/auth-and-config-qa.mjs` |
| **Runtime Intelligence QA** | `tests/runtime-qa.mjs` | Ingestion, 4-axis match, interview, DB persistence | `node tests/runtime-qa.mjs` |
| **Multi-Candidate QA** | `tests/multi-candidate-qa.mjs` | Input differentiation across distinct profiles | `node tests/multi-candidate-qa.mjs` |
| **All Parameters QA** | `tests/all-parameters-qa.mjs` | Mathematical formula bounds & invariants | `node tests/all-parameters-qa.mjs` |
| **10-Run Consecutive Demo QA** | `tests/ten-run-demo-qa.mjs` | Zero-regression stability across 10 full runs | `node tests/ten-run-demo-qa.mjs` |
| **Independent Red-Team Harness** | `scratch/redteam-test.mjs` | Rate limiting, session isolation, file security | `node scratch/redteam-test.mjs` |

---

## 🔍 Detailed Suite Descriptions

### 1. Auth & Configuration QA (`tests/auth-and-config-qa.mjs`)
Verifies cryptographic user registration, PBKDF2 password hashing (100,000 rounds), signed HMAC-SHA256 session token generation, cookie validation, role elevation (first user auto-promoted to admin), and dynamic system configuration updates.

### 2. Runtime Intelligence QA (`tests/runtime-qa.mjs`)
Simulates complete real-user workflows from resume text extraction and candidate intelligence normalization to 4-axis match calculation, adaptive mock interview turn execution, readiness scoring, and database roundtrip recovery.

### 3. Multi-Candidate QA (`tests/multi-candidate-qa.mjs`)
Submits three vastly different candidate resumes (Backend/Distributed, Frontend/UI, DevOps/Cloud) against identical target jobs. Verifies that extracted skills, match scores, identified gaps, and roadmap steps are uniquely differentiated without overlap.

### 4. Mathematical Formula QA (`tests/all-parameters-qa.mjs`)
Validates that match indices, evaluation dimension weights, and 5-axis readiness formulas adhere strictly to mathematical boundaries ($0 \le \text{Score} \le 100$) and return deterministic outputs for identical inputs.

### 5. 10-Run Consecutive Demo QA (`tests/ten-run-demo-qa.mjs`)
Executes 10 consecutive end-to-end sessions in rapid sequence, logging execution latency, memory footprint, and verifying 100% pass rates across all runs.

### 6. Independent Red-Team Harness (`scratch/redteam-test.mjs`)
Performs active security and boundary tests against the live HTTP server:
- Session isolation verification (unauthorized cross-user reads return **403 Forbidden**)
- Boundary checks for malformed, empty, and oversized (>10MB) file uploads
- Rate limiter activation verification (**429 Too Many Requests** under burst load)
