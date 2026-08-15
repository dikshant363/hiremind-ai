/**
 * GET /api/health
 * Real system health diagnostics and dependency ping.
 *
 * Live tests:
 *  - SQLite database connectivity and query latency
 *  - AI SDK abstraction and provider status
 *  - Document text extractor availability
 *  - Process memory and platform runtime stats
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import os from "os";

export const runtime = "nodejs";

export async function GET() {
  const startTime = performance.now();
  const checks: Record<string, { status: "healthy" | "degraded" | "unhealthy"; latencyMs?: number; message?: string }> = {};

  // 1. Database check
  const dbStart = performance.now();
  const rawDbUrl = process.env.DATABASE_URL?.trim() || "";
  const provider = (rawDbUrl.startsWith("postgresql:") || rawDbUrl.startsWith("postgres:"))
    ? "postgresql"
    : "sqlite";

  try {
    const sessionCount = await db.session.count();
    const dbLatency = Math.round(performance.now() - dbStart);
    checks.database = {
      status: "healthy",
      latencyMs: dbLatency,
      message: `${provider.toUpperCase()} connected (${sessionCount} total sessions, latency ${dbLatency}ms)`,
    };
  } catch (err) {
    checks.database = {
      status: "unhealthy",
      latencyMs: Math.round(performance.now() - dbStart),
      message: `Database error (${provider}): ${(err as Error).message}`,
    };
  }

  // 2. AI provider / abstraction check
  try {
    const { getAIStatus } = await import("@/lib/ai");
    const aiStatus = getAIStatus();
    checks.aiProvider = {
      status: "healthy",
      message: `${aiStatus.message} (${aiStatus.provider} mode)`,
    };
  } catch (err) {
    checks.aiProvider = {
      status: "degraded",
      message: `AI provider notice: ${(err as Error).message}. Built-in deterministic engine is active.`,
    };
  }

  // 3. Document text extractor check
  try {
    const pdf = await import("pdf-parse");
    const mammoth = await import("mammoth");
    if (pdf && mammoth) {
      checks.textExtractor = {
        status: "healthy",
        message: "PDF and DOCX extraction engines online.",
      };
    } else {
      checks.textExtractor = {
        status: "degraded",
        message: "One or more document parsers unavailable.",
      };
    }
  } catch (err) {
    checks.textExtractor = {
      status: "degraded",
      message: `Parser notice: ${(err as Error).message}`,
    };
  }

  // 4. Memory and runtime metrics
  const mem = process.memoryUsage();
  const memoryMB = {
    rss: Math.round(mem.rss / 1024 / 1024),
    heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
    heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
  };

  const totalDuration = Math.round(performance.now() - startTime);

  const isAnyUnhealthy = Object.values(checks).some((c) => c.status === "unhealthy");
  const isAnyDegraded = Object.values(checks).some((c) => c.status === "degraded");
  const overallStatus = isAnyUnhealthy ? "unhealthy" : isAnyDegraded ? "degraded" : "healthy";

  return NextResponse.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    latencyMs: totalDuration,
    checks,
    runtime: {
      platform: os.platform(),
      nodeVersion: process.version,
      uptimeSeconds: Math.round(process.uptime()),
      memory: memoryMB,
    },
  });
}
