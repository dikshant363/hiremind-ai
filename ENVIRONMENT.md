# Environment Configuration Reference

This document provides a comprehensive reference of all environment variables used by **HireMind AI** across Development, Preview, and Production environments.

---

## 🔒 Security Guidelines

- **Never Commit Secrets:** Do not commit `.env` or paste live API keys, database credentials, or secret keys into source code or GitHub issues.
- **Client vs. Server Isolation:** Only variables prefixed with `NEXT_PUBLIC_` are bundled into client-side JavaScript. All sensitive credentials (`DATABASE_URL`, `AUTH_SECRET`, `GEMINI_API_KEY`) remain strictly confined to server-side execution.

---

## 📋 Environment Variables Reference

| Variable | Required | Default | Scope | Description |
|---|---|---|---|---|
| `DATABASE_URL` | **Yes** | `file:../db/custom.db` | Server | SQLite connection path (local) or PostgreSQL connection URI (cloud) |
| `AUTH_SECRET` | **Yes** | Auto-generated in dev | Server | Cryptographic secret used for HMAC-SHA256 session token signatures |
| `PORT` | Optional | `3000` | Server | HTTP port for local Next.js server |
| `NODE_ENV` | Optional | `development` | Server | Runtime mode (`development`, `test`, `production`) |
| `AI_PROVIDER` | Optional | `gemini` | Server | Active AI backend (`gemini` or `deterministic-fallback`) |
| `GEMINI_API_KEY` | Optional | `""` | Server | Google AI Studio API key for live LLM extraction & answer evaluation |
| `GOOGLE_API_KEY` | Optional | `""` | Server | Alternative Google AI API key name |
| `DEBUG_SQL` | Optional | `false` | Server | Set to `true` to log raw Prisma SQL queries to stdout during local debugging |

---

## 🛠 Multi-Environment Setup

### Local Development (`.env`)
```env
DATABASE_URL="file:../db/custom.db"
AUTH_SECRET="your-development-auth-secret-here-at-least-32-chars"
PORT=3000
NODE_ENV=development
AI_PROVIDER="gemini"
GEMINI_API_KEY=""
```

### Production on Vercel + Neon (`Vercel Project Settings`)
```env
DATABASE_URL="postgresql://user:password@endpoint.neon.tech/hiremind?sslmode=require"
AUTH_SECRET="your-production-64-character-hex-secret"
NODE_ENV=production
AI_PROVIDER="gemini"
GEMINI_API_KEY="your-gemini-api-key-here"
```
