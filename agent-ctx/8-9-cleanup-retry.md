# Task ID: 8-9 — Session Auto-Cleanup API + AI Retry Logic

**Agent**: main (backend-improvements)
**Task**: Add a session auto-cleanup endpoint + fire-and-forget trigger, and add 1-retry-before-fallback logic to the AI abstraction layer.

## Reference files (read before starting)
- `/home/z/my-project/worklog.md` — prior work log (read lines 1200–1271 for Task 7 context)
- `/home/z/my-project/src/lib/session.ts` — existing session helpers (extended here)
- `/home/z/my-project/src/lib/ai.ts` — existing AI abstraction layer (extended here)
- `/home/z/my-project/src/app/api/session/route.ts` — existing session GET endpoint (modified to call cleanup)
- `/home/z/my-project/src/app/api/session/compare/route.ts` — sibling route for pattern reference
- `/home/z/my-project/prisma/schema.prisma` — Session + AuditEvent models
- `/home/z/my-project/src/lib/db.ts` — Prisma client singleton

## Plan
1. Task 8: Extract `cleanupOldSessions(maxAgeHours=24)` into `src/lib/session.ts`.
2. Task 8: Create `POST /api/session/cleanup` route at `src/app/api/session/cleanup/route.ts`.
3. Task 8: Wire fire-and-forget `cleanupOldSessions()` call into `GET /api/session?list=true`.
4. Task 9: Add `withRetry` + `isTransientError` helpers to `src/lib/ai.ts`.
5. Task 9: Restructure `chatJSON` so retry wraps only the network call, not JSON parse.
6. Task 9: Log retry attempts to `AuditEvent` (fire-and-forget).
7. Verify lint, test endpoint via curl + agent-browser, run demo flow end-to-end.

## Work Log

### Task 8 — Session Auto-Cleanup API

**`src/lib/session.ts`** — appended `cleanupOldSessions(maxAgeHours = 24)` function:
- Computes `cutoff = Date.now() - maxAgeHours * 3600 * 1000`.
- In parallel: fetches 10 most recent session IDs (any kind) + 5 most recent demo session IDs.
- Builds `preserveIds` array.
- `db.session.deleteMany({ where: { createdAt: { lt: cutoff }, id: { notIn: preserveIds } } })`.
- Returns `{ deleted, remaining, cutoff: ISO8601 }`.

**`src/app/api/session/cleanup/route.ts`** — NEW POST handler:
- Reads `?maxAgeHours=` query param (default 24).
- 400 if `maxAgeHours` is provided but not a positive integer.
- 500 with error envelope on unexpected DB failure.
- 200 with the cleanup result JSON on success.
- GET/PUT/DELETE automatically 405 (only POST exported).

**`src/app/api/session/route.ts`** — modified `GET /api/session?list=true`:
- Before the list query, fires `void cleanupOldSessions().catch(...)`.
- The list response is returned immediately; the sweep runs in the background.
- Verified in dev log: list returns in ~10–22ms, the DELETE query runs immediately afterward.

### Task 9 — AI Retry Logic

**`src/lib/ai.ts`** — extended with retry infrastructure:

- Added `import { db } from "@/lib/db"` for AuditEvent logging.
- Added constants `RETRY_DELAY_MS = 500`, `MAX_RETRIES = 1`.
- Added `isTransientError(err)` — classifies error messages by substring match:
  - Transient: `ai_timeout`, `timeout`, `timed out`, `network`, `fetch failed`, `econnreset`, `etimedout`, `enotfound`, `socket hang up`, `aborted`, `und_err_`, `retry`, and 5xx status patterns.
  - Deterministic (default): JSON parse, 4xx auth/quota, anything unknown.
- Added `withRetry<T>(fn, retries=1)` — retries once on transient errors, logs an `AuditEvent` (fire-and-forget) before each retry, waits `RETRY_DELAY_MS` between attempts.
- Restructured `chatJSON` into two phases:
  - Phase 1 (retryable): `ZAI.create()` + `withTimeout(zai.chat.completions.create(...))` wrapped in `withRetry()`.
  - Phase 2 (deterministic): `extractJSON()` + `JSON.parse()` in separate try/catch, no retry.
- All five public AI functions (`extractResume`, `extractJob`, `generateQuestion`, `evaluateAnswer`, `polishRoadmapReason`) automatically benefit since they all go through `chatJSON`.

## Verification Results

### Lint
- `bun run lint` → 0 errors, 0 warnings ✓

### Cleanup endpoint (curl + agent-browser eval)
| Request | Status | Response |
|---|---|---|
| `POST /api/session/cleanup` | 200 | `{"deleted":0,"remaining":3,"cutoff":"2026-08-12T17:50:01.034Z"}` |
| `POST /api/session/cleanup?maxAgeHours=1` | 200 | `{"deleted":0,"remaining":3,"cutoff":"2026-08-13T16:50:04.837Z"}` |
| `POST /api/session/cleanup?maxAgeHours=48` | 200 | `{"deleted":0,"remaining":3,"cutoff":"2026-08-11T17:50:34.682Z"}` |
| `POST /api/session/cleanup?maxAgeHours=invalid` | 400 | `{"error":"maxAgeHours must be a positive integer."}` |
| `POST /api/session/cleanup?maxAgeHours=0` | 400 | `{"error":"maxAgeHours must be a positive integer."}` |
| `GET /api/session/cleanup` | 405 | Method Not Allowed (default Next.js) |

### Fire-and-forget cleanup trigger
After `GET /api/session?list=true 200 in 22ms`, the dev log shows the four cleanup queries run afterward (not blocking):
1. `SELECT id FROM Session ORDER BY createdAt DESC LIMIT 10`
2. `SELECT id FROM Session WHERE isDemo = true ORDER BY createdAt DESC LIMIT 5`
3. `DELETE FROM Session WHERE (createdAt < ? AND id NOT IN (?,?,?,?,?,?))`
4. `SELECT COUNT(*) FROM Session`

### AI retry actually triggered on a real timeout
Dev log captured during the demo flow test:
```
[HIREMIND] AI transient error, retrying (1 left): AI_TIMEOUT
prisma:query INSERT INTO `main`.`AuditEvent` (...) VALUES (?,?,?,?,?,?) RETURNING ...
 POST /api/analyze 200 in 43s
```
- First AI attempt timed out at 25s.
- `withRetry` caught the `AI_TIMEOUT`, classified it as transient, wrote an `AuditEvent` row, waited 500ms.
- Second attempt succeeded (~17s).
- Total: 43s end-to-end. No fallback triggered.

### Demo flow walkthrough (agent-browser)
1. `agent-browser open "http://localhost:3000"` → home page rendered ✓
2. Clicked "Load demo candidate" → resume + job fields populated, "Analyzing…" button ✓
3. Waited 35s → view switched to candidate overview ("Here's what we found.") ✓
4. All nav buttons (Candidate, Job Match, Skill Gaps, Interview, Readiness, Roadmap, Compare) enabled → full pipeline ran ✓
5. No errors in dev log ✓

## Stage Summary

- **Task 8 done**: Session table self-cleans on every home page load without blocking the user. Demo seed data + 10 most recent real analyses are always preserved. Dedicated `POST /api/session/cleanup?maxAgeHours=24` endpoint exposes the same logic for ops/cron/manual use.
- **Task 9 done**: AI calls retry once on transient errors (timeout, network, 5xx) before falling back to deterministic logic. JSON parse errors correctly skip retry. Real-world test confirmed: a genuine `AI_TIMEOUT` was retried successfully — the user got their full AI-powered analysis instead of a fallback parse. Each retry attempt is logged to the `AuditEvent` trail.
- **Zero breaking changes** to existing API contracts — both the list endpoint response shape and the AI function signatures are unchanged.
- Lint clean, dev server stable, no runtime errors.
