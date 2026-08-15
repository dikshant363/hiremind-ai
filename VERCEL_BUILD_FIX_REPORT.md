# HireMind AI — Vercel Production Build Fix Report

---

## 1. Root Cause Analysis

### The Failure Symptom
During Vercel production deployment build, Next.js compilation succeeded, but Vercel's `onBuildComplete` step failed with:
```text
Error: ENOENT: no such file or directory, open '/vercel/path0/.next/next-server.js.nft.json'
```

### The Underlying Technical Reason
1. **Unwanted Standalone Mode on Vercel:** `next.config.ts` had unconditional `output: "standalone"`. In Next.js 16, standalone mode redirects Node tracing output to `.next/standalone/server.js.nft.json` instead of generating the root `.next/next-server.js.nft.json` file that Vercel's native serverless adapter looks for during packaging.
2. **Manual Standalone Asset Copying in Build Script:** `package.json` had `"build": "next build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/"`. Manual filesystem manipulation of `.next` inside Vercel's serverless build environment interfered with Vercel's packaging lifecycle.

---

## 2. Files Inspected

- [`package.json`](package.json) — Build scripts, package lifecycle hooks, dependencies.
- [`next.config.ts`](next.config.ts) — Output configuration, compiler settings.
- [`.github/workflows/ci.yml`](.github/workflows/ci.yml) — Continuous integration build & test runner.
- [`DEPLOYMENT.md`](DEPLOYMENT.md) — Vercel and Neon deployment guides.
- [`src/lib/db.ts`](src/lib/db.ts) — Multi-environment database connection resolver.

---

## 3. Files Changed

1. **[`next.config.ts`](next.config.ts):** Made `output: "standalone"` conditional on `process.env.BUILD_STANDALONE === "true"` so Vercel defaults to standard native serverless output.
2. **[`package.json`](package.json):**
   - Restored standard `"build": "next build"`.
   - Added `"postinstall": "prisma generate"` to ensure Prisma Client is automatically generated on Vercel install before the build phase.
   - Preserved self-hosted Docker standalone support in dedicated isolated scripts (`build:standalone` and `start:standalone`).
3. **[`.github/workflows/ci.yml`](.github/workflows/ci.yml):** Updated CI server test runner to launch using `npx next start -p 3000 &`.

---

## 4. Old Build Command vs. New Build Command

### Old Configuration (Broken on Vercel)
- `package.json` build script:
  ```json
  "build": "next build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/"
  ```
- `next.config.ts`:
  ```ts
  output: "standalone"
  ```

### New Configuration (Vercel-Safe & Standard)
- `package.json` build script:
  ```json
  "build": "next build"
  ```
- `package.json` postinstall script:
  ```json
  "postinstall": "prisma generate"
  ```
- `next.config.ts`:
  ```ts
  output: process.env.BUILD_STANDALONE === "true" ? "standalone" : undefined
  ```

---

## 5. Next.js Configuration Change

```diff
 const nextConfig: NextConfig = {
-  output: "standalone",
+  output: process.env.BUILD_STANDALONE === "true" ? "standalone" : undefined,
   reactStrictMode: true,
 };
```

---

## 6. Vercel Configuration Change

- No custom `vercel.json` overrides needed.
- Vercel's zero-config Next.js framework preset detects App Router and builds standard serverless functions natively.

---

## 7. Prisma Configuration Verification

- Added `"postinstall": "prisma generate"` in `package.json`.
- When Vercel runs `npm install`, Prisma Client is automatically generated into `node_modules/@prisma/client` before `next build` executes.
- Production migrations on Neon PostgreSQL can be executed via `npx prisma db push --accept-data-loss` in Vercel build command or CI.

---

## 8. Local Build Result

- **Command:** `npm run build`
- **Output:**
  ```text
  ▲ Next.js 16.3.1 (Turbopack)
  - Environments: .env
  ✓ Running next.config.ts took 54ms
  Creating an optimized production build ...
  ✓ Compiled successfully in 773ms
  Running TypeScript ...
  Finished TypeScript in 1031ms ...
  Collecting page data using 9 workers ...
  Generating static pages using 9 workers (18/18) in 141ms
  Finalizing page optimization ...
  ```
- **NFT Tracing Files Verified:**
  - `.next/next-server.js.nft.json` (PRESENT)
  - `.next/next-minimal-server.js.nft.json` (PRESENT)

---

## 9. Vercel Build Compatibility Result

- `next-server.js.nft.json` is generated directly at the root of `.next/`.
- Vercel's `onBuildComplete` step will now locate and trace the serverless bundle without `ENOENT` errors.

---

## 10. Production Runtime Result

- **Command:** `npm start` (`next start -p 3000`)
- **Root Page (`GET /`):** HTTP 200 OK
- **Candidate Analysis (`POST /api/analyze`):** HTTP 200 OK (4ms)
- **Mock Interview (`POST /api/interview/start`):** HTTP 200 OK (2ms)
- **Answer Evaluation & Adaptive Pivot (`POST /api/interview/answer`):** HTTP 200 OK (3ms)
- **Readiness Calculation (`POST /api/readiness`):** HTTP 200 OK (2ms)

---

## 11. API Health Result

- **Endpoint:** `GET /api/health`
- **Response:**
  ```json
  {
    "status": "healthy",
    "version": "0.4.0",
    "checks": {
      "database": { "status": "healthy", "latencyMs": 0, "message": "Connected" },
      "aiProvider": {
        "status": "healthy",
        "latencyMs": 0,
        "provider": "deterministic-fallback",
        "message": "Deterministic intelligence engine active (resilient offline fallback)."
      },
      "textExtractor": {
        "status": "healthy",
        "supportedFormats": ["pdf", "docx", "doc", "txt", "md"],
        "maxFileSizeMb": 10
      }
    }
  }
  ```

---

## 12. Remaining Warnings

- Non-blocking upstream npm deprecation notices (`intersection-observer@0.10.0`, `recharts@2.15.4`) are noted for future maintenance and do not affect build or runtime execution.

---

## 13. Deployment Instructions for Vercel

1. In your Vercel Project Dashboard:
   - **Framework Preset:** `Next.js`
   - **Build Command:** Leave default (`npm run build`) or `npx prisma db push --accept-data-loss && next build`
   - **Output Directory:** Leave default (`.next`)
   - **Install Command:** Leave default (`npm install`)
2. **Environment Variables:**
   - `DATABASE_URL`: `postgresql://[user]:[password]@[endpoint].neon.tech/neondb?sslmode=require`
   - `AUTH_SECRET`: Generate with `openssl rand -hex 32`
   - `AI_PROVIDER`: `gemini`
   - `GEMINI_API_KEY`: *(Optional, for live Google Gemini LLM generation)*
   - `NODE_ENV`: `production`
3. Click **Redeploy** on Vercel.
