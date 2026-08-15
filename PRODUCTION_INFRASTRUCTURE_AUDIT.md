# HIREMIND AI — Production Infrastructure & Database Audit

**Author:** Lead Production & Infrastructure Engineer  
**Date:** March 2026  
**Status:** Audit Complete — Remediation In Progress  
**Production URL:** [https://hiremind-ai-five-psi.vercel.app](https://hiremind-ai-five-psi.vercel.app)

---

## 1. Executive Summary & Root Cause Analysis

HireMind AI is deployed on Vercel as a Next.js 16 serverless web application. While the client-side bundle and static frontend routes load successfully, backend API requests (`/api/analyze`, `/api/session`, `/api/config`, `/api/health`) fail in production with:

```text
prisma:error
Invalid `prisma.systemConfig.findUnique()` invocation:
Error querying the database:
Error code 14: Unable to open the database file
```

### Root Cause 1: SQLite on Ephemeral/Read-Only Serverless Lambda Filesystem
- In `prisma/schema.prisma`, `provider = "sqlite"` was configured as the default datasource.
- In `src/lib/db.ts`, missing or unset `DATABASE_URL` resolved to `file:./db/custom.db` with local filesystem directory traversal.
- Vercel Serverless Functions execute in an immutable, read-only container environment without persistent local disk storage. SQLite files cannot be created, locked, or persisted across serverless invocations.

### Root Cause 2: AI Provider Configuration Mismatch
- Vercel runtime logs reported:
  `[HIREMIND] AI resilience fallback active: Configuration file not found or invalid. Please create .z-ai-config...`
- The `z-ai-web-dev-sdk` depends on a local `.z-ai-config` file or cloud API keys. When running on Vercel without `GEMINI_API_KEY` / `GOOGLE_API_KEY`, the application falls back to the internal deterministic intelligence engine.
- The UI status and `/api/health` diagnostics must clearly and truthfully distinguish between **Live AI (Google Gemini)** and **Deterministic Engine (Offline Fallback)** without confusing operators.

---

## 2. Infrastructure Inventory & References

| Component | Current State | Production Target State |
| :--- | :--- | :--- |
| **ORM / Client** | Prisma Client 6.11.1 | Prisma Client 6.11.1 (`provider = "postgresql"`) |
| **Database Engine** | SQLite (`file:../db/custom.db`) | Managed Cloud PostgreSQL (Neon Serverless with PgBouncer Pooling) |
| **Connection Pooling** | N/A (single-file locking) | Serverless Transaction Pooling (`ep-*-pooler.neon.tech`) |
| **Direct Migration URL** | None | Direct PostgreSQL URI (`ep-*.neon.tech`) |
| **Prisma Migrations** | Local `dev.db` / `db push` | Version-controlled SQL migration (`prisma/migrations/`) executed via `prisma migrate deploy` |
| **AI Provider** | Hybrid: Gemini Direct + ZAI SDK + Deterministic Fallback | Direct Google Gemini REST API (`gemini-2.5-flash` / `gemini-1.5-flash`) + Transparent Deterministic Fallback |
| **Health Endpoint** | Hardcoded "SQLite connected" message | Dynamic `databaseProvider: "postgresql"` check with live query latency |

---

## 3. Database Schema Compatibility Analysis

Inspection of all 4 models in `prisma/schema.prisma` confirms 100% compatibility with PostgreSQL:

1. **`User` Model:**
   - `id`: `String @id @default(cuid())` — maps to `text` primary key in PostgreSQL.
   - `email`: `String @unique` — maps to unique index in PostgreSQL.
   - `passwordHash`: `String` — standard text field.
   - `role`: `String @default("user")` — text column with default.
   - `createdAt`, `updatedAt`: `DateTime` — maps to `timestamp(3)` with `CURRENT_TIMESTAMP`.
2. **`Session` Model:**
   - Universal relational foreign key `userId` with `onDelete: SetNull`.
   - String JSON payloads (`candidateProfileJson`, `jobProfileJson`, `matchJson`, `gapsJson`, `interviewJson`, `readinessJson`, `roadmapJson`) map to PostgreSQL `text`.
   - `isDemo`: `Boolean @default(false)` — native boolean.
3. **`SystemConfig` Model:**
   - Singleton ID `"singleton"`, JSON configuration columns, text brand metadata.
4. **`AuditEvent` Model:**
   - Log entries with `cuid()` ID, indexed timestamp, category, level, message.

No schema modifications or model deletions are necessary; switching `provider = "postgresql"` and `url = env("DATABASE_URL")` with `directUrl = env("DIRECT_URL")` provides seamless persistence.

---

## 4. Serverless Safety Audit

- **Filesystem Writes:** Audited all `/api` routes (`/api/analyze`, `/api/extract-text`, `/api/session`, `/api/config`, `/api/interview/*`, `/api/readiness`). Verified that `extract-text` operates purely in memory using `Buffer.from(await file.arrayBuffer())`. No temporary disk files are created.
- **Connection Leaks:** `src/lib/db.ts` reuses the global Prisma singleton (`globalThis.prisma`) across warm serverless invocations.
- **Fail-Fast Error Handling:** Production must throw an explicit, actionable error if `DATABASE_URL` is missing or is a `file:` URL, rather than attempting to open an unwriteable local SQLite database.

---

## 5. Required Environment Variables

```env
# 1. Managed Cloud PostgreSQL Connection (Pooled for serverless functions)
DATABASE_URL="postgresql://neondb_owner:npg_...-pooler.neon.tech/neondb?sslmode=require"

# 2. Direct PostgreSQL Connection (For Prisma migrations)
DIRECT_URL="postgresql://neondb_owner:npg_...@ep-...neon.tech/neondb?sslmode=require"

# 3. Authentication & JWT Cryptographic Secret
AUTH_SECRET="your-64-character-random-hex-secret"

# 4. Live AI Provider Key (Google Gemini)
GEMINI_API_KEY="AIzaSy..."
# Or alternatively:
GOOGLE_API_KEY="AIzaSy..."

# 5. Environment Declaration
NODE_ENV="production"
PORT=3000
```

---

## 6. Migration & Deployment Plan

1. **Neon PostgreSQL Provisioning:** Dedicated project created on Neon (`twilight-mode-70941948`, region `us-east-2`).
2. **Update Prisma Schema:** Configure `provider = "postgresql"`, `url = env("DATABASE_URL")`, `directUrl = env("DIRECT_URL")`.
3. **Generate & Deploy Initial PostgreSQL Migration:** Generate `prisma/migrations/0_init/migration.sql` and run `prisma migrate deploy` against the live PostgreSQL database.
4. **Harden Database Client (`src/lib/db.ts`):** Enforce PostgreSQL in production; eliminate silent SQLite fallback.
5. **Update `/api/health`:** Accurately report database engine (`postgresql`), connection state, query latency, and AI status.
6. **Local & Cloud Verification:** Run all test suites and execute end-to-end live analysis on PostgreSQL.
