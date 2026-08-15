/**
 * HIREMIND AI — Database Client & Connection Manager
 *
 * Provides a singleton PrismaClient with serverless connection pooling
 * for production PostgreSQL (Neon / Supabase / Prisma Postgres).
 *
 * Environment Policy:
 *  - PRODUCTION: Requires PostgreSQL DATABASE_URL. Throws explicitly if missing or SQLite.
 *  - DEVELOPMENT: Uses DATABASE_URL if configured, or falls back to local dev SQLite.
 *  - TEST: Uses isolated test DATABASE_URL.
 */

import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export function getDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL?.trim();
  const isProduction = process.env.NODE_ENV === "production";

  // Production MUST have a valid cloud PostgreSQL connection
  if (isProduction) {
    if (!envUrl) {
      throw new Error(
        "[HIREMIND DB] Production DATABASE_URL environment variable is missing. " +
        "A managed PostgreSQL connection URI (e.g. Neon, Supabase) is required for Vercel production persistence."
      );
    }
    if (envUrl.startsWith("file:") || envUrl.includes(".db") || envUrl.includes(".sqlite")) {
      throw new Error(
        "[HIREMIND DB] SQLite file paths are not supported in production on Vercel. " +
        "Please configure a valid PostgreSQL DATABASE_URL in your Vercel Project Settings."
      );
    }
    return envUrl;
  }

  // Development & Testing: Support PostgreSQL or local SQLite fallback
  if (envUrl) {
    if (envUrl.startsWith("file:")) {
      return resolveLocalSqlitePath(envUrl);
    }
    return envUrl;
  }

  // Development default fallback
  return resolveLocalSqlitePath("file:./db/custom.db");
}

function resolveLocalSqlitePath(fileUrl: string): string {
  const rawPath = fileUrl.replace(/^file:/, "");
  if (path.isAbsolute(rawPath)) {
    return fileUrl;
  }
  const cwd = process.cwd();
  const candidates = [
    path.resolve(/*turbopackIgnore: true*/ cwd, "prisma", rawPath),
    path.resolve(/*turbopackIgnore: true*/ cwd, rawPath),
    path.resolve(/*turbopackIgnore: true*/ cwd, "db", "custom.db"),
    path.resolve(/*turbopackIgnore: true*/ cwd, "prisma", "dev.db"),
    path.resolve(/*turbopackIgnore: true*/ cwd, "..", "..", "db", "custom.db"),
    path.resolve(/*turbopackIgnore: true*/ cwd, "..", "..", "prisma", rawPath),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(/*turbopackIgnore: true*/ candidate)) {
      return `file:${candidate}`;
    }
  }
  return `file:${path.resolve(/*turbopackIgnore: true*/ cwd, "prisma", rawPath)}`;
}

function createPrismaClient(): PrismaClient {
  const dbUrl = getDatabaseUrl();
  const shouldLogQuery = process.env.NODE_ENV === "development" && process.env.DEBUG_SQL === "true";

  return new PrismaClient({
    datasources: { db: { url: dbUrl } },
    log: shouldLogQuery ? ["query", "error", "warn"] : ["error"],
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}