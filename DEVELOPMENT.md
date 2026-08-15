# Local Development Guide

This guide walks you through setting up, developing, testing, and debugging **HireMind AI** on your local workstation.

---

## 🛠 Prerequisites

- **Node.js:** v18.17.0+ (Node 20 LTS recommended)
- **npm:** v9.x or higher
- **Git:** Installed and configured
- **Operating System:** macOS, Linux, or Windows (WSL2 recommended)

---

## ⚡ Quickstart Setup

```bash
# 1. Clone the repository
git clone https://github.com/dikshant363/hiremind-ai.git
cd hiremind-ai

# 2. Install dependencies
npm install

# 3. Setup environment configuration
cp .env.example .env

# 4. Generate Prisma client & initialize SQLite database
npx prisma generate
npx prisma db push

# 5. Start the development server
npm run dev
```

The application will be live at `http://localhost:3000`.

---

## 📦 Project Scripts Reference

| Command | Purpose |
|---|---|
| `npm run dev` | Starts Next.js development server on port 3000 |
| `npm run build` | Builds optimized production standalone bundle |
| `npm run start` | Runs the production standalone server |
| `npm run lint` | Runs ESLint over all TypeScript and React files |
| `npx tsc --noEmit` | Performs strict static TypeScript type validation |
| `npm run db:push` | Synchronizes Prisma schema with local database |
| `npm run db:generate` | Generates TypeScript client types from `schema.prisma` |
| `npm run db:migrate` | Runs database migrations (PostgreSQL environments) |

---

## 🧪 Running the Test Suites

HireMind AI includes an extensive suite of automated test harnesses in the `tests/` directory:

```bash
# 1. Authentication, HMAC Tokens & Admin Config Tests
node tests/auth-and-config-qa.mjs

# 2. End-to-End Runtime Candidate & Adaptive Interview Tests
node tests/runtime-qa.mjs

# 3. Multi-Candidate Input Differentiation Tests
node tests/multi-candidate-qa.mjs

# 4. Mathematical Formula & Scoring Parameter Tests
node tests/all-parameters-qa.mjs

# 5. 10-Run Consecutive Demo Workflow Stability Tests
node tests/ten-run-demo-qa.mjs

# 6. Complete Red-Team Verification Harness
node scratch/redteam-test.mjs
```

---

## 🗄 Database Management

### Inspecting Local Data
To open the visual Prisma database studio:
```bash
npx prisma studio
```
Visit `http://localhost:5555` to view user accounts, analysis sessions, and audit events.

### Resetting Local Database
To start with a clean local database:
```bash
rm -f db/custom.db
npx prisma db push
```

---

## 🌐 AI Configuration & Fallback Mode

To test live AI inference, configure your Google AI Studio key in `.env`:
```env
AI_PROVIDER="gemini"
GEMINI_API_KEY="your-gemini-api-key-here"
```
If no key is configured, HireMind AI operates seamlessly using its built-in deterministic heuristic engine.
