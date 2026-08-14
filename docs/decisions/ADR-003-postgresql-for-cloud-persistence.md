# ADR-003: PostgreSQL Architecture for Serverless Cloud Persistence

## Status
Accepted

## Context
SQLite is optimal for local development and unit testing due to zero external dependencies. However, serverless deployment platforms like Vercel operate on ephemeral filesystems where local SQLite database files are wiped on every lambda restart or cold boot. A managed cloud PostgreSQL database is necessary for persistent, scalable production deployment.

## Decision
We established a clean dual-database architecture using Prisma ORM:
1. **Schema Compatibility:** `prisma/schema.prisma` models are designed with universal data types (`String @id @default(cuid())`, `DateTime`, `Boolean`, indexed relational foreign keys) that are 100% compatible with both SQLite and PostgreSQL.
2. **Production Cloud Target:** Managed PostgreSQL (e.g. Neon Serverless Postgres) using connection pooling (`DATABASE_URL` with `?sslmode=require&pgbouncer=true`).
3. **Migration Strategy:**
   - **Local Dev:** SQLite (`DATABASE_URL="file:./dev.db"`) with `prisma db push`.
   - **Production:** PostgreSQL with versioned migrations executed via `prisma migrate deploy` during Vercel build phase.

## Consequences
### Positive
- Zero data loss on serverless cold boots and auto-scaling events.
- Free-tier compatibility using providers such as Neon or Supabase.
- Developers can run locally with zero cloud configuration using standard SQLite.

### Negative
- Production setup requires provisioning a PostgreSQL connection string in the cloud dashboard.
