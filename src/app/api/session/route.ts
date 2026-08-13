/**
 * GET /api/session?id=...       → full SessionPayload
 * GET /api/session?list=true    → recent sessions summary (limit 10)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cleanupOldSessions, loadSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const id = params.get("id");
  const list = params.get("list");

  // List mode: return recent sessions
  if (list === "true") {
    // Fire-and-forget: sweep old sessions on every home page load so the
    // Session table never grows unbounded. We deliberately do NOT await this —
    // the list response is the user's primary concern, and the sweep is a
    // background hygiene task. Any error is swallowed inside the promise.
    void cleanupOldSessions().catch((err) => {
      console.warn("[HIREMIND] background session cleanup failed:", err);
    });

    const rows = await db.session.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        isDemo: true,
        status: true,
        createdAt: true,
        jobTitle: true,
        candidateProfileJson: true,
        matchJson: true,
        readinessJson: true,
      },
    });

    const sessions = rows.map((r) => {
      let candidateName: string | null = null;
      let matchIndex: number | null = null;
      let readinessIndex: number | null = null;
      try {
        const candidate = JSON.parse(r.candidateProfileJson);
        candidateName = candidate?.name || null;
      } catch { /* ignore */ }
      try {
        if (r.matchJson) {
          const match = JSON.parse(r.matchJson);
          matchIndex = match?.index ?? null;
        }
      } catch { /* ignore */ }
      try {
        if (r.readinessJson) {
          const readiness = JSON.parse(r.readinessJson);
          readinessIndex = typeof readiness?.index === "number" ? readiness.index : null;
        }
      } catch { /* ignore */ }

      return {
        id: r.id,
        isDemo: r.isDemo,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        jobTitle: r.jobTitle,
        candidateName,
        matchIndex,
        readinessIndex,
      };
    });

    return NextResponse.json({ sessions });
  }

  // Single session mode
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  const payload = await loadSession(id);
  if (!payload) return NextResponse.json({ error: "Session not found." }, { status: 404 });
  return NextResponse.json(payload);
}

export { db };
