/**
 * POST /api/session/cleanup?maxAgeHours=24
 *
 * Sweeps the Session table:
 *   - Sessions older than `maxAgeHours` (default 24h) are deleted.
 *   - The 10 most recent sessions are ALWAYS preserved.
 *   - The 5 most recent demo sessions are ALWAYS preserved.
 *
 * Returns: { deleted: number, remaining: number, cutoff: ISO8601 string }
 *
 * This endpoint is also triggered fire-and-forget by `GET /api/session?list=true`
 * so every home page load sweeps the DB. Calling it directly is useful for
 * manual ops / cron jobs / debugging.
 */

import { NextRequest, NextResponse } from "next/server";
import { cleanupOldSessions } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const maxAgeHoursParam = params.get("maxAgeHours");

  let maxAgeHours = 24;
  if (maxAgeHoursParam) {
    const parsed = Number.parseInt(maxAgeHoursParam, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      maxAgeHours = parsed;
    } else {
      return NextResponse.json(
        { error: "maxAgeHours must be a positive integer." },
        { status: 400 }
      );
    }
  }

  try {
    const result = await cleanupOldSessions(maxAgeHours);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[HIREMIND] session cleanup failed:", err);
    return NextResponse.json(
      { error: "Cleanup failed.", message: (err as Error).message },
      { status: 500 }
    );
  }
}
