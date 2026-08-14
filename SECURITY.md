# Security Policy & Vulnerability Disclosure

HireMind AI treats security, candidate privacy, and data integrity as foundational requirements.

---

## 🔒 Supported Versions

| Version | Supported |
|---|---|
| `v0.4.x` | ✅ Active Security Updates |
| `< v0.4.0` | ❌ End of Life / Unsupported |

---

## 🛡️ Security Architecture & Threat Model

### 1. Cryptographic Authentication & Session Tokens
- **Password Hashing:** PBKDF2 with SHA-512, 100,000 iterations, and a cryptographically secure 16-byte random salt generated via `crypto.randomBytes(16)` (`src/lib/auth.ts`).
- **Token Signing:** URL-safe HMAC-SHA256 signed tokens stored exclusively in `HttpOnly`, `SameSite=Lax`, and `Secure` (production) cookies (`hm_auth_token`).
- **Timing Safe Comparisons:** Constant-time verification using `crypto.timingSafeEqual` prevents side-channel timing attacks on signatures and password hashes.

### 2. Multi-Tenant Session Isolation & Server-Side Authorization
- **Owner Enforcement:** Authenticated sessions are strictly tied to the owner's `userId`. Any unauthorized attempt to read or mutate another user's session is rejected with **403 Forbidden** directly at the database layer.
- **Role-Based Access Control (RBAC):**
  - `user`: Standard role. Can create assessments, execute adaptive interviews, and view personal historical reports.
  - `admin`: Administrative role. Can update system scoring weights, modify brand configurations, and access system health diagnostics.
- **Guest Privacy:** Guest session listings (`GET /api/session?list=true`) are strictly scoped to demo sessions, preventing exposure of anonymous candidate submissions to third parties.

### 3. File Upload & Input Boundaries
- **Strict Size Limits:** 10MB maximum file size enforced for document uploads (`src/app/api/extract-text/route.ts`).
- **Extension Allowlisting:** Only `.pdf`, `.docx`, `.doc`, and `.txt` MIME/extension formats are parsed. Executables and unsupported formats are rejected with **400 Bad Request**.
- **String Sanitization:** All incoming text is sanitized to strip non-printable ASCII control characters. Strict length caps apply:
  - Resume Text: 20,000 characters
  - Job Description: 20,000 characters
  - Interview Answers: 10,000 characters

### 4. Rate Limiting & DoS Protection
- **Sliding-Window Limiter:** In-memory sliding-window rate limiting per IP protects expensive compute endpoints:
  - `/api/analyze`: 30 req/min
  - `/api/interview/answer`: 40 req/min
  - `/api/extract-text`: 20 req/min

---

## 🚨 Reporting a Vulnerability

**DO NOT report security vulnerabilities publicly in GitHub Issues or discussions.**

If you discover a potential vulnerability:
1. Please report it privately via GitHub Security Advisories, or contact the project security maintainers directly.
2. Provide a detailed summary, including:
   - Vulnerability type and affected endpoint/component
   - Step-by-step reproduction instructions or proof-of-concept payload
   - Estimated impact and severity assessment
3. You will receive an acknowledgment within 48 hours.
4. Maintainers will coordinate a fix, verify the mitigation across our test suites, and publish a security patch release.
