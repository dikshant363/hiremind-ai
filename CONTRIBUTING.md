# Contributing to HireMind AI

Thank you for your interest in contributing to **HireMind AI**! We are building an evidence-based recruitment intelligence and interview-readiness platform that combines AI interpretation with transparent, deterministic scoring.

This guide outlines our development workflow, coding conventions, testing requirements, and submission process.

---

## 🏛 Core Architectural Philosophy

Before contributing code, please understand our foundational rule:

> **"AI understands and interprets. Application logic decides and evaluates."**

- **LLMs / NLP** are used strictly for qualitative parsing: understanding resume unstructured text, extracting job requirements, generating conversational questions, and evaluating qualitative nuances in candidate responses.
- **Deterministic Algorithms** calculate all scores: match indexes, gap priorities, overall evaluation weighted aggregates, and readiness indexes.
- **State Integrity:** Malformed AI output is rejected safely without crashing the system; resilient deterministic fallbacks guarantee 100% offline availability.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js:** v18.17.0+ (v20.x LTS recommended)
- **Package Manager:** `npm`
- **Database:** SQLite (local development default) or PostgreSQL (e.g. Neon)

### 2. Local Setup
```bash
# 1. Clone your fork
git clone https://github.com/dikshant363/hiremind-ai.git
cd hiremind-ai

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env

# 4. Generate Prisma client & sync database
npx prisma generate
npx prisma db push

# 5. Start development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌿 Branching & Commit Conventions

### Branch Naming
- `feature/<short-description>` (e.g., `feature/custom-taxonomy-export`)
- `fix/<issue-number>-<short-description>` (e.g., `fix/104-mobile-score-overflow`)
- `docs/<short-description>` (e.g., `docs/neon-postgres-setup`)
- `perf/<short-description>` (e.g., `perf/bundle-split-modals`)

### Commit Messages
We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
- `feat: add PDF upload progress indicator`
- `fix: resolve compound React key collision in candidate skills`
- `docs: add ADR-003 for PostgreSQL migration strategy`
- `perf: eliminate full-viewport continuous mesh keyframes`
- `test: add multi-candidate differentiation integration suite`

---

## 🧪 Quality Gate & Testing Requirements

All contributions must pass the complete quality gate before pull requests can be merged:

```bash
# 1. TypeScript static validation
npx tsc --noEmit

# 2. ESLint code standard check
npm run lint

# 3. Comprehensive test suite execution
node tests/auth-and-config-qa.mjs
node tests/runtime-qa.mjs
node tests/multi-candidate-qa.mjs
node tests/all-parameters-qa.mjs
node tests/ten-run-demo-qa.mjs

# 4. Next.js production build verification
npm run build
```

---

## 📋 Pull Request Process

1. **Check Existing Issues:** Before starting work on major features or architectural changes, search existing issues or open a discussion.
2. **Keep PRs Focused:** Submit small, self-contained pull requests. Avoid mixing refactoring with bug fixes or new features.
3. **Fill the PR Template:** Complete all sections of [`.github/pull_request_template.md`](.github/pull_request_template.md).
4. **No Secrets:** Never commit `.env`, private API keys, database connection strings with passwords, or personal credentials.
5. **No Fake / Mock Logic in Production:** Do not use `Math.random()` or hardcoded scores for production flows.

---

## 🎨 UI & Design Standards

- **Aesthetics:** Apple-inspired, calm, premium, responsive dark/light mode interface.
- **Performance:** Fast transitions (150–200ms). Never introduce continuous unthrottled full-screen GPU blur loops.
- **Accessibility:** Ensure all interactive elements include visible focus rings (`ring-2`), semantic `aria-label` tags, and adhere to WCAG AA contrast standards.

---

## 💬 Community & Code of Conduct

All contributors are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). Be respectful, constructive, and inclusive.
